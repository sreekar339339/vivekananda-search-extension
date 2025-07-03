# Vivekananda Search Extension - AI Assistant Guide

This document provides comprehensive context for AI coding assistants to understand the project, its goals, architecture, development history, and key technical decisions. Use this as a reference when working on the project.

## Project Overview

**Name**: Vivekananda Search Extension
**Purpose**: A browser extension that enables users to deeply search through the complete works of Swami Vivekananda on the website: https://www.ramakrishnavivekananda.info/vivekananda/master_index.htm

The extension provides a text box for users to input search phrases, searches across all linked and nested pages under this site, highlights matched text, and displays results with links to the original content.

## Project Vision & Goals

1. **Deep Searching**: Perform recursive searches through all levels of nested linked pages starting from the master index
2. **Real-time Results**: Stream search results as they're found, rather than waiting for the entire search to complete
3. **Performance**: Optimize search performance through parallel fetching with controlled concurrency
4. **User Experience**:
   - Responsive UI that works on all device sizes
   - Clear progress indication during searches
   - Ability to stop an ongoing search
   - Clean highlighting of matched content with full sentence context

## Technical Architecture

### Components

1. **Manifest (manifest.json)**: Manifest v3 specification with necessary permissions and host permissions for the target site
2. **Popup Interface (popup.html/popup.js)**:
   - Search input box
   - Results display area
   - Progress indicators (progress bar, loading spinner)
   - Stop search button
3. **Background Script (background.js)**:
   - Handles search logic and URL fetching
   - Controls concurrency with p-queue
   - Communicates with popup via Chrome messaging API
4. **Content Script (content_script.js)**:
   - Injects into matched pages to highlight search terms
5. **HTML Parser (html-parser.js)**:
   - Parses HTML content using LinkedOM
   - Provides fallback regex-based parsing for robustness
6. **URL Management**:
   - Pre-compiled list of URLs from the site (url-list.js)
   - URL crawling script for generating this list (scripts/crawl-urls.js)

### Data Flow

1. User inputs search query in popup.html
2. Query is sent to background.js via Chrome messaging
3. Background script fetches and searches pre-compiled list of URLs with controlled concurrency
4. Results are streamed back to the popup as they're found
5. User can click results to open pages in new tabs
6. When navigating to result pages, content_script.js highlights the matched terms

## Development History & Key Decisions

### Initial Setup (MVP)

- Created basic extension structure with manifest v3
- Implemented simple search functionality that fetched immediate links from the master index

### HTML Parsing Evolution

- Initially used DOMParser in background.js
- Migrated to using LinkedOM for DOM parsing as DOMParser isn't available in service workers
- Added offscreen.html/offscreen.js scripts for DOM parsing in Manifest V3
- Later optimized by using regex for quick matches and reducing DOM parsing overhead
- Finally created precompiled URL list to avoid expensive parsing during search time

### Search Performance Improvements

- Added recursive search capability to follow nested links
- Implemented controlled concurrency with p-queue (limit: 10 concurrent requests)
- Added domain filtering to only process ramakrishnavivekananda.info URLs
- Added language filtering to only process English pages
- Implemented streaming results instead of waiting for complete search
- Created crawler script to precompile URLs for faster search initialization

### UI Enhancements

- Added spinner inside search button
- Added "Stop" button during search
- Implemented overlaid transparent progress bar on input box
- Made UI fully responsive for all device sizes
- Added scroll-to-top button for long result lists

### Result Quality Improvements

- Enhanced context extraction to show full sentences around matched terms
- Improved highlighting with proper HTML escaping
- Added result count display

### Project Productionization

- Restructured project with src/ directory
- Setup ESLint and Prettier for code quality
- Added GitHub Actions workflows for CI/CD
- Implemented Git hooks with Husky for pre-commit and pre-push checks
- Added packaging scripts for Chrome and Firefox distribution
- Created comprehensive test suite with Vitest and Playwright

## Common Issues & Solutions

### DOM Parsing in Service Workers

- **Issue**: Service Workers in Manifest V3 don't support DOM APIs
- **Solution**: Use LinkedOM for lightweight DOM parsing and implement fallback regex parsing

### Search Performance

- **Issue**: Recursive search through all pages was very slow
- **Solution 1**: Implement controlled concurrency with p-queue
- **Solution 2**: Stream results as they're found
- **Solution 3**: Pre-compile URL list to avoid parsing during search

### CORS Errors

- **Issue**: Attempts to fetch URLs from other domains caused CORS errors
- **Solution**: Restrict domain to ramakrishnavivekananda.info

### E2E Testing with Service Workers

- **Issue**: Network requests from extension's background Service Worker couldn't be intercepted in Playwright tests
- **Solution 1**: Enable Playwright's experimental Service Worker support with `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1`
- **Solution 2**: Use browser context-level routing instead of page-level routing to intercept Service Worker requests
- **Solution 3**: Use `request.serviceWorker()` to identify requests from Service Workers vs. page requests

### Build & Linting Conflicts

- **Issue**: ESLint and Prettier had conflicting rules
- **Solution**: Configured ESLint to defer formatting rules to Prettier

## Code Structure & Important Files

- **src/background.js**: Main search logic with fetch functionality and message handling
- **src/popup.js**: UI interactions and result display logic
- **src/html-parser.js**: HTML parsing utilities with LinkedOM
- **src/content_script.js**: Highlights matches on result pages
- **src/url-list.js**: Precompiled list of URLs from the website
- **scripts/crawl-urls.js**: Script to crawl and generate URL list
- **tests/**: Unit and integration tests
- **.github/workflows/**: CI/CD pipelines

## Requirements & Constraints

1. **Performance**:
   - Must handle searching through 1,700+ URLs efficiently
   - Should provide streaming results for better UX
   - Should limit parallel requests to avoid overwhelming the server

2. **Browser Compatibility**:
   - Must work in Chrome and Firefox
   - Must conform to Manifest V3 specification

3. **Code Quality**:
   - Must pass ESLint and Prettier checks
   - Must include tests for critical functionality
   - Should follow modern JS best practices

4. **User Experience**:
   - Must provide clear progress indication
   - Must allow stopping searches
   - Must extract and display meaningful context around matches
   - Must be responsive on all device sizes

## Future Improvements

1. **Indexing**: Implement local storage of page content for faster searching
2. **Advanced Search**: Add options for case sensitivity, regex, exact phrase matching
3. **History**: Save search history for quick access to previous searches
4. **Offline Mode**: Enable searching without internet connection using cached content
5. **Analytics**: Add anonymous usage statistics to improve the extension
6. **Topic Clustering**: Group results by semantic topics
7. **Multi-language Support**: Add support for searching in multiple languages

## Testing Approach

1. **Unit Tests**: For HTML parser and utility functions
2. **Integration Tests**: For search functionality and message passing
3. **E2E Tests**: Using Playwright to simulate real browser interactions

## Development Environment

- **Node.js**: v20+
- **Package Manager**: npm
- **Build Tool**: Vite
- **Testing**: Vitest, Playwright
- **Linting**: ESLint, html-validate
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions

## Project Status

The extension is fully functional with the core search capabilities implemented. It has been productionized with proper CI/CD, code quality tools, and test suite. The focus is now on improving search performance, enhancing result quality, and adding additional features.

---

This guide should provide sufficient context for AI assistants to understand the project, make informed suggestions, and contribute effectively to the codebase. For any additional context, please refer to the project's commit history, issue tracker, and pull requests.
