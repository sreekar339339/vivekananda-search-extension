import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Gets the extension ID using a background context
 * @param {import('@playwright/test').BrowserContext} context - Playwright browser context
 * @returns {Promise<string>} - The extension ID
 */
export async function getExtensionId(context) {
  // Using a more reliable method to get the extension ID
  // We look for the extension's background page in the browser context
  const backgroundPages = context.backgroundPages();
  if (backgroundPages.length === 0) {
    // If no background pages are found yet, wait for them
    const backgroundPage = await context.waitForEvent('backgroundpage');
    return backgroundPage.url().split('/')[2]; // Extract extension ID from URL
  }

  // If we already have background pages, find our extension
  for (const backgroundPage of backgroundPages) {
    // The URL will be like: chrome-extension://eoihnfimgaeakebnekbhoegconoehfkd/_generated_background_page.html
    const extensionId = backgroundPage.url().split('/')[2];
    return extensionId;
  }

  throw new Error('Could not find extension ID');
}

/**
 * Sets up mock responses for fixture files
 * @param {import('@playwright/test').Page} page - Playwright page
 */
export async function setupFixtureMocks(page) {
  // Map of URLs to fixture filenames
  const urlToFixtureMap = {
    'https://www.ramakrishnavivekananda.info/vivekananda/master_index.htm':
      'vivekananda_master_index.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_1/lectures_and_discourses/soul_god_and_religion.htm':
      'vivekananda_volume_1_lectures_and_discourses_soul_god_and_religion.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_1/lectures_and_discourses/the_hindu_religion.htm':
      'vivekananda_volume_1_lectures_and_discourses_the_hindu_religion.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_4/lectures_and_discourses/the_great_teachers_of_the_world.htm':
      'vivekananda_volume_4_lectures_and_discourses_the_great_teachers_of_the_world.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_8/lectures_and_discourses/buddhas_message.htm':
      'vivekananda_volume_8_lectures_and_discourses_buddhas_message.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_8/writings_poems/to_my_own_soul.htm':
      'vivekananda_volume_8_writings_poems_to_my_own_soul.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_1/addresses_at_the_parliament/paper_on_hinduism.htm':
      'vivekananda_volume_1_addresses_at_the_parliament_paper_on_hinduism.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_2/practical_vedanta_and_other_lectures/practical_vedanta_part_i.htm':
      'vivekananda_volume_2_practical_vedanta_and_other_lectures_practical_vedanta_part_i.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_3/bhakti-yoga/definition_of_bhakti.htm':
      'vivekananda_volume_3_bhakti-yoga_definition_of_bhakti.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_5/epistles_first_series/052_friend.htm':
      'vivekananda_volume_5_epistles_first_series_052_friend.htm.html',
    'https://www.ramakrishnavivekananda.info/vivekananda/volume_7/conversations_and_dialogues/from_the_diary_of_a_disciple/scc_xvi.htm':
      'vivekananda_volume_7_conversations_and_dialogues_from_the_diary_of_a_disciple_scc_xvi.htm.html',
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
}

// Extended test with fixtures helpers
export const test = base.extend({
  extensionId: async ({ context }, use) => {
    const extensionId = await getExtensionId(context);
    await use(extensionId);
  },

  // Setup fixture mocking for each test that needs it
  mockedPage: async ({ page }, use) => {
    await setupFixtureMocks(page);
    await use(page);
  },
});
