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

## Privacy and Permissions

This extension only accesses the [ramakrishnavivekananda.info](https://www.ramakrishnavivekananda.info/) website to perform searches. It does not collect, store, or transmit any personal data.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

This project uses Git hooks for code quality. See [HOOKS.md](HOOKS.md) for more information about the pre-commit and pre-push hooks.

## Project Structure

```
vivekananda-search-extension/
├── src/                  # Source code files
│   ├── background.js     # Service worker for extension background tasks
│   ├── content_script.js # Content script for webpage integration
│   ├── images/           # Extension icons and images
│   ├── manifest.json     # Extension manifest
│   ├── offscreen.html    # Offscreen document for DOM parsing
│   ├── offscreen.js      # JavaScript for offscreen document
│   ├── popup.html        # Main extension UI
│   └── popup.js          # JavaScript for extension UI
├── .eslintrc.js         # ESLint configuration
├── .htmlvalidate.json   # HTML validation configuration
├── .prettierrc          # Prettier configuration
├── .husky/              # Git hooks
├── package.json         # Project metadata and scripts
└── README.md            # This file
```

### Development Scripts

- `npm run build` - Build the extension to the dist/ directory
- `npm run lint` - Run linting on all files
- `npm run format` - Format all files with Prettier
- `npm run package:chrome` - Package the extension for Chrome
- `npm run package:firefox` - Package the extension for Firefox

## Acknowledgments

- All content searched by this extension is from [ramakrishnavivekananda.info](https://www.ramakrishnavivekananda.info/)
- This extension is not officially affiliated with the Ramakrishna Mission or any official Vivekananda organization
