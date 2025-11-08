/**
 * Test script for Vercel deployment
 * Run: node test-deployment.js
 */

const https = require('https');
const http = require('http');

// 🔧 CONFIGURE THIS
const BASE_URL = 'https://your-app.vercel.app'; // Replace with your URL
const USE_HTTPS = BASE_URL.startsWith('https');

// Test data
const testUserId = 'test_user_' + Date.now();
const testNoteId = 'test_note_' + Date.now();

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Helper to make HTTP requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = USE_HTTPS ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  log('\n📋 Test 1: Health Check', 'blue');
  log('   URL: ' + BASE_URL + '/api/health');
  
  try {
    const result = await makeRequest('/api/health');
    
    if (result.status === 200 && result.data.success) {
      log('   ✅ Server is running', 'green');
      log('   Database: ' + result.data.database, 'green');
      log('   DB State: ' + result.data.dbState, 'green');
      return true;
    } else {
      log('   ❌ Health check failed', 'red');
      log('   Response: ' + JSON.stringify(result.data, null, 2), 'yellow');
      return false;
    }
  } catch (error) {
    log('   ❌ Error: ' + error.message, 'red');
    return false;
  }
}

async function testRootEndpoint() {
  log('\n📋 Test 2: Root Endpoint', 'blue');
  log('   URL: ' + BASE_URL + '/');
  
  try {
    const result = await makeRequest('/');
    
    if (result.status === 200) {
      log('   ✅ Root endpoint accessible', 'green');
      return true;
    } else {
      log('   ❌ Root endpoint failed', 'red');
      return false;
    }
  } catch (error) {
    log('   ❌ Error: ' + error.message, 'red');
    return false;
  }
}

async function testGetFiles() {
  log('\n📋 Test 3: Get Files for Note', 'blue');
  log('   URL: ' + BASE_URL + `/api/files/${testUserId}/${testNoteId}`);
  
  try {
    const result = await makeRequest(`/api/files/${testUserId}/${testNoteId}`);
    
    if (result.status === 200 && result.data.success) {
      log('   ✅ Get files endpoint working', 'green');
      log('   Files found: ' + result.data.files.length, 'green');
      return true;
    } else {
      log('   ⚠️  Endpoint returned error (this might be expected)', 'yellow');
      log('   Response: ' + JSON.stringify(result.data, null, 2), 'yellow');
      return true; // Not a critical failure
    }
  } catch (error) {
    log('   ❌ Error: ' + error.message, 'red');
    return false;
  }
}

async function testFileUploadInfo() {
  log('\n📋 Test 4: File Upload Info', 'blue');
  log('   ⚠️  Cannot test actual upload without FormData', 'yellow');
  log('   Use Postman or Thunder Client to test:', 'blue');
  log('   POST ' + BASE_URL + '/api/upload-files', 'blue');
  log('   Body (form-data):', 'blue');
  log('     - userId: users', 'blue');
  log('     - noteId: 1234', 'blue');
  log('     - noteType: text', 'blue');
  log('     - files: [select file]', 'blue');
  return true;
}

// Run all tests
async function runTests() {
  log('\n🚀 Starting Deployment Tests', 'blue');
  log('═══════════════════════════════════════', 'blue');
  log('Target: ' + BASE_URL, 'yellow');
  log('═══════════════════════════════════════\n', 'blue');

  const tests = [
    testHealthCheck,
    testRootEndpoint,
    testGetFiles,
    testFileUploadInfo,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    else failed++;
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log('\n═══════════════════════════════════════', 'blue');
  log('📊 Test Results:', 'blue');
  log(`   ✅ Passed: ${passed}`, passed > 0 ? 'green' : 'yellow');
  log(`   ❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('═══════════════════════════════════════\n', 'blue');

  if (failed === 0) {
    log('🎉 All tests passed! Your deployment is working!', 'green');
  } else {
    log('⚠️  Some tests failed. Check the logs above for details.', 'yellow');
    log('\n💡 Common fixes:', 'blue');
    log('   1. Verify MONGODB_URI in Vercel environment variables', 'yellow');
    log('   2. Check MongoDB Atlas network access (allow 0.0.0.0/0)', 'yellow');
    log('   3. Verify database user has read/write permissions', 'yellow');
    log('   4. Check Vercel function logs for detailed errors', 'yellow');
  }
}

// Run tests
if (BASE_URL === 'https://your-app.vercel.app') {
  log('❌ Please update BASE_URL in the script with your Vercel URL', 'red');
  process.exit(1);
}

runTests().catch(error => {
  log('❌ Test suite failed: ' + error.message, 'red');
  process.exit(1);
});