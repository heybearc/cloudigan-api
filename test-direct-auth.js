/**
 * Test direct API authentication without OAuth
 * Based on PowerShell module approach
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function testDirectAuth() {
  console.log('Testing direct API authentication...\n');
  console.log('API URL:', DATTO_CONFIG.apiUrl);
  
  // Create Basic Auth header with API keys
  const authString = `${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`;
  const base64Auth = Buffer.from(authString).toString('base64');
  
  try {
    console.log('1. Testing GET /api/v2/account...');
    const response = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account`,
      {
        headers: {
          'Authorization': `Basic ${base64Auth}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Success!');
    console.log('Account:', response.data.name);
    console.log('Account UID:', response.data.uid);
    
    console.log('\n2. Testing GET /api/v2/account/sites...');
    const sitesResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
      {
        headers: {
          'Authorization': `Basic ${base64Auth}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Success!');
    console.log('Sites found:', sitesResponse.data.sites?.length || 0);
    
    if (sitesResponse.data.sites && sitesResponse.data.sites.length > 0) {
      console.log('\nFirst 3 sites:');
      sitesResponse.data.sites.slice(0, 3).forEach((site, i) => {
        console.log(`  ${i + 1}. ${site.name} (UID: ${site.uid})`);
      });
    }
    
    console.log('\n✅ Direct authentication works!');
    console.log('\n📋 For Stripe integration:');
    console.log('  - Use Basic Auth with API keys (no OAuth needed)');
    console.log('  - Create site: PUT /api/v2/site');
    console.log('  - Required: { "name": "Customer Name" }');
    console.log('  - Optional: description, notes, etc.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDirectAuth();
