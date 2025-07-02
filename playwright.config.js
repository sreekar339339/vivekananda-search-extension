// @ts-check
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Special configuration options for testing Manifest V3 Chrome extensions
 */

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    headless: false,
    // Set longer timeouts for extension testing
    actionTimeout: 30000,
    navigationTimeout: 60000,
    // Record videos for debugging
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Configuration for testing Chrome extensions
        launchOptions: {
          headless: false, // Extensions require a head
          slowMo: 50, // Slow down operations for more stable tests
          args: [
            // Load the extension from the dist directory
            `--disable-extensions-except=${path.resolve('./dist')}`,
            `--load-extension=${path.resolve('./dist')}`,
            // Enable browser-specific features needed for extension testing
            '--allow-file-access-from-files'
          ]
        },
        // Additional settings for extension testing
        contextOptions: {
          // Reduce flakiness by setting a reasonable timeout
          timeout: 30000,
          // For the Context API (see test files for browser.newContext())
          permissions: ['notifications']
        }
      },
    },
  ],
  // Pre-test hook to build the extension before running tests
  globalSetup: './tests/e2e/global-setup.js',
});
