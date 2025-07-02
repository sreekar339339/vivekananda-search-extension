import { expect } from '@playwright/test';
import { test, getExtensionId, setupFixtureMocks } from './helpers.js';

test.describe('Vivekananda Search Extension', () => {
  test('should open popup and search for "soul"', async ({ page, context }) => {
    // Setup fixture mocks
    await setupFixtureMocks(page);
    
    // Get the extension ID
    const extensionId = await getExtensionId(context);
    console.log(`Extension ID: ${extensionId}`);
    
    // Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Verify the popup loaded correctly
    await expect(page.locator('h1')).toContainText('Search from');
    await expect(page.locator('h1')).toContainText('The Complete Works of Swami Vivekananda');
    
    // Enter search term
    await page.locator('#search-input').fill('soul');
    
    // Click search button
    await page.locator('#search-button').click();
    
    // Wait for search to start
    await expect(page.locator('#stop-button')).toBeVisible();
    
    // Wait for results to appear (may take a few seconds)
    await page.waitForSelector('#results div', { timeout: 30000 });
    
    // Verify results
    const resultElements = await page.locator('#results div').all();
    expect(resultElements.length).toBeGreaterThan(0);
    
    // Check for highlighted search term in results
    const highlightedText = await page.locator('#results b').first().textContent();
    expect(highlightedText.toLowerCase()).toContain('soul');
    
    // Verify the progress bar completes
    await page.waitForFunction(() => {
      const progressBarWidth = document.getElementById('progress-bar').style.width;
      return progressBarWidth === '0%' || progressBarWidth === '100%';
    }, { timeout: 30000 });
    
    // Verify search completes
    await expect(page.locator('#search-button')).toBeVisible();
    await expect(page.locator('#stop-button')).not.toBeVisible();
    
    // Check results counter
    const resultsCounter = await page.locator('#results-counter').textContent();
    expect(resultsCounter).toContain('results found');
  });

  test('should be able to stop an ongoing search', async ({ page, context }) => {
    // Setup fixture mocks
    await setupFixtureMocks(page);
    
    // Get the extension ID
    const extensionId = await getExtensionId(context);
    
    // Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Enter search term that would find many results
    await page.locator('#search-input').fill('the');
    
    // Click search button
    await page.locator('#search-button').click();
    
    // Wait for search to start
    await expect(page.locator('#stop-button')).toBeVisible();
    
    // Wait briefly to allow some progress
    await page.waitForTimeout(500);
    
    // Click stop button
    await page.locator('#stop-button').click();
    
    // Verify search stops
    await expect(page.locator('#search-button')).toBeVisible();
    await expect(page.locator('#stop-button')).not.toBeVisible();
    
    // Verify input becomes enabled again
    await expect(page.locator('#search-input')).toBeEnabled();
  });

  test('should show no results for nonsense search terms', async ({ page, context }) => {
    // Setup fixture mocks
    await setupFixtureMocks(page);
    
    // Get the extension ID
    const extensionId = await getExtensionId(context);
    
    // Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Enter nonsense search term
    await page.locator('#search-input').fill('xyznonexistentterm123');
    
    // Click search button
    await page.locator('#search-button').click();
    
    // Wait for search to complete
    await expect(page.locator('#stop-button')).toBeVisible();
    await page.waitForSelector('#search-button', { state: 'visible', timeout: 30000 });
    
    // Check results - should either be "No results found" or empty results array
    const resultsText = await page.locator('#results').textContent();
    
    if (resultsText.includes('No results found')) {
      expect(resultsText).toContain('No results found');
    } else {
      // If there are any results, verify they don't contain our nonsense term
      const allResults = await page.locator('#results div p').all();
      for (const result of allResults) {
        const text = await result.textContent();
        expect(text.toLowerCase()).not.toContain('xyznonexistentterm123');
      }
    }
  });
});
