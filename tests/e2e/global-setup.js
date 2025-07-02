// @ts-check
import { execSync } from 'child_process';

/**
 * Global setup for Playwright tests
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
export default async function globalSetup() {
  console.log('Building extension before tests...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed');
}
