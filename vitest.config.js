import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.test.js'], // Only include unit tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
    globals: true,
    testTimeout: 5000, // Reduced since we're only testing pure functions now
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
