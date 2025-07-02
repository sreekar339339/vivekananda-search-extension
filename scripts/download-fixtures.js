#!/usr/bin/env node

// Script to download pages from the Vivekananda website and save them as test fixtures
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '..', 'tests', 'e2e', 'fixtures');

// Ensure the fixtures directory exists
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
  console.log(`Created fixtures directory: ${fixturesDir}`);
}

// List of URLs to download
const urlsToDownload = [
  // Master index page
  'https://www.ramakrishnavivekananda.info/vivekananda/master_index.htm',

  // Key content pages with "soul" references
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_1/lectures_and_discourses/soul_god_and_religion.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_1/lectures_and_discourses/the_hindu_religion.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_4/lectures_and_discourses/the_great_teachers_of_the_world.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_8/lectures_and_discourses/buddhas_message.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_8/writings_poems/to_my_own_soul.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_1/addresses_at_the_parliament/paper_on_hinduism.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_2/practical_vedanta_and_other_lectures/practical_vedanta_part_i.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_3/bhakti-yoga/definition_of_bhakti.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_5/epistles_first_series/052_friend.htm',
  'https://www.ramakrishnavivekananda.info/vivekananda/volume_7/conversations_and_dialogues/from_the_diary_of_a_disciple/scc_xvi.htm',
];

/**
 * Converts a URL to a sanitized filename
 * @param {string} url - The URL to convert
 * @returns {string} - Sanitized filename
 */
function urlToFilename(url) {
  return url.replace('https://www.ramakrishnavivekananda.info/', '').replace(/\//g, '_') + '.html';
}

/**
 * Downloads a URL to the fixtures directory
 * @param {string} url - The URL to download
 * @returns {Promise<void>}
 */
function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const filename = urlToFilename(url);
    const filePath = path.join(fixturesDir, filename);

    console.log(`Downloading ${url} to ${filePath}...`);

    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
          return;
        }

        let data = '';
        response.setEncoding('utf8');

        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {
          fs.writeFileSync(filePath, data, 'utf8');
          console.log(`✅ Downloaded ${url}`);
          resolve();
        });
      })
      .on('error', error => {
        console.error(`❌ Error downloading ${url}:`, error.message);
        reject(error);
      });
  });
}

/**
 * Main function to download all fixtures
 */
async function main() {
  console.log('🔄 Starting download of fixture files...');

  let successCount = 0;
  let failCount = 0;

  for (const url of urlsToDownload) {
    try {
      await downloadUrl(url);
      successCount++;
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failCount++;
      console.error(`Failed to download ${url}:`, error.message);
    }
  }

  console.log(`\n✅ Download complete: ${successCount} files downloaded, ${failCount} failed`);
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
