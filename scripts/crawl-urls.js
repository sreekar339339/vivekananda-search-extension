import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure crawler
const CONCURRENCY = 10;
const MAX_PAGES = 5000;
const START_URL = 'https://www.ramakrishnavivekananda.info/vivekananda/master_index.htm';
// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'url-list.js');

// Track visited URLs and queue
const visitedUrls = new Set();
const urlQueue = [START_URL];
let totalProcessed = 0;

// Function to extract links from HTML without DOM parsing
function extractLinks(html, baseUrl) {
  const links = new Set();
  const hrefRegex = /href=["'](.*?)["']/gi;
  let match;
  
  while ((match = hrefRegex.exec(html)) !== null) {
    try {
      const link = match[1];
      if (link && !link.startsWith('javascript:') && !link.startsWith('#') && !link.startsWith('mailto:')) {
        const fullUrl = new URL(link, baseUrl).href;
        
        // Only include .htm and .html files from the Vivekananda site
        if (fullUrl.includes('ramakrishnavivekananda.info/vivekananda') && 
            (fullUrl.endsWith('.htm') || fullUrl.endsWith('.html')) &&
            !fullUrl.includes('/images/') && 
            !fullUrl.includes('/downloads/') &&
            !fullUrl.includes('/bengali/') &&
            !fullUrl.includes('/bangla/')) {
          links.add(fullUrl);
        }
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  }
  
  return [...links];
}

// Function to fetch and process a URL
async function processUrl(url) {
  try {
    // Skip if already visited
    if (visitedUrls.has(url)) {
      return [];
    }
    
    visitedUrls.add(url);
    console.log(`Fetching (${visitedUrls.size}/${totalProcessed}): ${url}`);
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    // Check content type
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html')) {
      return [];
    }
    
    const html = await response.text();
    
    // Quick check for non-English pages
    if (html.includes('<html lang="bn">') || 
        html.includes('<!-- Bengali -->') || 
        url.includes('/bengali/') || 
        url.includes('/bangla/')) {
      console.log(`Skipping non-English page: ${url}`);
      return [];
    }
    
    // Extract links
    return extractLinks(html, url);
  } catch (error) {
    console.error(`Error processing ${url}:`, error.message);
    return [];
  }
}

// Main crawler function
async function crawl() {
  console.log('Starting crawler...');
  
  while (urlQueue.length > 0 && visitedUrls.size < MAX_PAGES) {
    // Take batch of URLs to process
    const batch = [];
    const batchSize = Math.min(CONCURRENCY, urlQueue.length);
    
    for (let i = 0; i < batchSize; i++) {
      batch.push(urlQueue.shift());
    }
    
    // Process batch concurrently
    const results = await Promise.all(batch.map(processUrl));
    totalProcessed += batch.length;
    
    // Add new URLs to queue
    for (const newLinks of results) {
      for (const link of newLinks) {
        if (!visitedUrls.has(link) && !urlQueue.includes(link)) {
          urlQueue.push(link);
        }
      }
    }
    
    console.log(`Progress: ${visitedUrls.size} URLs visited, ${urlQueue.length} in queue`);
  }
  
  console.log(`Crawling completed! Found ${visitedUrls.size} URLs.`);
  return [...visitedUrls];
}

// Generate JavaScript file with URL list
function generateUrlsFile(urls) {
  const content = `// Auto-generated URL list for Vivekananda search extension
// Generated on ${new Date().toISOString()}
// Contains ${urls.length} URLs

export const preloadedUrls = ${JSON.stringify(urls, null, 2)};
`;
  
  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`URL list written to ${OUTPUT_FILE}`);
}

// Run the crawler
console.log('Running crawler script...');
crawl().then(urls => {
  generateUrlsFile(urls);
  console.log(`Done! Found ${urls.length} URLs.`);
}).catch(error => {
  console.error('Crawl failed:', error);
  process.exit(1);
});
