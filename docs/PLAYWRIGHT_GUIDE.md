# Playwright Testing Guide

This guide provides an overview of Playwright testing best practices, configuration options, and optimization techniques based on modern standards.

## Table of Contents

- [Configuration](#configuration)
- [Test Organization](#test-organization)
- [Locators and Selectors](#locators-and-selectors)
- [Actions and Assertions](#actions-and-assertions)
- [Fixtures](#fixtures)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Chrome Extension Testing](#chrome-extension-testing)
- [CI/CD Integration](#cicd-integration)

## Configuration

### Basic Configuration

A well-structured Playwright configuration file (`playwright.config.js`) should define:

```javascript
export default defineConfig({
  // Test directory - where to find test files
  testDir: './tests',

  // Whether to run tests in parallel
  fullyParallel: true,

  // Timeout for each test
  timeout: 30000,

  // Number of retries for failed tests
  retries: 2,

  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configurations
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Default settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',

    // Capture traces for debugging
    trace: 'on-first-retry',

    // Capture screenshots
    screenshot: 'only-on-failure',

    // Record video
    video: 'retain-on-failure',
  },

  // Browser configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
```

### Artifact Management

Store artifacts in a dedicated directory structure for better organization:

```javascript
const artifactsDir = path.resolve('./tests/artifacts');
const screenshotsDir = path.resolve('./tests/artifacts/screenshots');
const videosDir = path.resolve('./tests/artifacts/videos');
const tracesDir = path.resolve('./tests/artifacts/traces');
```

Create these directories automatically in your configuration:

```javascript
[artifactsDir, screenshotsDir, videosDir, tracesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
```

## Test Organization

### File Structure

Organize test files in a logical manner:

```
tests/
├── e2e/              # End-to-end tests
│   ├── auth/         # Authentication tests
│   ├── search/       # Search functionality tests
│   └── ...
├── integration/      # Integration tests
├── component/        # Component tests
├── fixtures/         # Test fixtures and data
└── utils/            # Test utilities and helpers
```

### Test Structure

Follow a consistent pattern in test files:

```javascript
import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages';

test.describe('Authentication flows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code for all tests in this describe block
  });

  test('should log in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.login('username', 'password');

    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Test implementation
  });
});
```

## Locators and Selectors

### Reliable Selectors (in order of preference)

1. **Test IDs**: `data-testid="submit-button"`
2. **Accessible Roles**: `getByRole('button', { name: 'Submit' })`
3. **Text Content**: `getByText('Submit')`
4. **Labels**: `getByLabel('Username')`
5. **Placeholder**: `getByPlaceholder('Enter username')`
6. **Alt Text**: `getByAltText('Profile picture')`
7. **Title**: `getByTitle('User settings')`

Avoid using:

- CSS selectors that depend on structure (e.g., `.header > div > button`)
- XPath selectors (unless absolutely necessary)
- Class names that might change with styling updates

### Page Object Model

Implement the Page Object Model pattern to encapsulate page interactions:

```javascript
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Log in' });
    this.errorMessage = page.getByTestId('login-error');
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

## Actions and Assertions

### Waiting Strategies

Prefer auto-waiting over explicit waits:

```javascript
// Good - Playwright automatically waits for the button to be ready
await page.getByRole('button', { name: 'Submit' }).click();

// Avoid - Explicit waits are usually unnecessary
await page.waitForTimeout(1000); // Brittle
```

For complex conditions, use `waitFor` with a predicate:

```javascript
await expect(async () => {
  const count = await page.getByTestId('item-count').textContent();
  return parseInt(count, 10) > 5;
}).toPass();
```

### Assertions

Use specific, descriptive assertions:

```javascript
// Visibility
await expect(page.getByRole('alert')).toBeVisible();

// Text content
await expect(page.getByTestId('error-message')).toContainText('Invalid credentials');

// Attribute values
await expect(page.getByRole('link')).toHaveAttribute('href', '/dashboard');

// Element state
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByLabel('Accept terms')).toBeChecked();

// Page state
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveTitle('User Dashboard');
```

## Fixtures

### Custom Fixtures

Create custom fixtures for repetitive setup tasks:

```javascript
// fixtures.js
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Login code here
    await page.goto('/login');
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Provide the authenticated page to the test
    await use(page);

    // Optional cleanup
    await page.goto('/logout');
  },

  // Mock API fixture
  mockApi: async ({ page }, use) => {
    await page.route('**/api/data', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await use();
  },
});
```

Using custom fixtures in tests:

```javascript
import { test } from './fixtures';

test('dashboard shows user data', async ({ authenticatedPage, mockApi }) => {
  await authenticatedPage.goto('/dashboard');
  // Test with authenticated user and mocked API
});
```

## Debugging

### Debugging Tools

1. **Playwright Inspector**:

   ```bash
   npx playwright test --debug
   ```

2. **Trace Viewer**:

   ```javascript
   test.use({ trace: 'on' });
   ```

   Then view the trace:

   ```bash
   npx playwright show-trace trace.zip
   ```

3. **Screenshots and Videos**:

   ```javascript
   // In your config:
   use: {
     screenshot: 'on',
     video: 'on-first-retry',
   }
   ```

4. **Visual Testing**:
   ```javascript
   await expect(page).toHaveScreenshot('dashboard.png');
   ```

## Performance Optimization

### Parallel Testing

Run tests in parallel with appropriate workers:

```javascript
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined, // Use available CPUs by default
});
```

### Test Isolation

For better parallelization, ensure tests are isolated:

```javascript
// Each test gets a fresh browser context
test.use({ isolate: true });
```

### Resource Management

Reuse browser instances across tests:

```javascript
// In playwright.config.js
export default defineConfig({
  reuseExistingServer: true,
});
```

## Chrome Extension Testing

### Extension Configuration

For testing Chrome extensions:

```javascript
export default defineConfig({
  projects: [
    {
      name: 'chrome-extension',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.resolve('./dist')}`,
            `--load-extension=${path.resolve('./dist')}`,
          ],
        },
      },
    },
  ],
});
```

### Extension Testing Tips

1. **Content Scripts**:
   - Test by navigating to pages where content scripts are injected

2. **Background Scripts**:
   - Access via service worker

   ```javascript
   const worker = await context.serviceWorkers()[0];
   await worker.evaluate(async () => {
     // Access background script APIs here
   });
   ```

3. **Popup Windows**:
   - Test by navigating directly to the popup HTML

   ```javascript
   const extensionId = await getExtensionId(context);
   await page.goto(`chrome-extension://${extensionId}/popup.html`);
   ```

4. **Permissions**:
   - Set appropriate permissions in the test context
   ```javascript
   contextOptions: {
     permissions: ['notifications', 'storage'],
   }
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Improved CI Performance

1. **Caching Dependencies**:

   ```yaml
   - uses: actions/cache@v3
     with:
       path: |
         ~/.npm
         node_modules
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

2. **Splitting Test Runs**:

   ```yaml
   strategy:
     fail-fast: false
     matrix:
       shardIndex: [1, 2, 3, 4]
       shardTotal: [4]
   steps:
     # ...
     - name: Run tests
       run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
   ```

3. **Parallel Browser Testing**:
   ```yaml
   strategy:
     matrix:
       browser: [chromium, firefox, webkit]
   steps:
     # ...
     - name: Run tests on ${{ matrix.browser }}
       run: npx playwright test --project=${{ matrix.browser }}
   ```

## Conclusion

This guide covers the essentials of Playwright testing best practices. By following these guidelines, you can create robust, maintainable, and efficient test suites that provide confidence in your application's behavior across different browsers and environments.

Remember that testing is an iterative process - continuously refine your approach based on your team's needs and the specific challenges of your application.
