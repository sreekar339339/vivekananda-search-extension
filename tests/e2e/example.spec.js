/**
 * Example test for the Vivekananda Search extension
 *
 * This file demonstrates best practices for testing Manifest V3 extensions
 * with Playwright, including proper handling of service workers and
 * network mocking.
 */

import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

// Simple test that properly intercepts network requests
test('search for "soul" with network interception', async () => {
  // Get path to the extension
  const extensionPath = path.resolve('./dist');

  // Create a browser context with the extension loaded
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  // Intercept all network requests to the target website
  await context.route('**/*ramakrishnavivekananda.info**', async route => {
    const url = route.request().url();
    console.log(`Intercepted request to: ${url}`);

    if (url.includes('master_index')) {
      // Master index page with links
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html lang="en">
          <head><title>Master Index</title></head>
          <body>
            <h1>Complete Works of Swami Vivekananda</h1>
            <ul>
              <li><a href="https://www.ramakrishnavivekananda.info/vivekananda/volume_1/lectures_and_discourses/soul_god_and_religion.htm">Soul, God and Religion</a></li>
              <li><a href="https://www.ramakrishnavivekananda.info/vivekananda/volume_8/writings_poems/to_my_own_soul.htm">To My Own Soul</a></li>
            </ul>
          </body>
          </html>
        `,
      });
    } else if (url.includes('soul_god_and_religion')) {
      // Page containing soul content
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html lang="en">
          <head><title>Soul, God and Religion</title></head>
          <body>
            <h1>Soul, God and Religion</h1>
            <p>The soul is not composed of any materials. It is unity indivisible.</p>
            <p>What is the soul of man? The soul is not a compound substance.</p>
          </body>
          </html>
        `,
      });
    } else if (url.includes('to_my_own_soul')) {
      // Another page with soul content
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html lang="en">
          <head><title>To My Own Soul</title></head>
          <body>
            <h1>To My Own Soul</h1>
            <p>The soul remains, and it shall never leave you.</p>
          </body>
          </html>
        `,
      });
    } else {
      // Default response for any other HTML page
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><body><p>Test page for ${url}</p></body></html>`,
      });
    }
  });

  // Wait for the extension to load and get the extension ID
  let extensionId = '';
  try {
    // Wait for service worker to start
    const serviceWorker = await context.waitForEvent('serviceworker', { timeout: 5000 });
    const url = serviceWorker.url();
    extensionId = url.split('/')[2];
    console.log(`Found extension ID from service worker: ${extensionId}`);
  } catch (error) {
    console.log('Timeout waiting for service worker, trying alternative approach');

    // Try to activate the extension by opening extensions page
    const page = await context.newPage();
    await page.goto('chrome://extensions/');
    await page.waitForTimeout(1000);
    await page.close();

    // Try again to find service worker
    const workers = context.serviceWorkers();
    if (workers.length > 0) {
      const url = workers[0].url();
      extensionId = url.split('/')[2];
      console.log(`Found extension ID after waiting: ${extensionId}`);
    }
  }

  if (!extensionId) {
    console.error('Could not determine extension ID');
    await context.close();
    expect(false, 'Extension ID not found').toBeTruthy();
    return;
  }

  // Open the extension popup
  const page = await context.newPage();
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  await page.goto(popupUrl);
  await page.screenshot({ path: 'simple-popup.png' });

  // Verify popup loaded correctly
  const heading = await page.locator('h1').textContent();
  expect(heading).toContain('Search from');

  // Enter search term and click search
  await page.locator('#search-input').fill('soul');
  await page.locator('#search-button').click();

  // Wait for the stop button to appear (search started)
  await page.locator('#stop-button').waitFor({ state: 'visible', timeout: 5000 });
  await page.screenshot({ path: 'simple-searching.png' });

  // Wait for results to appear (may take some time)
  try {
    // Wait for results to appear
    await page.locator('#results div').first().waitFor({ timeout: 30000 });
    await page.screenshot({ path: 'simple-results.png' });

    // Verify results are shown
    const resultElements = await page.locator('#results div').all();
    expect(resultElements.length).toBeGreaterThan(0);

    // Check for highlighted search term
    const resultsText = await page.locator('#results').textContent();
    expect(resultsText.toLowerCase()).toContain('soul');

    console.log('Test passed: Search results found');
  } catch (error) {
    // If results don't appear in time, log the current state
    console.log('Timeout waiting for results');
    await page.screenshot({ path: 'simple-timeout.png' });

    const resultsText = await page.locator('#results').textContent();
    console.log(`Results area content: ${resultsText}`);

    throw error; // Re-throw to fail the test
  }

  // Clean up
  await page.close();
  await context.close();
});
