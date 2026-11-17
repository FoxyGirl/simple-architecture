import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      command: 'node e2e/stub/tvmaze.js',
      url: 'http://localhost:3002/__hits',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run server',
      env: { TVMAZE_BASE_URL: 'http://localhost:3002' },
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
