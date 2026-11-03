/**
 * Test helpers: shared utilities for creating test data and
 * cleaning up the database between test runs.
 */

import { prisma } from '../prisma';
import { AuthService } from '../services/auth.service';

// ─── Seed helpers ─────────────────────────────────────────────────────────────

export async function createTestUser(overrides: Partial<{
  email: string;
  password: string;
  name: string;
}> = {}) {
  const password = overrides.password ?? 'Password123!';
  const hashedPassword = await AuthService.hashPassword(password);

  return prisma.user.create({
    data: {
      email: overrides.email ?? `test-${Date.now()}@example.com`,
      password: hashedPassword,
      name: overrides.name ?? 'Test User',
    },
  });
}

export function authCookieFor(userId: string): string {
  const token = AuthService.generateToken(userId);
  return `token=${token}`;
}

export async function createTestProduct(userId: string, overrides: Record<string, unknown> = {}) {
  return prisma.product.create({
    data: {
      name: 'Test Product',
      price: 100,
      stock: 50,
      unit: 'pcs',
      type: 'STANDARD',
      userId,
      ...overrides,
    },
  });
}

export async function createTestCustomer(userId: string, overrides: Record<string, unknown> = {}) {
  return prisma.customer.create({
    data: {
      name: 'Test Customer',
      email: `customer-${Date.now()}@example.com`,
      userId,
      ...overrides,
    },
  });
}

// ─── Cleanup helpers ──────────────────────────────────────────────────────────

export async function cleanupUsers(emails: string[]) {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

export async function cleanupAll() {
  // Each in its own try/catch — a missing table never blocks the rest
  const tables = [
    () => prisma.oTP.deleteMany(),
    () => prisma.orderItem.deleteMany(),
    () => prisma.order.deleteMany(),
    () => prisma.bOMItem.deleteMany(),
    () => prisma.manufacturingOrder.deleteMany(),
    () => prisma.product.deleteMany(),
    () => prisma.customer.deleteMany(),
    () => prisma.user.deleteMany(),
  ];
  for (const del of tables) {
    try { await del(); } catch { /* table may not exist yet — safe to ignore */ }
  }
}
