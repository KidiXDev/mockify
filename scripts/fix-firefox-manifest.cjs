#!/usr/bin/env node

/**
 * Post-build script to fix manifest.json for Firefox compatibility
 * Firefox doesn't fully support service workers with type: "module" yet
 * This script removes the type field from the background service worker
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../dist/manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('manifest.json not found in dist folder');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Remove type: "module" from background service worker for Firefox compatibility
if (manifest.background && manifest.background.type === 'module') {
  delete manifest.background.type;
  console.log('✓ Removed type: "module" from background service worker for Firefox compatibility');
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✓ Firefox-compatible manifest.json created');
