import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ holds Playwright specs (run via `npm run test:e2e`), not Vitest
    // ones - both use the same *.spec.ts naming, so this exclusion is load
    // -bearing, not stylistic.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      include: ['src/lib/**'],
      exclude: ['src/lib/**/types.ts', 'src/lib/**/fixtures.ts'],
      thresholds: {
        lines: 90,
      },
    },
  },
});
