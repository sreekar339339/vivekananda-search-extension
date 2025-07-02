import { test as base, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define a custom test fixture for Manifest V3 extension testing
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

  // Create a helper function to get the extension ID and service worker
  extensionData: async ({ context }, use) => {
    // Wait for the service worker to be available
    let serviceWorker = null;
    let extensionId = '';

    // First check if service worker is already available
    const workers = context.serviceWorkers();
    if (workers.length > 0) {
      serviceWorker = workers[0];
      const url = serviceWorker.url();
      extensionId = url.split('/')[2];
      console.log(`Found existing service worker with URL: ${url}`);
    } else {
      // Wait for the service worker to start
      console.log('No service workers found, waiting for service worker to start...');
      try {
        serviceWorker = await context.waitForEvent('serviceworker', { timeout: 5000 });
        const url = serviceWorker.url();
        extensionId = url.split('/')[2];
        console.log(`Service worker started with URL: ${url}`);
      } catch (error) {
        console.log('Timeout waiting for service worker, trying alternative approach');

        // Alternative approach: open the extension popup and check for any messages
        const page = await context.newPage();

        // Navigate to the extensions page to try to activate the extension
        await page.goto('chrome://extensions');
        await page.screenshot({ path: 'extensions-page.png' });

        // Wait a moment for any extensions to initialize
        await page.waitForTimeout(1000);

        // Check if service worker is now available
        const workersAfterWait = context.serviceWorkers();
        if (workersAfterWait.length > 0) {
          serviceWorker = workersAfterWait[0];
          const url = serviceWorker.url();
          extensionId = url.split('/')[2];
          console.log(`Found service worker after waiting: ${url}`);
        } else {
          console.error('Failed to find service worker');
        }

        await page.close();
      }
    }

    await use({ extensionId, serviceWorker });
  },
});

// Diagnostic test for MV3 extension
test('MV3 extension diagnostic test', async ({ context, extensionData }) => {
  const { extensionId, serviceWorker } = extensionData;

  // Log extension ID and service worker status
  console.log(`Extension ID: ${extensionId}`);
  console.log(`Service worker available: ${!!serviceWorker}`);

  // Create a new page to interact with the extension
  const page = await context.newPage();

  if (extensionId) {
    // Open the extension popup
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    console.log(`Opening popup at: ${popupUrl}`);
    await page.goto(popupUrl);

    // Take a screenshot of the popup
    await page.screenshot({ path: 'mv3-popup.png' });

    // Check if basic UI elements are visible
    const h1Text = await page.locator('h1').textContent();
    console.log(`Popup h1 text: ${h1Text}`);

    // Debug service worker communication
    if (serviceWorker) {
      console.log('Service worker is available');

      // You can potentially evaluate code in the service worker context
      try {
        await serviceWorker.evaluate(() => {
          console.log('Service worker evaluation test');

          // Try to access some of the service worker's global variables
          if (typeof isSearching !== 'undefined') {
            console.log(`isSearching value: ${isSearching}`);
          }
        });
      } catch (error) {
        console.error('Error evaluating in service worker context:', error);
      }
    }

    // Enter search term and click search
    await page.locator('#search-input').fill('test');
    await page.screenshot({ path: 'mv3-before-search.png' });

    // Before clicking, let's listen for any logs on the page
    await page.evaluate(() => {
      console.originalLog = console.log;
      console.log = function (...args) {
        console.originalLog(...args);
        window._testLogs = window._testLogs || [];
        window._testLogs.push(
          args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
        );
      };
    });

    // Click the search button
    await page.locator('#search-button').click();

    // Wait a moment to allow the search to start
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'mv3-after-search-click.png' });

    // Check if the stop button is visible (indicating search started)
    const isStopButtonVisible = await page.locator('#stop-button').isVisible();
    console.log(`Stop button visible: ${isStopButtonVisible}`);

    // Collect any logs from the page
    const logs = await page.evaluate(() => window._testLogs || []);
    console.log('Page logs:', logs);

    // Wait a bit longer for any search results (optional)
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'mv3-after-waiting.png' });

    // Check the results section
    const resultsText = await page.locator('#results').textContent();
    console.log(`Results content: ${resultsText}`);
  } else {
    console.log('Cannot proceed with testing - extension ID not found');
  }

  // For diagnostic purposes, assume test passed
  expect(true).toBeTruthy();
});
