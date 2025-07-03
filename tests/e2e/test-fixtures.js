import { test as base, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupNetworkMocking, getExtensionId } from './utils/test-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Set up extension test fixtures
 */
export const test = base.extend({
  // Create a new context with the extension loaded for each test
  context: async ({}, use) => {
    // Enable service worker network events
    process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

    // Get the path to the extension
    const extensionPath = path.resolve('./dist');

    // Launch the persistent context with the extension
    const userDataDir = path.join(__dirname, '..', 'artifacts', 'test-user-data-dir');

    // Create the user data directory if it doesn't exist
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    // Launch a persistent context with the extension installed
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions require a head
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--allow-file-access-from-files',
      ],
    });

    // Set up mock routes
    await setupNetworkMocking(context, {
      the_ideal_of_a_universal_religion: path.join(
        __dirname,
        'fixtures/the_ideal_of_a_universal_religion.html'
      ),
      the_gita_i: path.join(__dirname, 'fixtures/the_gita_i.html'),
      the_real_and_the_apparent_man: path.join(
        __dirname,
        'fixtures/the_real_and_the_apparent_man.html'
      ),
      my_master: path.join(__dirname, 'fixtures/my_master.html'),
      the_east_and_the_west: path.join(__dirname, 'fixtures/the_east_and_the_west.html'),
      women_of_india: path.join(__dirname, 'fixtures/women_of_india.html'),
      the_soul_and_god: path.join(__dirname, 'fixtures/the_soul_and_god.html'),
      practical_vedanta: path.join(__dirname, 'fixtures/practical_vedanta.html'),
      the_freedom_of_the_soul: path.join(__dirname, 'fixtures/the_freedom_of_the_soul.html'),
      bhakti_or_devotion: path.join(__dirname, 'fixtures/bhakti_or_devotion.html'),
    });

    await use(context);

    // Cleanup
    await context.close();
  },

  // Add the extensionId fixture
  extensionId: async ({ context }, use) => {
    const extensionId = await getExtensionId(context);
    await use(extensionId);
  },

  // Create a page with mocked network requests
  mockedPage: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});
