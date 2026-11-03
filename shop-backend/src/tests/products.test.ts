/**
 * Products API Tests
 *
 * Covers: GET /products, POST /products, PUT /products/:id, DELETE /products/:id
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { cleanupAll, createTestUser, createTestProduct, authCookieFor } from './helpers';

const app = createApp();
const BASE = '/api/v1/products';

beforeEach(async () => {
  await cleanupAll();
});

afterAll(async () => {
  await cleanupAll();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /products', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });

  it('returns only the authenticated user\'s products', async () => {
    const user1 = await createTestUser({ email: 'user1@example.com' });
    const user2 = await createTestUser({ email: 'user2@example.com' });

    await createTestProduct(user1.id, { name: 'User1 Product' });
    await createTestProduct(user2.id, { name: 'User2 Product' });

    const res = await request(app)
      .get(BASE)
      .set('Cookie', authCookieFor(user1.id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('User1 Product');
  });

  it('returns an empty array when user has no products', async () => {
    const user = await createTestUser({ email: 'empty@example.com' });
    const res = await request(app).get(BASE).set('Cookie', authCookieFor(user.id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /products', () => {
  it('creates a product and returns 201', async () => {
    const user = await createTestUser({ email: 'creator@example.com' });

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ name: 'New Widget', price: 299, stock: 100, unit: 'pcs', type: 'STANDARD' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Widget');
    expect(res.body.userId).toBe(user.id);
  });

  it('returns 400 if name is too short', async () => {
    const user = await createTestUser({ email: 'val@example.com' });

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ name: 'X', price: 10 }); // name min length is 2

    expect(res.status).toBe(400);
  });

  it('returns 400 if price is negative', async () => {
    const user = await createTestUser({ email: 'negprice@example.com' });

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ name: 'Bad Product', price: -50 });

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post(BASE).send({ name: 'Ghost', price: 10 });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /products/:id', () => {
  it('deletes the product and returns 204', async () => {
    const user = await createTestUser({ email: 'deleter@example.com' });
    const product = await createTestProduct(user.id);

    const res = await request(app)
      .delete(`${BASE}/${product.id}`)
      .set('Cookie', authCookieFor(user.id));

    expect(res.status).toBe(204);
  });

  it('returns 404 when trying to delete another user\'s product', async () => {
    const owner = await createTestUser({ email: 'owner@example.com' });
    const attacker = await createTestUser({ email: 'attacker@example.com' });
    const product = await createTestProduct(owner.id);

    const res = await request(app)
      .delete(`${BASE}/${product.id}`)
      .set('Cookie', authCookieFor(attacker.id));

    expect(res.status).toBe(404); // Can't see other user's data
  });

  it('returns 404 for non-existent product id', async () => {
    const user = await createTestUser({ email: 'ghost-delete@example.com' });

    const res = await request(app)
      .delete(`${BASE}/non-existent-uuid-1234`)
      .set('Cookie', authCookieFor(user.id));

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /products/:id', () => {
  it('updates product name and price', async () => {
    const user = await createTestUser({ email: 'updater@example.com' });
    const product = await createTestProduct(user.id, { name: 'Old Name', price: 50 });

    const res = await request(app)
      .put(`${BASE}/${product.id}`)
      .set('Cookie', authCookieFor(user.id))
      .send({ name: 'New Name', price: 150 });

    expect(res.status).toBe(200);
  });

  it('cannot update another user\'s product', async () => {
    const owner = await createTestUser({ email: 'owner2@example.com' });
    const intruder = await createTestUser({ email: 'intruder@example.com' });
    const product = await createTestProduct(owner.id);

    const res = await request(app)
      .put(`${BASE}/${product.id}`)
      .set('Cookie', authCookieFor(intruder.id))
      .send({ name: 'Hacked' });

    expect(res.status).toBe(404);
  });
});
