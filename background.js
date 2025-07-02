let isSearching = false;

chrome.action.onClicked.addListener(tab => {
  chrome.tabs.create({
    url: 'popup.html',
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'search') {
    isSearching = true;
    performSearch(request.query);
  } else if (request.action === 'stopSearch') {
    isSearching = false;
  }
});

let offscreen;

async function parseHTMLWithOffscreen(html) {
  if (!offscreen) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'Parse HTML',
    });
    offscreen = true;
  }
  return await chrome.runtime.sendMessage({
    action: 'parseHTML',
    html,
    target: {
      name: 'offscreen',
    },
  });
}

async function performSearch(query) {
  console.log('Performing search for:', query);
  // Use constant for URL to avoid recreating the string
  const mainIndexUrl = 'https://www.ramakrishnavivekananda.info/vivekananda/master_index.htm';
  const CONCURRENCY = 10;

  // Pre-allocate arrays with reasonable capacity to reduce reallocations
  const urlsToVisit = new Array(1000);
  urlsToVisit[0] = mainIndexUrl;
  let urlsCount = 1;

  const visitedLinks = new Set([mainIndexUrl]);
  let totalLinks = 1;
  let searchedLinks = 0;

  // Reuse the batch array to avoid repeated allocations
  const batch = new Array(CONCURRENCY);

  // Lowercase the query once for case-insensitive comparisons
  const queryLower = query.toLowerCase();

  while (urlsCount > 0 && isSearching) {
    let batchSize = 0;
    while (batchSize < CONCURRENCY && urlsCount > 0) {
      // Take from the end of the array which is O(1) instead of shift() which is O(n)
      batch[batchSize++] = urlsToVisit[--urlsCount];
    }

    if (batchSize === 0) continue;

    // Reuse the same array for promises
    const promises = new Array(batchSize);
    for (let i = 0; i < batchSize; i++) {
      promises[i] = fetchAndSearch(batch[i], query, queryLower);
    }

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const newLinks = result.value;
        const newLinksCount = newLinks.length;

        for (let i = 0; i < newLinksCount; i++) {
          const newLink = newLinks[i];
          const url = new URL(newLink);
          if (!visitedLinks.has(newLink) && url.hostname.endsWith('ramakrishnavivekananda.info')) {
            visitedLinks.add(newLink);
            if (urlsCount === urlsToVisit.length) {
              urlsToVisit.length *= 2; // Double capacity
            }
            urlsToVisit[urlsCount++] = newLink;
            totalLinks++;
          }
        }
      }
    }

    searchedLinks += batchSize;
    const progress = (searchedLinks / totalLinks) * 100;
    chrome.runtime.sendMessage({ action: 'searchProgress', progress });
  }

  console.log('Search complete or stopped.');
  chrome.runtime.sendMessage({ action: 'searchComplete' });
}

async function fetchAndSearch(url, query, queryLower) {
  if (!isSearching) return null;

  // Skip non-Vivekananda domains early to avoid CORS errors
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.endsWith('ramakrishnavivekananda.info')) {
      return [];
    }
    const response = await fetch(url);
    const html = await response.text();
    const { links: rawLinks, paragraphs, title, lang } = await parseHTMLWithOffscreen(html);

    // Skip non-English pages early to avoid unnecessary processing
    if (lang && !lang.toLowerCase().startsWith('en')) {
      return [];
    }

    // Process links more efficiently with a pre-allocated array and filter by domain
    const linkCount = rawLinks.length;
    const validLinks = [];

    for (let i = 0; i < linkCount; i++) {
      const link = rawLinks[i];
      try {
        const fullUrl = new URL(link, url).href;
        const urlObj = new URL(fullUrl);
        // Filter by domain and file extension
        if (
          urlObj.hostname.endsWith('ramakrishnavivekananda.info') &&
          (fullUrl.endsWith('.htm') || fullUrl.endsWith('.html'))
        ) {
          validLinks.push(fullUrl);
        }
      } catch (e) {
        // Silently ignore invalid URLs
      }
    }

    // Find matching paragraphs without unnecessary string conversions
    const matchingParagraphs = [];
    const paraCount = paragraphs.length;

    for (let i = 0; i < paraCount; i++) {
      const p = paragraphs[i];
      if (p.toLowerCase().includes(queryLower)) {
        matchingParagraphs.push(p);
      }
    }

    if (matchingParagraphs.length > 0) {
      // Only process results if we found matches
      const found = [];
      const regex = new RegExp(query, 'gi'); // Create regex once

      for (const p of matchingParagraphs) {
        // Split text only when necessary
        const sentences = p.split(/(?<=[.?!])\s+/);
        let matchingSentence = p; // Default to full paragraph

        // Find first matching sentence
        for (const s of sentences) {
          if (s.toLowerCase().includes(queryLower)) {
            matchingSentence = s;
            break;
          }
        }

        found.push({
          url,
          title,
          paragraph: matchingSentence.replace(regex, '<b>$&</b>'),
        });
      }

      if (found.length > 0) {
        chrome.runtime.sendMessage({ action: 'searchResult', results: found });
      }
    }

    return validLinks;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return [];
  }
}
