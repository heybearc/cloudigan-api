/**
 * Test API without authentication
 * Since Swagger UI works without auth, maybe the API doesn't require it?
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_API_URL = 'https://vidal-api.centrastage.net';

async function testWithoutAuth() {
  console.log('Testing Datto API without authentication...\n');
  
  try {
    // Try the system/status endpoint (documented as not needing auth)
    console.log('1. GET /api/v2/system/status (no auth required)');
    const statusResponse = await axios.get(`${DATTO_API_URL}/api/v2/system/status`);
    console.log('✅ Status:', statusResponse.data.status);
    console.log('   Version:', statusResponse.data.version);
    
    // Try account endpoint without auth
    console.log('\n2. GET /api/v2/account (testing without auth)');
    const accountResponse = await axios.get(`${DATTO_API_URL}/api/v2/account`);
    console.log('✅ Account:', accountResponse.data.name);
    console.log('   This worked without authentication!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Status:', error.response?.status);
    
    if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication IS required');
      console.log('The API requires authentication but OAuth endpoint is not working.');
      console.log('\n**ACTION REQUIRED:**');
      console.log('Contact Datto Support and ask:');
      console.log('"How do I authenticate with the API using API keys?"');
      console.log('"The OAuth endpoint returns HTML instead of tokens."');
    }
  }
}

testWithoutAuth();
