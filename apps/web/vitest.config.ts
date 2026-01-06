import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Configuration for E2E Test Utilities
 * Used for testing helper functions and utilities
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['e2e/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['e2e/helpers/**', 'e2e/fixtures/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/e2e': path.resolve(__dirname, './e2e'),
    },
  },
});
