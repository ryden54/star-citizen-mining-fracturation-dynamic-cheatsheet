import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      include: ['public/script.js'],
    },
  },
});
