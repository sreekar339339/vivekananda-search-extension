import { expect } from '@playwright/test';

/**
 * Page Object Model for the extension popup
 */
export class PopupPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object
   * @param {string} extensionId - The extension ID
   */
  constructor(page, extensionId) {
    this.page = page;
    this.extensionId = extensionId;

    // Define page elements using resilient locators
    this.searchInput = page.getByPlaceholder('Enter search term');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resultsContainer = page.locator('#results');
    this.resultsCounter = page.locator('#results-counter');
    this.progressBar = page.locator('#progress-bar');
    this.loadingIndicator = page.locator('.loading-indicator');
    this.scrollToTopButton = page.locator('#scroll-to-top-btn');
  }

  /**
   * Navigate to the extension popup
   */
  async goto() {
    const popupUrl = `chrome-extension://${this.extensionId}/popup.html`;
    await this.page.goto(popupUrl);
  }

  /**
   * Perform a search
   * @param {string} searchTerm - The term to search for
   */
  async search(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.page.press('#search-input', 'Enter');
    // Wait for the button to change to the "Stop" state
    await expect(this.page.getByRole('button', { name: 'Stop' })).toBeVisible({ timeout: 5000 });
  }

  /**
   * Wait for search results to appear
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise<boolean>} - True if results appeared
   */
  async waitForResults(timeout = 15000) {
    try {
      await this.resultsContainer.locator('div').first().waitFor({
        state: 'visible',
        timeout,
      });
      return true;
    } catch (error) {
      console.log('Timeout waiting for search results');
      return false;
    }
  }

  /**
   * Wait for the search to complete (search button reappears)
   * @param {number} timeout - Maximum time to wait in milliseconds
   */
  async waitForSearchComplete(timeout = 15000) {
    await this.searchButton.waitFor({ state: 'visible', timeout });
  }

  /**
   * Stop an ongoing search
   */
  async stopSearch() {
    await this.page.getByRole('button', { name: 'Stop' }).click();
    await this.page.waitForFunction(() => !document.querySelector('#search-button.stop-button'), {
      timeout: 5000,
    });
  }

  /**
   * Get the text content of the results
   * @returns {Promise<string>} - Results text
   */
  async getResultsText() {
    return await this.resultsContainer.textContent();
  }

  /**
   * Get the result count from the counter
   * @returns {Promise<number|null>} - Number of results or null if not found
   */
  async getResultCount() {
    const counterText = await this.resultsCounter.textContent();
    const match = counterText.match(/\((\d+) results.*\)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Click on the first result link
   * @returns {Promise<import('@playwright/test').Page>} - The newly opened page
   */
  async clickFirstResult() {
    const firstLink = this.resultsContainer.locator('div a').first();
    await firstLink.click();
    return this.page.context().waitForEvent('page');
  }

  /**
   * Take a screenshot with a descriptive name
   * @param {string} name - Screenshot name
   */
  async takeScreenshot(name) {
    // Ensure screenshots directory exists
    const fs = await import('fs/promises');
    const path = await import('path');
    const screenshotsDir = path.resolve('./tests/artifacts/screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    const screenshotPath = path.join(screenshotsDir, `${name}.png`);
    await this.page.screenshot({ path: screenshotPath });
  }

  /**
   * Simulate scrolling down in the popup
   * @param {number} scrollY - Amount to scroll vertically
   */
  async scrollDown(scrollY = 300) {
    await this.page.evaluate(y => {
      window.scrollTo(0, y);
    }, scrollY);
  }
}
