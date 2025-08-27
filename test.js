#!/usr/bin/env node

/**
 * Simple test file for emaillistverify-sdk-js
 * This file tests both ESM and CommonJS builds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testESM() {
  try {
    console.log('🧪 Testing ESM build...');
    const { default: EmailListVerify } = await import('./dist/index.js');
    
    // Test class instantiation
    const client = new EmailListVerify('test-api-key');
    console.log('✅ ESM: EmailListVerify class instantiated successfully');
    
    // Test error handling for missing API key
    try {
      new EmailListVerify('');
      console.log('❌ ESM: Should have thrown error for empty API key');
    } catch (error) {
      console.log('✅ ESM: Correctly threw error for empty API key');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ ESM test failed: ${error.message}`);
    return false;
  }
}

function testCJS() {
  try {
    console.log('🧪 Testing CommonJS build...');
    const cjsModule = require('./dist/index.cjs');
    
    // Try default export first, then named export
    const EmailListVerify = cjsModule.default || cjsModule.EmailListVerify || cjsModule;
    
    if (typeof EmailListVerify !== 'function') {
      console.log('❌ CJS: EmailListVerify is not a constructor function');
      return false;
    }
    
    // Test class instantiation
    const client = new EmailListVerify('test-api-key');
    console.log('✅ CJS: EmailListVerify class instantiated successfully');
    
    // Test error handling for missing API key
    try {
      new EmailListVerify('');
      console.log('❌ CJS: Should have thrown error for empty API key');
    } catch (error) {
      console.log('✅ CJS: Correctly threw error for empty API key');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ CJS test failed: ${error.message}`);
    return false;
  }
}

function testTypes() {
  try {
    console.log('🧪 Testing TypeScript types...');
    const typesPath = path.join(__dirname, 'dist', 'index.d.ts');
    
    if (!fs.existsSync(typesPath)) {
      console.log('❌ Types: index.d.ts file not found');
      return false;
    }
    
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    // Check for essential exports
    const requiredExports = [
      'EmailListVerify',
      'EmailVerificationResult',
      'EmailVerificationResponse',
      'BulkVerificationResponse',
      'EmailListVerifyError'
    ];
    
    for (const exportName of requiredExports) {
      if (!typesContent.includes(exportName)) {
        console.log(`❌ Types: Missing export ${exportName}`);
        return false;
      }
    }
    
    console.log('✅ Types: All required exports found in type definitions');
    return true;
  } catch (error) {
    console.log(`❌ Types test failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Running EmailListVerify SDK Tests\n');
  
  // Check if build files exist
  const requiredFiles = [
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      console.log(`❌ Build file missing: ${file}`);
      console.log('Please run "npm run build" first');
      process.exit(1);
    }
  }
  
  const results = [
    await testESM(),
    testCJS(),
    testTypes()
  ];
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});