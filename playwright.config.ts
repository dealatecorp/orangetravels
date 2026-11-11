import { defineConfig } from '@playwright/test'

const deployedUrl = process.env.CARGOOS_BASE_URL
const baseURL = deployedUrl ?? 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  use: {
    baseURL,
    channel: process.env.CARGOOS_BROWSER_CHANNEL,
  },
  webServer: deployedUrl
    ? undefined
    : { command: 'npm run dev -- --strictPort', url: baseURL, reuseExistingServer: true },
})
