chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlight') {
    highlight(request.query);
  }
});

function highlight(query) {
  const body = document.body;
  const regex = new RegExp(query, 'gi');

  function walk(node) {
    if (node.nodeType === 3) {
      // Text node
      const matches = node.nodeValue.match(regex);
      if (matches) {
        const span = document.createElement('span');
        span.innerHTML = node.nodeValue.replace(regex, '<span class="highlight">$&</span>');
        node.parentNode.replaceChild(span, node);
      }
    } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
      // Element node
      Array.from(node.childNodes).forEach(walk);
    }
  }

  walk(body);

  const style = document.createElement('style');
  style.innerHTML = '.highlight { background-color: yellow; }';
  document.head.appendChild(style);
}
