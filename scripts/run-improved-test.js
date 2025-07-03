#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure artifacts directory exists
const artifactsDir = path.resolve('./tests/artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Build the extension first
console.log('Building extension...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('Failed to build extension:', error);
  process.exit(1);
}

// Run the improved test
console.log('\nRunning improved tests...');
try {
  execSync('npx playwright test ui-improved.test.js --headed', {
    stdio: 'inherit',
    cwd: rootDir,
  });
  console.log('\nTest completed successfully!');
} catch (error) {
  console.error('\nTest failed:', error);
  process.exit(1);
}

// Show where the artifacts are stored
console.log(`\nTest artifacts are available in: ${artifactsDir}`);
console.log('Screenshots: tests/artifacts/screenshots');
console.log('Videos: tests/artifacts/videos');
console.log('Test Report: tests/artifacts/test-results');
