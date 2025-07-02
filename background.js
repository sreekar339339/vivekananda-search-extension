let isSearching = false;

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: 'popup.html'
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
            justification: 'Parse HTML' 
        });
        offscreen = true;
    }
    return await chrome.runtime.sendMessage({ 
        action: 'parseHTML', 
        html, 
        target: { 
            name: 'offscreen' 
        }
    });
}

async function performSearch(query) {
    console.log('Performing search for:', query);
    const mainIndexUrl = 'https://www.ramakrishnavivekananda.info/vivekananda/master_index.htm';
    const CONCURRENCY = 10;

    const urlsToVisit = [mainIndexUrl];
    const visitedLinks = new Set([mainIndexUrl]);
    let totalLinks = 1;
    let searchedLinks = 0;

    while (urlsToVisit.length > 0 && isSearching) {
        const batch = [];
        while (batch.length < CONCURRENCY && urlsToVisit.length > 0) {
            const url = urlsToVisit.shift();
            batch.push(url);
        }

        if (batch.length === 0) continue;

        const promises = batch.map(url => fetchAndSearch(url, query));
        const results = await Promise.allSettled(promises);

        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                for (const newLink of result.value) {
                    if (!visitedLinks.has(newLink)) {
                        visitedLinks.add(newLink);
                        urlsToVisit.push(newLink);
                        totalLinks++;
                    }
                }
            }
        }
        searchedLinks += batch.length;
        const progress = (searchedLinks / totalLinks) * 100;
        chrome.runtime.sendMessage({ action: 'searchProgress', progress });
    }

    console.log('Search complete or stopped.');
    chrome.runtime.sendMessage({ action: 'searchComplete' });
}

async function fetchAndSearch(url, query) {
  if (!isSearching) return null;

  console.log('Fetching and searching:', url);
  try {
    const response = await fetch(url);
    const html = await response.text();
    const { links: rawLinks, paragraphs, title, lang } = await parseHTMLWithOffscreen(html);

    if (lang && !lang.toLowerCase().startsWith('en')) {
        console.log(`Skipping non-English page: ${url}`);
        return []; // Skip non-English pages
    }

    let links = rawLinks.map(link => new URL(link, url).href).filter(link => link.startsWith('http') && (link.endsWith('.htm') || link.endsWith('.html')));
    const matchingParagraphs = paragraphs.filter(p => p.toLowerCase().includes(query.toLowerCase()));

    const found = matchingParagraphs.map(p => {
      const sentences = p.split(/(?<=[.?!])\s+/);
      const matchingSentence = sentences.find(s => s.toLowerCase().includes(query.toLowerCase())) || p;
      return {
        url,
        title,
        paragraph: matchingSentence.replace(new RegExp(query, 'gi'), '<b>$&</b>')
      };
    });

    if (found.length > 0) {
        chrome.runtime.sendMessage({ action: 'searchResult', results: found });
    }

    return links;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}
