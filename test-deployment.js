/**
 * Test script for Vercel deployment
 * Run: node test-deployment.js
 */
const axios = require('axios');

const BASE_URL = 'https://itsmyvault-9lqe-git-main-abhishekmishra08195-gmailcoms-projects.vercel.app';

async function testDeployment() {
  console.log('🧪 Testing Fixed Deployment\n');
  
  // Test 1: Health Check
  try {
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 15000
    });
    console.log('✅ Health:', health.data);
  } catch (error) {
    console.log('❌ Health failed:', error.response?.data || error.message);
  }
  
  // Test 2: Root
  try {
    console.log('\n2️⃣ Testing Root...');
    const root = await axios.get(`${BASE_URL}/`, {
      timeout: 10000
    });
    console.log('✅ Root:', root.data);
  } catch (error) {
    console.log('❌ Root failed:', error.response?.data || error.message);
  }
  
  // Test 3: Get Files (should return empty array)
  try {
    console.log('\n3️⃣ Testing Get Files...');
    const files = await axios.get(`${BASE_URL}/api/files/test_user/test_note`, {
      timeout: 10000
    });
    console.log('✅ Files:', files.data);
  } catch (error) {
    console.log('❌ Files failed:', error.response?.data || error.message);
  }
}

testDeployment().then(() => {
  console.log('\n✅ Tests complete');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});