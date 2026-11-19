
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./tests/global-setup.js'],
    globalSetupTimeout: 120_000,
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    hookTimeout: 120_000
  }
});
