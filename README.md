# Swami Vivekananda Works Search Extension

A browser extension that allows you to search the complete works of Swami Vivekananda from the [ramakrishnavivekananda.info](https://www.ramakrishnavivekananda.info/vivekananda/master_index.htm) website.

## Features

- **Deep Search**: Searches through all pages linked from the master index, including nested links
- **Real-time Results**: Displays search results as they are found, with no need to wait for the entire search to complete
- **Progress Tracking**: Shows search progress with a visual progress bar
- **Stop Functionality**: Allows you to stop a search in progress
- **Language Filtering**: Automatically skips non-English pages
- **Highlighted Results**: Displays your search terms highlighted in the results for easy identification

## Installation

### Option 1: Web Store Installation (Recommended)

#### Chrome, Edge, Brave (Coming Soon)

1. Visit the [Chrome Web Store page for this extension](#) (link will be available once published)
2. Click "Add to Chrome"
3. Confirm by clicking "Add extension" in the popup

#### Firefox (Coming Soon)

1. Visit the [Firefox Add-ons page for this extension](#) (link will be available once published)
2. Click "Add to Firefox"
3. Click "Add" in the confirmation dialog

### Option 2: Manual Installation

#### From Release Package

1. Go to the [Releases page](https://github.com/sreekar339339/vivekananda-search-extension/releases) on GitHub
2. Download the latest release package for your browser (`vivekananda-search-chrome.zip` or `vivekananda-search-firefox.zip`)
3. Follow the browser-specific instructions below

#### Chrome/Edge/Brave

1. Extract the downloaded zip file (or clone this repository)
2. Open your browser and go to `chrome://extensions`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the extracted folder (or `vivekananda-search-extension/src` if using the repository)
5. The extension is now installed and ready to use

#### Firefox

1. Extract the downloaded zip file (or clone this repository)
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on" and select the `manifest.json` file within the extracted folder (or `vivekananda-search-extension/src` if using the repository)
4. The extension is now installed temporarily (it will be removed when you close Firefox)

> **Note**: For permanent installation in Firefox, the extension needs to be installed from the Mozilla Add-ons site once published.

## Usage

1. Click on the extension icon in your browser toolbar
2. Enter your search term in the input box
3. Click "Search" or press Enter
4. Results will appear in real-time as they are found
5. Click on any result to open the original page in a new tab
6. You can stop the search at any time by clicking the stop button

## Development

### Scripts

- `npm run dev`: Start development build with watch mode
- `npm run build`: Create production build
- `npm run build:dev`: Create development build
- `npm run preview`: Preview the built extension
- `npm run clean`: Remove build artifacts
- `npm run package`: Build and package the extension for Chrome and Firefox
- `npm run lint`: Run all linters
- `npm run format`: Format code with Prettier
- `npm run test`: Run unit and integration tests with Vitest
- `npm run test:e2e`: Run end-to-end tests with Playwright

### End-to-End Testing with Playwright

This project includes end-to-end tests using Playwright that test the browser extension in a real Chrome environment using downloaded fixture files from the Vivekananda website.

#### Prerequisites

1. Download the fixture files (this only needs to be done once):

```bash
npm run download-fixtures
```

2. Install Playwright browsers:

```bash
npx playwright install chromium
```

#### Running the Tests

To run the Playwright tests:

```bash
npm run test:e2e
```

To run tests with UI mode:

```bash
npm run test:e2e:ui
```

To run tests in debug mode:

```bash
npm run test:e2e:debug
```

### Extension Testing Tips

Testing browser extensions with Playwright requires specific techniques, especially for Manifest V3 extensions:

#### Working with Service Workers

1. Access the extension's service worker using `context.serviceWorkers()`:

```javascript
const workers = context.serviceWorkers();
if (workers.length > 0) {
  const serviceWorker = workers[0];
  // Now you can interact with the service worker
}
```

2. Wait for a service worker to start if it's not immediately available:

```javascript
const serviceWorker = await context.waitForEvent('serviceworker');
```

#### Mocking Network Requests

For service workers making network requests, set up route interception at the context level:

```javascript
await context.route('https://www.ramakrishnavivekananda.info/**', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!-- mock HTML content -->',
  });
});
```

#### Debugging Extension Tests

1. Use screenshot captures at key points in your test
2. Add console logging in both popup and service worker contexts
3. Set longer timeouts for extension operations
4. Test components individually before testing the entire extension flow

## Project Structure

```
vivekananda-search-extension/
├── src/                  # Source code files
│   ├── background.js     # Service worker for extension
│   ├── content_script.js # Content script
│   ├── html-parser.js    # HTML parsing module
│   ├── images/           # Icons and images
│   ├── manifest.json     # Extension manifest
│   ├── popup.html        # Popup UI
│   └── popup.js          # Popup behavior
├── tests/                # Test files
│   ├── e2e/              # End-to-end tests with Playwright
│   │   ├── fixtures/     # Test fixtures (downloaded real HTML pages)
│   │   └── helpers.js    # Test helper functions
│   ├── integration/      # Integration tests with Vitest
│   ├── unit/             # Unit tests with Vitest
│   └── fixtures/         # Test fixtures for Vitest tests
├── scripts/              # Utility scripts
│   └── download-fixtures.js # Downloads real pages for Playwright tests
├── dist/                 # Build output
├── releases/             # Packaged extension releases
├── .husky/               # Git hooks
├── CHANGELOG.md          # Version changes
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # License information
├── README.md             # This file
```

## Privacy and Permissions

This extension only accesses the [ramakrishnavivekananda.info](https://www.ramakrishnavivekananda.info/) website to perform searches. It does not collect, store, or transmit any personal data.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

This project uses Git hooks for code quality. See [HOOKS.md](HOOKS.md) for more information about the pre-commit and pre-push hooks.

## Acknowledgments

- All content searched by this extension is from [ramakrishnavivekananda.info](https://www.ramakrishnavivekananda.info/)
- This extension is not officially affiliated with the Ramakrishna Mission or any official Vivekananda organization
