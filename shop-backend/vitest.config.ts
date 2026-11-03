import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    hookTimeout: 60000, // prisma db push can take a while
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/controllers/**', 'src/services/**'],
      exclude: ['src/tests/**'],
    },
    // Run test files sequentially to avoid DB conflicts
    sequence: { concurrent: false },
  },
});

