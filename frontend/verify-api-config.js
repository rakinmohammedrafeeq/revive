#!/usr/bin/env node

/**
 * API Configuration Verification Script
 * 
 * This script verifies that:
 * 1. Environment variables are properly configured
 * 2. No hardcoded URLs exist in the codebase
 * 3. All API calls use the centralized client
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkEnvFiles() {
  log('\n📋 Checking environment files...', 'blue');
  
  const requiredFiles = ['.env', '.env.production', '.env.local', '.env.example'];
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    try {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('VITE_API_BASE_URL')) {
        log(`  ✓ ${file} exists and contains VITE_API_BASE_URL`, 'green');
      } else {
        log(`  ✗ ${file} missing VITE_API_BASE_URL`, 'red');
        missingFiles.push(file);
      }
    } catch (error) {
      log(`  ✗ ${file} not found`, 'red');
      missingFiles.push(file);
    }
  });
  
  return missingFiles.length === 0;
}

function scanDirectory(dir, patterns, exclude = []) {
  const results = [];
  
  function scan(currentDir) {
    const files = readdirSync(currentDir);
    
    files.forEach(file => {
      const fullPath = join(currentDir, file);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!exclude.some(ex => fullPath.includes(ex))) {
          scan(fullPath);
        }
      } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(file))) {
        const content = readFileSync(fullPath, 'utf-8');
        
        patterns.forEach(({ pattern, message }) => {
          if (pattern.test(content)) {
            results.push({ file: fullPath, message });
          }
        });
      }
    });
  }
  
  scan(dir);
  return results;
}

function checkHardcodedUrls() {
  log('\n🔍 Checking for hardcoded URLs...', 'blue');
  
  const patterns = [
    { pattern: /fetch\s*\(/g, message: 'Direct fetch() call found' },
    { pattern: /localhost:8080/g, message: 'Hardcoded localhost:8080 found' },
    { pattern: /render\.com/g, message: 'Hardcoded render.com URL found' },
    { pattern: /axios\.create\(/g, message: 'Multiple axios instances found' },
  ];
  
  const issues = scanDirectory('src', patterns, ['node_modules', 'dist', '.vite']);
  
  if (issues.length === 0) {
    log('  ✓ No hardcoded URLs or direct fetch calls found', 'green');
    return true;
  } else {
    issues.forEach(({ file, message }) => {
      log(`  ✗ ${message} in ${file}`, 'red');
    });
    return false;
  }
}

function checkApiClient() {
  log('\n🔧 Checking API client configuration...', 'blue');
  
  try {
    const clientContent = readFileSync('src/api/client.ts', 'utf-8');
    
    const checks = [
      { pattern: /VITE_API_BASE_URL/, message: 'Uses VITE_API_BASE_URL' },
      { pattern: /axios\.create/, message: 'Creates axios instance' },
      { pattern: /interceptors\.request/, message: 'Has request interceptor' },
      { pattern: /interceptors\.response/, message: 'Has response interceptor' },
      { pattern: /Authorization.*Bearer/, message: 'Adds auth token' },
      { pattern: /timeout/, message: 'Has timeout configured' },
    ];
    
    let allPassed = true;
    checks.forEach(({ pattern, message }) => {
      if (pattern.test(clientContent)) {
        log(`  ✓ ${message}`, 'green');
      } else {
        log(`  ✗ ${message}`, 'red');
        allPassed = false;
      }
    });
    
    return allPassed;
  } catch (error) {
    log('  ✗ src/api/client.ts not found', 'red');
    return false;
  }
}

function checkApiModules() {
  log('\n📦 Checking API modules...', 'blue');
  
  try {
    const apiFiles = readdirSync('src/api').filter(f => f.endsWith('.ts') && f !== 'client.ts' && f !== 'index.ts');
    
    let allUseClient = true;
    apiFiles.forEach(file => {
      const content = readFileSync(join('src/api', file), 'utf-8');
      if (content.includes('apiClient')) {
        log(`  ✓ ${file} uses apiClient`, 'green');
      } else {
        log(`  ✗ ${file} doesn't use apiClient`, 'red');
        allUseClient = false;
      }
    });
    
    return allUseClient;
  } catch (error) {
    log('  ✗ Could not read API modules', 'red');
    return false;
  }
}

// Run all checks
log('\n🚀 Starting API Configuration Verification\n', 'blue');

const results = {
  envFiles: checkEnvFiles(),
  hardcodedUrls: checkHardcodedUrls(),
  apiClient: checkApiClient(),
  apiModules: checkApiModules(),
};

// Summary
log('\n' + '='.repeat(50), 'blue');
log('📊 Verification Summary', 'blue');
log('='.repeat(50), 'blue');

const allPassed = Object.values(results).every(r => r);

if (allPassed) {
  log('\n✅ All checks passed! API configuration is correct.', 'green');
  process.exit(0);
} else {
  log('\n❌ Some checks failed. Please review the issues above.', 'red');
  process.exit(1);
}
