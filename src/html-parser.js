import { DOMParser } from 'linkedom';

/**
 * Parses HTML content using LinkedOM
 * @param {string} html - The HTML string to parse
 * @returns {Object} - Parsed data with links, paragraphs, title and lang
 */
export function parseHTML(html) {
  try {
    // Parse HTML using LinkedOM's DOMParser
    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');

    // Extract links
    const links = Array.from(document.querySelectorAll('a'))
      .map(a => a.getAttribute('href'))
      .filter(href => href && !href.startsWith('#') && !href.startsWith('javascript:'));

    // Extract paragraphs
    const paragraphs = Array.from(document.querySelectorAll('p'))
      .map(p => p.textContent)
      .filter(text => text && text.trim().length > 0);

    // Extract title
    const title = document.title || '';

    // Extract language
    const lang = document.documentElement.lang || '';

    return { links, paragraphs, title, lang };
  } catch (error) {
    console.error('Error parsing HTML with LinkedOM:', error);

    // Fallback to regex parsing if LinkedOM fails
    return regexParseHTML(html);
  }
}

/**
 * Fallback parser using regex if LinkedOM fails
 * @param {string} html - The HTML string to parse
 * @returns {Object} - Parsed data with links, paragraphs, title and lang
 */
function regexParseHTML(html) {
  // Extract links using regex
  const links = [];
  const linkRegex = /<a[^>]+href=['"](.*?)['"][^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1] && !match[1].startsWith('#') && !match[1].startsWith('javascript:')) {
      links.push(match[1]);
    }
  }

  // Extract paragraphs
  const paragraphs = [];
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;

  while ((match = paragraphRegex.exec(html)) !== null) {
    const content = match[1].replace(/<[^>]*>/g, '').trim();
    if (content) {
      paragraphs.push(content);
    }
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';

  // Extract language
  const langMatch = html.match(/<html[^>]+lang=['"](.*?)['"][^>]*>/i);
  const lang = langMatch ? langMatch[1] : '';

  return { links, paragraphs, title, lang };
}
