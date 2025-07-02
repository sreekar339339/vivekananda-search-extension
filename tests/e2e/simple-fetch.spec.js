/**
 * Simple test for fetching and parsing HTML
 * This tests the core functionality without browser extension complexity
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('verify HTML parsing works correctly', async ({ page }) => {
  // Set up interception for the website
  await page.route('**/*.htm*', async route => {
    const url = route.request().url();
    console.log(`Intercepted request to: ${url}`);

    // Master index page
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Test Page</title></head>
        <body>
          <p>This is a test page with the word "soul" in it.</p>
          <p>The soul is not composed of any materials.</p>
        </body>
        </html>
      `,
    });
  });

  // Navigate to a test page
  await page.goto('https://www.ramakrishnavivekananda.info/test.html');

  // Check that the content loaded
  const bodyText = await page.textContent('body');
  expect(bodyText).toContain('soul');

  // Create a simple HTML parser test
  await page.evaluate(() => {
    // Define a simple HTML parser (similar to the extension's parser)
    function parseHTML(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract paragraphs
      const paragraphs = [];
      doc.querySelectorAll('p').forEach(p => {
        paragraphs.push(p.textContent);
      });

      return paragraphs;
    }

    // Test with the current page's HTML
    const html = document.documentElement.outerHTML;
    const paragraphs = parseHTML(html);

    // Log the results
    console.log('Parsed paragraphs:', paragraphs);

    // Check if any paragraph contains "soul"
    const hasSoul = paragraphs.some(p => p.toLowerCase().includes('soul'));
    console.log('Contains "soul":', hasSoul);

    // Store result for test verification
    window._testResult = {
      paragraphs,
      hasSoul,
    };
  });

  // Verify the parser found the content
  const testResult = await page.evaluate(() => window._testResult);
  expect(testResult.hasSoul).toBe(true);
  expect(testResult.paragraphs.length).toBeGreaterThan(0);
  expect(testResult.paragraphs.some(p => p.includes('soul'))).toBe(true);

  console.log('HTML parsing test passed');
});
