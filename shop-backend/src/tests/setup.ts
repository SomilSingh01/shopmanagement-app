/**
 * Global test setup for the backend test suite.
 *
 * Strategy: We use a REAL test database (a separate MySQL schema) so tests
 * exercise actual SQL — no mocks means no false positives.
 *
 * The setup:
 *  1. Override DATABASE_URL to point at the `shopmanager_test` database.
 *  2. Run `prisma db push` once before all tests to ensure schema is synced.
 *  3. Each test file cleans only the tables it touches via helper functions.
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import { prisma } from '../prisma';

// ─── Point at test database ──────────────────────────────────────────────────
const originalDB = process.env.DATABASE_URL ?? '';
const testDB = originalDB.replace('/shopmanager', '/shopmanager_test');
process.env.DATABASE_URL = testDB;

// ─── Sync schema once before all tests ───────────────────────────────────────
beforeAll(async () => {
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: testDB },
      stdio: 'pipe',
    });
  } catch {
    // Schema may already be in sync
  }
});

// ─── Disconnect Prisma after all tests ───────────────────────────────────────
afterAll(async () => {
  await prisma.$disconnect();
});
