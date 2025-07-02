document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const searchForm = document.getElementById('search-form');
  const searchButton = document.getElementById('search-button');
  const stopButton = document.getElementById('stop-button');
  const searchButtonText = document.querySelector('#search-button span');
  const resultsDiv = document.getElementById('results');
  const resultsCounter = document.getElementById('results-counter');
  const progressBar = document.getElementById('progress-bar');
  const loadingIndicator = document.querySelector('.loading-indicator');
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  let resultsCount = 0;

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission
    const query = searchInput.value;
    if (query) {
      resultsCount = 0;
      resultsCounter.textContent = '';
      resultsDiv.innerHTML = '<p>Searching...</p>';
      searchButton.style.display = 'none';
      stopButton.style.display = 'flex';
      searchInput.disabled = true;
      progressBar.style.width = '0%';
      progressBar.style.backgroundImage = 'repeating-linear-gradient(45deg, rgba(46, 204, 113, 0.3), rgba(46, 204, 113, 0.3) 10px, transparent 10px, transparent 20px)';
      loadingIndicator.style.display = 'flex';
      chrome.runtime.sendMessage({ action: 'search', query: query });
    }
  });

  stopButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'stopSearch' });
    searchButton.style.display = 'flex';
    stopButton.style.display = 'none';
    loadingIndicator.style.display = 'none';
    searchInput.disabled = false;
    progressBar.style.width = '0';
    progressBar.style.backgroundImage = 'none';
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'searchResult') {
      if (resultsDiv.innerHTML === '<p>Searching...</p>') {
        resultsDiv.innerHTML = ''; // Clear "Searching..." message
      }
      resultsCount += request.results.length;
      resultsCounter.textContent = `(${resultsCount} ${resultsCount === 1 ? 'result' : 'results'} found so far)`;
      displayResults(request.results);
    } else if (request.action === 'searchProgress') {
      progressBar.style.width = `${request.progress}%`;
    } else if (request.action === 'searchComplete') {
        searchButton.style.display = 'flex';
        stopButton.style.display = 'none';
        loadingIndicator.style.display = 'none';
        searchInput.disabled = false;
        progressBar.style.width = '0';
        progressBar.style.backgroundImage = 'none';
        resultsCounter.textContent = `(${resultsCount} ${resultsCount === 1 ? 'result' : 'results'} found)`;
        if (resultsDiv.innerHTML === '<p>Searching...</p>' || resultsDiv.innerHTML === '') {
            resultsDiv.innerHTML = '<p>No results found.</p>';
        }
    }
  });

  function displayResults(results) {
    if (results && results.length > 0) {
      results.forEach(function(result) {
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
  
  // Scroll to top button logic
  window.onscroll = function() {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      scrollToTopBtn.style.display = "block";
    } else {
      scrollToTopBtn.style.display = "none";
    }
  };

  scrollToTopBtn.addEventListener("click", function() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });
});
