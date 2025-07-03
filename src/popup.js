// Connect to the background script
let port;
// Will be initialized in DOMContentLoaded
let handleMessage;

function connectToBackground() {
  port = chrome.runtime.connect({ name: 'popup' });
  // console.log('Connected to background script');

  // Listen for messages from the background script via port
  port.onMessage.addListener(request => {
    // console.log('Port message received:', request);
    if (handleMessage) {
      handleMessage(request);
    } else {
      // console.error('handleMessage function not initialized yet');
    }
  });

  // Handle port disconnection
  port.onDisconnect.addListener(() => {
    // console.log('Port disconnected, will try to reconnect on next action');
    port = null;
  });
}

document.addEventListener('DOMContentLoaded', function () {
  connectToBackground();
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const searchButtonText = searchButton.querySelector('span');
  const resultsDiv = document.getElementById('results');
  const resultsCounter = document.getElementById('results-counter');
  const progressBar = document.getElementById('progress-bar');
  const loadingIndicator = document.querySelector('.loading-indicator');
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  let resultsCount = 0;
  let isSearching = false;

  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    startSearch();
  });

  searchButton.addEventListener('click', () => {
    if (isSearching) {
      stopSearch();
    }
  });

  function startSearch() {
    const query = searchInput.value;
    if (query) {
      isSearching = true;
      resultsCount = 0;
      resultsCounter.textContent = '';
      resultsDiv.innerHTML = '<p>Searching...</p>';
      searchButtonText.textContent = 'Stop';
      searchButton.classList.add('stop-button');
      searchInput.disabled = true;
      progressBar.style.width = '0%';
      progressBar.style.backgroundImage =
        'repeating-linear-gradient(45deg, rgba(46, 204, 113, 0.3), rgba(46, 204, 113, 0.3) 10px, transparent 10px, transparent 20px)';
      loadingIndicator.style.display = 'flex';
      if (!port) {
        connectToBackground();
      }
      port.postMessage({ action: 'search', query: query });
    }
  }

  function stopSearch() {
    if (port) {
      port.postMessage({ action: 'stopSearch' });
    }
  }

  function resetUI() {
    isSearching = false;
    searchButtonText.textContent = 'Search';
    searchButton.classList.remove('stop-button');
    loadingIndicator.style.display = 'none';
    searchInput.disabled = false;
    progressBar.style.width = '0';
    progressBar.style.backgroundImage = 'none';
  }

  function displayResults(results) {
    if (results && results.length > 0) {
      results.forEach(function (result) {
        const resultEl = document.createElement('div');
        const iconSvg = `<svg class="external-link-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
        resultEl.innerHTML = `
          <h3><a href="${result.url}" target="_blank">${result.title}${iconSvg}</a></h3>
          <p>${result.paragraph}</p>
        `;
        resultsDiv.appendChild(resultEl);
      });
    }
  }

  handleMessage = function (request) {
    if (request.action === 'searchResult') {
      if (resultsDiv.innerHTML === '<p>Searching...</p>') {
        resultsDiv.innerHTML = '';
      }
      resultsCount += request.results.length;
      resultsCounter.textContent = `(${resultsCount} ${resultsCount === 1 ? 'result' : 'results'} found so far)`;
      displayResults(request.results);
    } else if (request.action === 'searchProgress') {
      progressBar.style.width = `${request.progress}%`;
    } else if (request.action === 'searchComplete') {
      resetUI();
      resultsCounter.textContent = `(${resultsCount} ${resultsCount === 1 ? 'result' : 'results'} found)`;
      if (resultsDiv.innerHTML === '<p>Searching...</p>' || resultsDiv.innerHTML === '') {
        resultsDiv.innerHTML = '<p>No results found.</p>';
      }
    }
  };

  window.onscroll = function () {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      scrollToTopBtn.style.display = 'block';
    } else {
      scrollToTopBtn.style.display = 'none';
    }
  };

  scrollToTopBtn.addEventListener('click', function () {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });
});
