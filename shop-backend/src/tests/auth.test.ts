/**
 * Auth API Tests
 *
 * Covers: POST /auth/send-otp, POST /auth/register, POST /auth/login, GET /auth/me, POST /auth/logout
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../prisma';
import { cleanupAll, createTestUser, authCookieFor } from './helpers';

const app = createApp();
const BASE = '/api/v1/auth';

// Clean DB before each test to guarantee isolation
beforeEach(async () => {
  await cleanupAll();
});

afterAll(async () => {
  await cleanupAll();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /auth/send-otp', () => {
  it('returns 200 and sends OTP for a new email (SIGNUP)', async () => {
    const res = await request(app)
      .post(`${BASE}/send-otp`)
      .send({ email: 'newuser@example.com', type: 'SIGNUP' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OTP sent successfully');

    // OTP should be persisted in DB
    const otp = await prisma.oTP.findFirst({ where: { email: 'newuser@example.com' } });
    expect(otp).not.toBeNull();
    expect(otp?.code).toHaveLength(6);
  });

  it('returns 400 if email already has an account (SIGNUP)', async () => {
    await createTestUser({ email: 'existing@example.com' });

    const res = await request(app)
      .post(`${BASE}/send-otp`)
      .send({ email: 'existing@example.com', type: 'SIGNUP' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post(`${BASE}/send-otp`)
      .send({ email: 'not-an-email', type: 'SIGNUP' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for FORGOT_PASSWORD when user does not exist', async () => {
    const res = await request(app)
      .post(`${BASE}/send-otp`)
      .send({ email: 'ghost@example.com', type: 'FORGOT_PASSWORD' });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 429 if OTP requested within 30 seconds cooldown', async () => {
    const email = 'cooldown@example.com';
    // First request — succeeds
    await request(app).post(`${BASE}/send-otp`).send({ email, type: 'SIGNUP' });

    // Second request immediately — should hit cooldown
    const res = await request(app)
      .post(`${BASE}/send-otp`)
      .send({ email, type: 'SIGNUP' });

    expect(res.status).toBe(429);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /auth/register', () => {
  it('creates a new user with a valid OTP and returns 201', async () => {
    const email = 'register@example.com';

    // Seed a valid OTP
    await prisma.oTP.create({
      data: {
        email,
        code: '123456',
        type: 'SIGNUP',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        email,
        password: 'Password123!',
        name: 'Somil Singh',
        phone: '9876543210',
        businessType: 'B2C',
        shopName: 'Somil Fashion',
        shopCategory: 'Clothing',
        otpCode: '123456',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.password).toBeUndefined(); // password must NOT be returned
    expect(res.headers['set-cookie']).toBeDefined();  // JWT cookie must be set
  });

  it('returns 400 for an expired OTP', async () => {
    const email = 'expired@example.com';

    await prisma.oTP.create({
      data: {
        email,
        code: '654321',
        type: 'SIGNUP',
        expiresAt: new Date(Date.now() - 1000), // already expired
      },
    });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: 'Password123!', name: 'Test', otpCode: '654321' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('returns 400 for a wrong OTP code', async () => {
    const email = 'wrongotp@example.com';

    await prisma.oTP.create({
      data: {
        email,
        code: '111111',
        type: 'SIGNUP',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: 'Password123!', name: 'Test', otpCode: '999999' });

    expect(res.status).toBe(400);
  });

  it('returns 400 if user already exists', async () => {
    const email = 'dup@example.com';
    await createTestUser({ email });

    await prisma.oTP.create({
      data: {
        email,
        code: '111111',
        type: 'SIGNUP',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: 'Password123!', name: 'Test', otpCode: '111111' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /auth/login', () => {
  it('logs in with correct credentials and sets cookie', async () => {
    await createTestUser({ email: 'login@example.com', password: 'Password123!' });

    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'login@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('login@example.com');
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    await createTestUser({ email: 'badpass@example.com', password: 'RealPassword!' });

    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'badpass@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@example.com', password: 'SomePass123!' });

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /auth/me', () => {
  it('returns the authenticated user with a valid token cookie', async () => {
    const user = await createTestUser({ email: 'me@example.com' });
    const cookie = authCookieFor(user.id);

    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
    expect(res.body.password).toBeUndefined();
  });

  it('returns null (not 401) when unauthenticated', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /auth/logout', () => {
  it('clears the token cookie', async () => {
    const res = await request(app).post(`${BASE}/logout`);
    expect(res.status).toBe(200);
    // Cookie should be cleared (value will be empty or past expiry)
    const cookies: string[] = res.headers['set-cookie'] ?? [];
    expect(cookies.some((c: string) => c.startsWith('token=;') || c.includes('token=;') || c.includes('Expires='))).toBe(true);
  });
});
