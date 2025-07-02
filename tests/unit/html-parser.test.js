import { describe, it, expect } from 'vitest';
import { parseHTML } from '../../src/html-parser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures');

describe('HTML Parser Module', () => {
  it('should parse HTML and extract links', () => {
    const html = fs.readFileSync(path.join(fixturePath, 'master_index.html'), 'utf-8');
    const result = parseHTML(html);
    
    // Verify links were extracted
    expect(result.links).toBeDefined();
    expect(result.links.length).toBeGreaterThan(0);
    
    // Verify some specific links from the "Lectures and Discourses" section
    const expectedLinks = [
      'volume_1/lectures_and_discourses/soul_god_and_religion.htm',
      'volume_1/lectures_and_discourses/the_hindu_religion.htm',
      'volume_4/lectures_and_discourses/the_great_teachers_of_the_world.htm'
    ];
    
    expectedLinks.forEach(link => {
      expect(result.links.some(l => l.includes(link))).toBe(true);
    });
  });
  
  it('should parse HTML and extract paragraphs', () => {
    const html = fs.readFileSync(path.join(fixturePath, 'lectures', 'soul_god_and_religion.html'), 'utf-8');
    const result = parseHTML(html);
    
    // Verify paragraphs were extracted
    expect(result.paragraphs).toBeDefined();
    expect(result.paragraphs.length).toBeGreaterThan(0);
    
    // Verify content of paragraphs
    const hasRelevantContent = result.paragraphs.some(p => 
      p.includes('Man finds himself surrounded by a world') ||
      p.includes('religion') ||
      p.includes('soul')
    );
    
    expect(hasRelevantContent).toBe(true);
  });
  
  it('should extract title and language from HTML', () => {
    const html = fs.readFileSync(path.join(fixturePath, 'lectures', 'the_hindu_religion.html'), 'utf-8');
    const result = parseHTML(html);
    
    // Verify title was extracted
    expect(result.title).toBeDefined();
    expect(result.title.toLowerCase()).toContain('hindu religion');
    
    // Most Vivekananda pages don't specify lang, but our parser should still return a value
    expect(result.lang).toBeDefined();
  });
  
  it('should handle malformed HTML gracefully', () => {
    const malformedHtml = `
      <html>
        <head><title>Broken Page</title></head>
        <body>
          <p>This is a paragraph with <a href="broken_link.html">a link</a>
          <div>This div is not properly closed
          <p>Another paragraph
        </body>
      </html>
    `;
    
    // Should not throw an error
    expect(() => parseHTML(malformedHtml)).not.toThrow();
    
    const result = parseHTML(malformedHtml);
    expect(result.links).toContain('broken_link.html');
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.title).toBe('Broken Page');
  });
  
  it('should handle empty HTML', () => {
    const result = parseHTML('');
    
    expect(result.links).toEqual([]);
    expect(result.paragraphs).toEqual([]);
    expect(result.title).toBe('');
    expect(result.lang).toBe('');
  });
});
