#!/usr/bin/env node

/**
 * This script finds and removes old test artifacts (screenshots, videos)
 * that were generated before the configuration change to store all
 * artifacts in the tests/artifacts directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root project directory
const rootDir = path.resolve(__dirname, '..');

// File patterns to search for
const artifactPatterns = [
  '*.png', // Screenshots
  '*.webm', // Videos
];

// Directories to exclude from cleaning
const excludeDirs = ['node_modules', 'tests', 'src', 'dist', '.git'];

// Helper function to check if a path should be excluded
function shouldExclude(filePath) {
  return excludeDirs.some(dir => filePath.includes(`/${dir}/`) || filePath === `/${dir}`);
}

// Find files matching patterns in directory
function findFiles(dir, patterns) {
  const results = [];

  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!shouldExclude(path.relative(rootDir, filePath))) {
          traverse(filePath);
        }
      } else if (
        patterns.some(pattern => {
          // Convert glob pattern to regex
          const regexPattern = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*'));
          return regexPattern.test(file);
        })
      ) {
        results.push(filePath);
      }
    }
  }

  traverse(dir);
  return results;
}

// Main execution
console.log('Scanning for old test artifacts...');
const oldArtifacts = findFiles(rootDir, artifactPatterns).filter(file => {
  // Only include files in the root or in the videos directory,
  // excluding anything in tests/artifacts
  const relativePath = path.relative(rootDir, file);
  return (
    !relativePath.startsWith('tests/artifacts') &&
    (relativePath.startsWith('videos/') || !relativePath.includes('/'))
  );
});

// Print files that will be removed
if (oldArtifacts.length > 0) {
  console.log(`Found ${oldArtifacts.length} old test artifacts to clean up:`);
  oldArtifacts.forEach(file => {
    console.log(`- ${path.relative(rootDir, file)}`);
  });

  // Ask for confirmation before deleting
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`Proceed with deletion? (y/N) `, answer => {
    if (answer.toLowerCase() === 'y') {
      oldArtifacts.forEach(file => {
        try {
          fs.unlinkSync(file);
          console.log(`Deleted: ${path.relative(rootDir, file)}`);
        } catch (err) {
          console.error(`Error deleting ${file}: ${err.message}`);
        }
      });

      // Check if videos directory is empty and remove it
      const videosDir = path.join(rootDir, 'videos');
      if (fs.existsSync(videosDir) && fs.readdirSync(videosDir).length === 0) {
        try {
          fs.rmdirSync(videosDir);
          console.log('Removed empty videos directory');
        } catch (err) {
          console.error(`Error removing videos directory: ${err.message}`);
        }
      }

      console.log('Cleanup complete!');
    } else {
      console.log('Cleanup canceled.');
    }

    rl.close();
  });
} else {
  console.log('No old test artifacts found. Everything is clean!');
}
