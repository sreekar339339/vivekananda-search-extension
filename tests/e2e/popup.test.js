import { test } from './test-fixtures.js';
import { expect } from '@playwright/test';
import { PopupPage } from './pages/popup-page';

test.describe('Extension Popup Functionality', () => {
  let popupPage;

  test.beforeEach(async ({ mockedPage, extensionId }) => {
    popupPage = new PopupPage(mockedPage, extensionId);
    await popupPage.goto();
  });

  test('should display the correct initial UI elements', async () => {
    await popupPage.takeScreenshot('initial-state');
    await expect(popupPage.searchInput).toBeVisible();
    await expect(popupPage.searchInput).toHaveValue('');
    await expect(popupPage.searchButton).toBeVisible();
    await expect(popupPage.page.getByRole('button', { name: 'Stop' })).not.toBeVisible();
    const resultsText = await popupPage.getResultsText();
    expect(resultsText.trim()).toBe('');
    await popupPage.progressBar.waitFor({ state: 'attached' });
  });

  test('should find and display results when searching for a valid term', async () => {
    await popupPage.search('soul');
    await popupPage.waitForResults();
    await popupPage.waitForSearchComplete();
    await popupPage.takeScreenshot('valid-search-results');
    const resultsText = await popupPage.getResultsText();
    expect(resultsText.toLowerCase()).toContain('soul');
    const resultCount = await popupPage.getResultCount();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('should show "No results found" when searching for a nonsense term', async () => {
    await popupPage.search('xyznonexistentterm123');
    await popupPage.waitForSearchComplete();
    await popupPage.takeScreenshot('no-results-found');
    const resultsText = await popupPage.getResultsText();
    expect(resultsText).toContain('No results found');
  });

  test('should highlight search terms in results', async () => {
    await popupPage.search('soul');
    await popupPage.waitForResults();
    const resultsHTML = await popupPage.resultsContainer.innerHTML();
    expect(resultsHTML).toContain('<b>soul</b>');
  });

  test('should show scroll-to-top button when scrolled down', async ({ mockedPage }) => {
    await popupPage.search('the');
    await popupPage.waitForResults();
    await popupPage.waitForSearchComplete();
    await expect(popupPage.scrollToTopButton).not.toBeVisible();
    await popupPage.scrollDown(500);
    await mockedPage.waitForTimeout(500);
    await popupPage.takeScreenshot('scroll-button-visible');
    await expect(popupPage.scrollToTopButton).toBeVisible({ timeout: 5000 });
    await popupPage.scrollToTopButton.click();
    await mockedPage.waitForTimeout(500);
    await expect(popupPage.scrollToTopButton).not.toBeVisible({ timeout: 5000 });
  });

  test('should have responsive layout at different viewport sizes', async ({ mockedPage }) => {
    await mockedPage.setViewportSize({ width: 800, height: 600 });
    await popupPage.takeScreenshot('responsive-desktop');
    let searchContainerWidth = await mockedPage
      .locator('.search-container')
      .evaluate(el => el.offsetWidth);
    expect.soft(searchContainerWidth).toBeGreaterThan(400);

    await mockedPage.setViewportSize({ width: 375, height: 667 });
    await popupPage.takeScreenshot('responsive-mobile');
    searchContainerWidth = await mockedPage
      .locator('.search-container')
      .evaluate(el => el.offsetWidth);
    expect.soft(searchContainerWidth).toBeLessThan(375);

    await expect.soft(popupPage.searchInput).toBeVisible();
    await expect.soft(popupPage.searchButton).toBeVisible();
  });
});
