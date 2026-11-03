/**
 * Manufacturing API Tests
 *
 * This is the most important test file — it tests the BOM transaction logic:
 * - Raw material stock must be deducted atomically
 * - Finished good stock must be incremented
 * - Insufficient stock must throw and rollback the transaction
 *
 * This is your strongest CV talking point, so test it thoroughly.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../prisma';
import { cleanupAll, createTestUser, createTestProduct, authCookieFor } from './helpers';

const app = createApp();
const BASE = '/api/v1/manufacturing';
const BOM_BASE = '/api/v1/bom';

beforeEach(async () => {
  await cleanupAll();
});

afterAll(async () => {
  await cleanupAll();
});

// ─── Helper: set up a full BOM scenario ──────────────────────────────────────
async function setupManufacturingScenario(email: string, rawStock = 100) {
  const user = await createTestUser({ email });

  // Create a FINISHED_GOOD product
  const finishedGood = await createTestProduct(user.id, {
    name: 'Widget FG',
    type: 'FINISHED_GOOD',
    stock: 0,
    price: 500,
  });

  // Create a RAW_MATERIAL product
  const rawMaterial = await createTestProduct(user.id, {
    name: 'Widget RM',
    type: 'RAW_MATERIAL',
    stock: rawStock,
    price: 50,
  });

  // Define BOM: 5 units of rawMaterial needed per finishedGood
  await prisma.bOMItem.create({
    data: {
      finishedGoodId: finishedGood.id,
      rawMaterialId: rawMaterial.id,
      quantity: 5,
      userId: user.id,
    },
  });

  return { user, finishedGood, rawMaterial };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /manufacturing', () => {
  it('creates a PLANNED manufacturing order for a FINISHED_GOOD', async () => {
    const { user, finishedGood } = await setupManufacturingScenario('create-mfg@example.com');

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ productId: finishedGood.id, quantity: 10 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PLANNED');
    expect(res.body.quantity).toBe(10);
  });

  it('returns 400 when trying to manufacture a STANDARD product', async () => {
    const user = await createTestUser({ email: 'standard-mfg@example.com' });
    const standardProduct = await createTestProduct(user.id, { type: 'STANDARD' });

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ productId: standardProduct.id, quantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/FINISHED_GOOD/i);
  });

  it('returns 400 for zero quantity', async () => {
    const { user, finishedGood } = await setupManufacturingScenario('zero-qty@example.com');

    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ productId: finishedGood.id, quantity: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(BASE).send({ productId: 'x', quantity: 1 });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /manufacturing/:id/complete — BOM Transaction', () => {
  it('deducts raw material stock and increments finished good stock atomically', async () => {
    // rawStock = 100, we need 5 per unit, ordering 10 → 50 consumed, 50 left
    const { user, finishedGood, rawMaterial } = await setupManufacturingScenario(
      'complete-mfg@example.com',
      100,
    );

    // Create manufacturing order for 10 units
    const createRes = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ productId: finishedGood.id, quantity: 10 });

    const mfgOrderId = createRes.body.id;

    // Complete the manufacturing order
    const completeRes = await request(app)
      .post(`${BASE}/${mfgOrderId}/complete`)
      .set('Cookie', authCookieFor(user.id));

    expect(completeRes.status).toBe(200);

    // Verify DB state directly — this is the core assertion
    const updatedRaw = await prisma.product.findUnique({ where: { id: rawMaterial.id } });
    const updatedFG = await prisma.product.findUnique({ where: { id: finishedGood.id } });

    expect(updatedRaw?.stock).toBe(50);  // 100 - (5 * 10)
    expect(updatedFG?.stock).toBe(10);   // 0 + 10
  });

  it('returns 400 and does NOT change any stock when raw material is insufficient', async () => {
    // rawStock = 20 — not enough for 10 units (needs 50)
    const { user, finishedGood, rawMaterial } = await setupManufacturingScenario(
      'insufficient-mfg@example.com',
      20,
    );

    const createRes = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ productId: finishedGood.id, quantity: 10 });

    const mfgOrderId = createRes.body.id;

    const completeRes = await request(app)
      .post(`${BASE}/${mfgOrderId}/complete`)
      .set('Cookie', authCookieFor(user.id));

    expect(completeRes.status).toBe(400);
    expect(completeRes.body.message).toMatch(/Insufficient stock/i);

    // CRITICAL: Transaction must have rolled back — stock must be unchanged
    const rawAfter = await prisma.product.findUnique({ where: { id: rawMaterial.id } });
    const fgAfter = await prisma.product.findUnique({ where: { id: finishedGood.id } });

    expect(rawAfter?.stock).toBe(20); // unchanged
    expect(fgAfter?.stock).toBe(0);   // unchanged
  });

  it('returns 400 when trying to complete an already-completed order', async () => {
    const { user, finishedGood } = await setupManufacturingScenario('double-complete@example.com', 100);

    const createRes = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ productId: finishedGood.id, quantity: 5 });

    const id = createRes.body.id;
    await request(app).post(`${BASE}/${id}/complete`).set('Cookie', authCookieFor(user.id));

    // Try to complete again
    const res = await request(app)
      .post(`${BASE}/${id}/complete`)
      .set('Cookie', authCookieFor(user.id));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already completed/i);
  });

  it('returns 400 when product has no BOM defined', async () => {
    const user = await createTestUser({ email: 'no-bom@example.com' });
    const fg = await createTestProduct(user.id, { type: 'FINISHED_GOOD', stock: 0, price: 100 });

    const createRes = await request(app)
      .post(BASE)
      .set('Cookie', authCookieFor(user.id))
      .send({ productId: fg.id, quantity: 5 });

    const res = await request(app)
      .post(`${BASE}/${createRes.body.id}/complete`)
      .set('Cookie', authCookieFor(user.id));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Bill of Materials/i);
  });
});
