# Test Artifacts Management

This document explains how test artifacts (screenshots, videos, test reports) are managed in the Vivekananda Search Extension project.

## Directory Structure

All test artifacts are now stored in the `/tests/artifacts` directory with the following structure:

```
/tests/artifacts/
├── screenshots/     # Test screenshots
├── videos/          # Test videos
└── test-results/    # HTML test reports
```

## Configuration

The Playwright configuration (in `playwright.config.js`) has been updated to store all artifacts in the appropriate directories. Key configurations include:

- **Screenshots**: Saved to `/tests/artifacts/screenshots` when tests fail
- **Videos**: Saved to `/tests/artifacts/videos` when tests fail
- **Test Reports**: HTML reports are saved to `/tests/artifacts/test-results`

This organization keeps the project root clean and places all test-related files in the tests directory.

## Managing Test Artifacts

### Cleaning Up Artifacts

To clean up old test artifacts, you can use the provided script:

```bash
npm run clean:test-artifacts
```

This script will:

1. Scan for test artifacts (screenshots, videos) outside the `/tests/artifacts` directory
2. Display a list of found files
3. Ask for confirmation before deletion
4. Remove the files and any empty directories that held them

### Auto-Created Directories

The necessary artifact directories are automatically created when running tests, so you don't need to create them manually.

## Capturing Screenshots in Tests

You can explicitly capture screenshots in your tests using:

```javascript
await page.screenshot({ path: 'tests/artifacts/screenshots/custom-screenshot.png' });
```

Make sure to use the `/tests/artifacts/screenshots` path to maintain consistency.

## Viewing Test Reports

After running tests, you can view the HTML test reports by opening the generated HTML file in your browser:

```bash
open tests/artifacts/test-results/index.html
```

## Best Practices

1. **Don't commit test artifacts**: The `.gitignore` file should exclude `/tests/artifacts` to prevent committing temporary test files
2. **Clean before CI runs**: Include `npm run clean:test-artifacts` in CI workflows to ensure a clean state
3. **Limit artifact retention**: In CI environments, consider limiting the retention period for test artifacts to save storage space
