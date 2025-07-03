// @ts-check
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Special configuration options for testing Manifest V3 Chrome extensions
 */

// Enable experimental service worker network events for Manifest V3 extensions
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

// Ensure artifacts directories exist
const artifactsDir = path.resolve('./tests/artifacts');
const screenshotsDir = path.resolve('./tests/artifacts/screenshots');
const videosDir = path.resolve('./tests/artifacts/videos');
const tracesDir = path.resolve('./tests/artifacts/traces');
const testResultsDir = path.resolve('./tests/artifacts/test-results');

// Create directories if they don't exist
[artifactsDir, screenshotsDir, videosDir, tracesDir, testResultsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in files in parallel - disabled for extension testing which can have shared state
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry tests on CI to reduce flakiness
  retries: process.env.CI ? 2 : 0,

  // Limit parallel tests for extensions - increase for faster tests if your tests are isolated
  workers: 1,

  // Reporter to use
  reporter: [['json', { outputFile: path.join(testResultsDir, 'results.json') }]],

  // Store test artifacts (excluding HTML report) in a subdirectory
  outputDir: path.join(artifactsDir, 'test-output'),

  // Pre-test hook to build the extension before running tests
  globalSetup: './tests/e2e/global-setup.js',

  // Configure projects for different browsers/modes
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Base test settings
        trace: 'on-first-retry',
        headless: false,
        actionTimeout: 30000,
        navigationTimeout: 60000,

        // Screenshot configuration
        screenshot: 'only-on-failure',

        // Video configuration
        video: 'retain-on-failure',

        // Configure paths for artifacts
        recordVideo: {
          dir: videosDir,
          size: { width: 1280, height: 720 },
        },

        // Configuration for testing Chrome extensions
        launchOptions: {
          slowMo: 50, // Slow down operations for more stable tests
          args: [
            // Load the extension from the dist directory
            `--disable-extensions-except=${path.resolve('./dist')}`,
            `--load-extension=${path.resolve('./dist')}`,
            // Enable browser-specific features needed for extension testing
            '--allow-file-access-from-files',
          ],
        },

        // Additional settings for extension testing
        contextOptions: {
          timeout: 30000,
          permissions: ['notifications'],
        },
      },
    },

    // Uncomment to add Firefox testing once extension works there
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     // Firefox-specific settings
    //   },
    // },

    // Add mobile emulation project for responsive testing if needed
    // {
    //   name: 'mobile-chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     // Mobile-specific settings
    //   },
    // },
  ],
});
