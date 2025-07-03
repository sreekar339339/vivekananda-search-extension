/**
 * Shared utilities for Playwright tests
 */

/**
 * Gets the extension ID from a service worker URL or other extension URL
 * @param {string} url - URL containing the extension ID (e.g., chrome-extension://abcdefgh/background.js)
 * @returns {string} The extension ID
 */
export function getExtensionIdFromUrl(url) {
  const match = url.match(/chrome-extension:\/\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Finds the extension ID from available service workers in the browser context
 * @param {import('@playwright/test').BrowserContext} context - The browser context
 * @returns {Promise<string>} The extension ID
 */
export async function getExtensionId(context) {
  const workers = context.serviceWorkers();

  // Try to get ID from existing service workers
  if (workers.length > 0) {
    const url = workers[0].url();
    const id = getExtensionIdFromUrl(url);
    if (id) return id;
  }

  // If no workers or couldn't extract ID, wait for a service worker
  const worker = await context.waitForEvent('serviceworker');
  return getExtensionIdFromUrl(worker.url());
}

/**
 * Waits for search results to appear in the extension popup
 * @param {import('@playwright/test').Page} page - The page object
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} True if results appeared, false if timed out
 */
export async function waitForSearchResults(page, timeout = 15000) {
  try {
    await page.locator('#results div').first().waitFor({ timeout });
    return true;
  } catch (error) {
    console.log('Timeout waiting for search results');
    return false;
  }
}

/**
 * Waits for a search to complete (search button reappears)
 * @param {import('@playwright/test').Page} page - The page object
 * @param {number} timeout - Maximum time to wait in milliseconds
 */
export async function waitForSearchComplete(page, timeout = 15000) {
  await page.getByRole('button', { name: 'Search' }).waitFor({
    state: 'visible',
    timeout,
  });
}

/**
 * Performs a search in the extension popup
 * @param {import('@playwright/test').Page} page - The page object
 * @param {string} searchTerm - The term to search for
 * @returns {Promise<void>}
 */
export async function performSearch(page, searchTerm) {
  await page.getByPlaceholder('Enter search term').fill(searchTerm);
  await page.getByRole('button', { name: 'Search' }).click();

  // Wait for the stop button to appear indicating search has started
  await page.getByRole('button', { name: /stop/i }).waitFor({
    state: 'visible',
    timeout: 5000,
  });
}

/**
 * Sets up network interception for mocking responses from the Vivekananda site
 * @param {import('@playwright/test').BrowserContext} context - The browser context
 * @param {Object} fixtures - Optional map of URL patterns to fixture file paths
 * @returns {Promise<void>}
 */
export async function setupNetworkMocking(context, fixtures = {}) {
  await context.route('https://www.ramakrishnavivekananda.info/**', async route => {
    const url = route.request().url();
    const urlPath = new URL(url).pathname;

    // Check if we have a specific fixture for this URL
    for (const [pattern, fixturePath] of Object.entries(fixtures)) {
      if (urlPath.includes(pattern)) {
        try {
          const fs = await import('fs/promises');
          const content = await fs.readFile(fixturePath, 'utf8');
          return route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: content,
          });
        } catch (error) {
          // console.error(`Error loading fixture ${fixturePath}:`, error);
        }
      }
    }

    // Default mock content if no specific fixture matches
    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Mock Vivekananda Page</title>
      </head>
      <body>
        <h1>Mock Page for ${urlPath}</h1>
        <p>This page does not contain the search term.</p>
      </body>
      </html>
    `;

    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: content,
    });
  });
}
