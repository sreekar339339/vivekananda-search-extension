import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Parse manifest to get extension metadata
const manifest = JSON.parse(readFileSync('./src/manifest.json', 'utf-8'));

// Create a plugin to handle browser extension specifics
const extensionPlugin = {
  name: 'browser-extension',
  enforce: 'pre',
  config(config) {
    // Ensure proper output configuration for browser extensions
    config.build = config.build || {};
    config.build.target = ['chrome89', 'firefox89', 'safari15'];
    return config;
  },
};

export default defineConfig({
  // Define common build settings
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production',
    copyPublicDir: true,
    rollupOptions: {
      input: {
        // Main extension scripts
        background: resolve(__dirname, 'src/background.js'),
        popup: resolve(__dirname, 'src/popup.js'),
        content_script: resolve(__dirname, 'src/content_script.js'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
        // Organize output files in a clean structure
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  // Handle static assets from src directory
  publicDir: 'src',
  // Configure plugins
  plugins: [extensionPlugin],
  // Define environment variables
  define: {
    'process.env.EXT_VERSION': JSON.stringify(manifest.version),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
