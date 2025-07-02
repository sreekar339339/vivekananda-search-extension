chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'parseHTML') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(request.html, 'text/html');
    const links = Array.from(doc.querySelectorAll('a')).map(a => a.getAttribute('href'));
    const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent);
    const lang = doc.documentElement.lang;
    sendResponse({ links, paragraphs, title: doc.title, lang });
  }
});
