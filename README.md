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

### Chrome/Edge/Brave (Manual Installation)

1. Download or clone this repository
2. Open your browser and go to `chrome://extensions`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the `vivekananda-search-extension` folder
5. The extension is now installed and ready to use

### Firefox (Manual Installation)

1. Download or clone this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on" and select the `manifest.json` file within the `vivekananda-search-extension` folder
4. The extension is now installed temporarily (it will be removed when you close Firefox)

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

## Acknowledgments

- All content searched by this extension is from [ramakrishnavivekananda.info](https://www.ramakrishnavivekananda.info/)
- This extension is not officially affiliated with the Ramakrishna Mission or any official Vivekananda organization
