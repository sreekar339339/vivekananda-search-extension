import { test as base, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

// Define a custom test fixture for extension testing
const test = base.extend({
  // Create a new context with the extension loaded for each test
  context: async ({}, use) => {
    // Get the path to the extension
    const extensionPath = path.resolve('./dist');

    // Launch the persistent context with the extension
    const userDataDir = path.join(__dirname, '..', '..', 'test-user-data-dir');

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

    // Log for debugging
    console.log(`Launched browser with extension from: ${extensionPath}`);

    await use(context);

    // Clean up
    await context.close();
  },

  // Create a helper function to get the extension ID
  extensionId: async ({ context }, use) => {
    // Wait for the extension background page to load
    let backgroundPage;
    try {
      // For Manifest V3, we need to look for service worker instead of background page
      const targets = context.serviceWorkers();
      if (targets.length === 0) {
        console.log('Waiting for service worker to start...');
        backgroundPage = await context.waitForEvent('serviceworker');
      } else {
        backgroundPage = targets[0];
      }

      // Extract the extension ID from the URL
      const url = backgroundPage.url();
      const extensionId = url.split('/')[2];
      console.log(`Found extension ID: ${extensionId}`);

      await use(extensionId);
    } catch (error) {
      console.error('Failed to get extension ID:', error);
      throw error;
    }
  },

  // Setup a page with mock responses for each test
  mockedPage: async ({ context }, use) => {
    // Create a new page
    const page = await context.newPage();

    // Set up URL mocking
    // Map of URLs to fixture filenames
    const urlToFixtureMap = {
      'https://www.ramakrishnavivekananda.info/vivekananda/master_index.htm':
        'vivekananda_master_index.htm.html',
      'https://www.ramakrishnavivekananda.info/vivekananda/volume_1/lectures_and_discourses/soul_god_and_religion.htm':
        'vivekananda_volume_1_lectures_and_discourses_soul_god_and_religion.htm.html',
      // Add more fixture mappings as needed
    };

    // Set up route handlers for the fixtures
    await page.route('https://www.ramakrishnavivekananda.info/**', async route => {
      const url = route.request().url();

      // Check if we have a fixture for this URL
      const fixtureFile = urlToFixtureMap[url];

      if (fixtureFile) {
        const fixturePath = path.join(fixturesDir, fixtureFile);

        // Check if fixture exists
        if (fs.existsSync(fixturePath)) {
          const content = fs.readFileSync(fixturePath, 'utf8');
          await route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: content,
          });
          return;
        }
      }

      // For URLs we don't have fixtures for, return a generic page
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
            <head><title>Generic Test Page</title></head>
            <body>
              <p>This is a generic test page for URL: ${url}</p>
            </body>
          </html>
        `,
      });
    });

    await use(page);
  },
});

// Test the extension
test.describe('Vivekananda Search Extension', () => {
  test('should open popup and search for "soul"', async ({ context, extensionId, mockedPage }) => {
    console.log('Starting test with extension ID:', extensionId);

    // Open the extension popup
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    console.log(`Opening popup URL: ${popupUrl}`);
    await mockedPage.goto(popupUrl);

    // Debug: take a screenshot of the popup
    await mockedPage.screenshot({ path: 'popup-screenshot.png' });

    // Verify the popup loaded correctly
    await expect(mockedPage.locator('h1')).toContainText('Search from', { timeout: 5000 });

    // Enter search term
    await mockedPage.locator('#search-input').fill('soul');

    // Click search button
    await mockedPage.locator('#search-button').click();

    // Wait for search to start
    await expect(mockedPage.locator('#stop-button')).toBeVisible();

    // Wait for results to appear (may take a few seconds)
    await mockedPage.waitForSelector('#results div', { timeout: 30000 });

    // Verify results
    const resultElements = await mockedPage.locator('#results div').all();
    expect(resultElements.length).toBeGreaterThan(0);

    // Take screenshot of results
    await mockedPage.screenshot({ path: 'search-results.png' });

    // Verify the progress bar completes
    await mockedPage.waitForFunction(
      () => {
        const progressBarWidth = document.getElementById('progress-bar').style.width;
        return progressBarWidth === '0%' || progressBarWidth === '100%';
      },
      { timeout: 30000 }
    );

    // Verify search completes
    await expect(mockedPage.locator('#search-button')).toBeVisible();

    // Check results counter
    const resultsCounter = await mockedPage.locator('#results-counter').textContent();
    expect(resultsCounter).toContain('results found');
  });
});
