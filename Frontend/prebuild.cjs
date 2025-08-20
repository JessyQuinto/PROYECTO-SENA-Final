#!/usr/bin/env node

/**
 * Prebuild script to ensure Rollup bindings are available
 * This addresses the npm workspace optional dependency issue
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🔍 Checking Rollup bindings...');

// Check if we're on Linux (common CI environment)
const platform = process.platform;
const arch = process.arch;

let expectedBinding = '';
if (platform === 'linux' && arch === 'x64') {
  expectedBinding = '@rollup/rollup-linux-x64-gnu';
} else if (platform === 'linux' && arch === 'arm64') {
  expectedBinding = '@rollup/rollup-linux-arm64-gnu';
} else if (platform === 'darwin' && arch === 'x64') {
  expectedBinding = '@rollup/rollup-darwin-x64';
} else if (platform === 'darwin' && arch === 'arm64') {
  expectedBinding = '@rollup/rollup-darwin-arm64';
} else if (platform === 'win32' && arch === 'x64') {
  expectedBinding = '@rollup/rollup-win32-x64-msvc';
}

if (expectedBinding) {
  console.log(`📦 Platform: ${platform}-${arch}, expected binding: ${expectedBinding}`);
  
  const bindingPath = path.join(__dirname, 'node_modules', expectedBinding.replace('/', path.sep));
  const rootBindingPath = path.join(__dirname, '..', 'node_modules', expectedBinding.replace('/', path.sep));
  
  if (!existsSync(bindingPath) && !existsSync(rootBindingPath)) {
    console.log(`⚠️  Missing ${expectedBinding}, attempting to install...`);
    
    try {
      // Try to install the specific binding
      execSync(`npm install ${expectedBinding} --no-save --silent`, {
        stdio: 'inherit',
        cwd: __dirname
      });
      console.log(`✅ Successfully installed ${expectedBinding}`);
    } catch (error) {
      console.log(`⚠️  Could not install ${expectedBinding}, continuing anyway...`);
      console.log('This might work if Rollup falls back to WASM mode.');
    }
  } else {
    console.log(`✅ ${expectedBinding} is available`);
  }
}

console.log('🚀 Ready to build!');