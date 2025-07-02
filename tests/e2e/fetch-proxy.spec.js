/**
 * This test uses a different approach to intercept fetch requests
 * by setting up the browser to proxy all traffic through a handler
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test('use proxy approach for network interception', async ({ browser }) => {
  // Get the path to the extension
  const extensionPath = path.resolve('./dist');

  // Launch a new browser instance with the extension loaded
  const pathToExtension = path.resolve('./dist');  
  const context = await browser.newContext({
    // We need to use persistent context for extensions
    recordVideo: { dir: 'videos/' },
    viewport: { width: 1280, height: 720 }
  });
  
  // Load the extension in a new page
  const extensionsPage = await context.newPage();
  await extensionsPage.goto('about:blank');
  
  // Set up interception for the specific domain only
  await context.route('**/*ramakrishnavivekananda.info**', async (route) => {
    const request = route.request();
    const url = request.url();
    
    // Only intercept requests to the target domain
    if (url.includes('ramakrishnavivekananda.info')) {
      console.log(`Intercepted request to: ${url}`);
      
      // Mock different responses based on the URL
      if (url.includes('master_index.htm')) {
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
          `
        });
      } 
      else if (url.includes('soul_god_and_religion.htm')) {
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
          `
        });
      }
      else if (url.includes('to_my_own_soul.htm')) {
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
          `
        });
      }
      else {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `<html><body><p>Test page for ${url}</p></body></html>`
        });
      }
    } else {
      // For all other requests, proceed normally
      await route.continue();
    }
  });

  // Get the extension ID
  let extensionId = '';
  try {
    // Wait for service worker to start
    const serviceWorker = await context.waitForEvent('serviceworker', { timeout: 5000 });
    const url = serviceWorker.url();
    extensionId = url.split('/')[2];
    console.log(`Found extension ID: ${extensionId}`);
  } catch (error) {
    console.log('Service worker not found within timeout');
    
    // Open extensions page to activate extensions
    const page = await context.newPage();
    await page.goto('chrome://extensions/');
    await page.waitForTimeout(2000);
    await page.close();
    
    // Check again for service workers
    const workers = context.serviceWorkers();
    if (workers.length > 0) {
      const url = workers[0].url();
      extensionId = url.split('/')[2];
      console.log(`Found extension ID after retry: ${extensionId}`);
    }
  }
  
  if (!extensionId) {
    throw new Error('Could not determine extension ID');
  }
  
  // Open the extension popup
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.screenshot({ path: 'proxy-popup.png' });
  
  // Enter search term
  await page.locator('#search-input').fill('soul');
  await page.locator('#search-button').click();
  
  // Wait for search to start
  await page.locator('#stop-button').waitFor({ state: 'visible', timeout: 5000 });
  await page.screenshot({ path: 'proxy-searching.png' });
  
  // Wait for results
  console.log('Waiting for search results to appear...');
  try {
    await page.locator('#results div').first().waitFor({ timeout: 30000 });
    await page.screenshot({ path: 'proxy-results.png' });
    
    // Verify results
    const resultElements = await page.locator('#results div').all();
    expect(resultElements.length).toBeGreaterThan(0);
    
    // Verify content
    const resultsText = await page.locator('#results').textContent();
    expect(resultsText.toLowerCase()).toContain('soul');
    
    console.log('Test passed: Search results found');
  } catch (error) {
    console.error('Timeout waiting for results');
    await page.screenshot({ path: 'proxy-timeout.png' });
    
    const resultsText = await page.locator('#results').textContent();
    console.log(`Results area content: ${resultsText}`);
    
    throw error; // Re-throw to fail the test
  } finally {
    // Clean up
    await page.close();
    await context.close();
  }
});
