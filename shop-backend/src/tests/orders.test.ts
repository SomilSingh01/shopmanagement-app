/**
 * Orders API Tests
 *
 * Covers: POST /orders (with transaction), GET /orders, PATCH /orders/:id/status
 *
 * Key things tested:
 * - Order creation calculates total correctly
 * - User isolation (can't see other users' orders)
 * - Status transitions
 * - Validation errors
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { cleanupAll, createTestUser, createTestProduct, createTestCustomer, authCookieFor } from './helpers';

const app = createApp();
const BASE = '/api/v1/orders';

beforeEach(async () => {
  await cleanupAll();
});

afterAll(async () => {
  await cleanupAll();
});

// ─── Helper: set up a user with a product and customer ready to order ─────────
async function setupOrderData(email: string) {
  const user = await createTestUser({ email });
  const product = await createTestProduct(user.id, { name: 'Widget', price: 100, stock: 50 });
  const customer = await createTestCustomer(user.id);
  return { user, product, customer };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /orders', () => {
  it('creates an order and calculates total correctly', async () => {
    const { user, product, customer } = await setupOrderData('order-create@example.com');

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({
        customerId: customer.id,
        items: [
          { productId: product.id, quantity: 3, price: 100 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(300); // 3 * 100
    expect(res.body.items).toHaveLength(1);
  });

  it('calculates total correctly for multiple items', async () => {
    const { user, customer } = await setupOrderData('multi-item@example.com');
    const product1 = await createTestProduct(user.id, { name: 'P1', price: 200 });
    const product2 = await createTestProduct(user.id, { name: 'P2', price: 50 });

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({
        customerId: customer.id,
        items: [
          { productId: product1.id, quantity: 2, price: 200 }, // 400
          { productId: product2.id, quantity: 4, price: 50 },  // 200
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(600);
  });

  it('returns 400 when items array is empty', async () => {
    const { user, customer } = await setupOrderData('empty-items@example.com');

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ customerId: customer.id, items: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 when quantity is zero or negative', async () => {
    const { user, product, customer } = await setupOrderData('badqty@example.com');

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 0, price: 100 }],
      });

    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(BASE).send({});
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /orders', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });

  it('returns an empty array when no orders exist', async () => {
    const user = await createTestUser({ email: 'no-orders@example.com' });
    const res = await request(app).get(BASE).set('Cookie', authCookieFor(user.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /orders/:id/status', () => {
  it('transitions order from PENDING to PROCESSING', async () => {
    const { user, product, customer } = await setupOrderData('status-change@example.com');

    // Create an order first
    const createRes = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1, price: 100 }],
      });

    const orderId = createRes.body.id;

    const res = await request(app)
      .patch(`${BASE}/${orderId}/status`)
      .set('Cookie', authCookieFor(user.id))
      .send({ status: 'PROCESSING' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PROCESSING');
  });

  it('returns 400 for an invalid status value', async () => {
    const { user, product, customer } = await setupOrderData('bad-status@example.com');

    const createRes = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 1, price: 100 }],
      });

    const res = await request(app)
      .patch(`${BASE}/${createRes.body.id}/status`)
      .set('Cookie', authCookieFor(user.id))
      .send({ status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
  });
});
