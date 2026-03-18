/**
 * Test script v3 - Using correct Datto RMM authentication
 * Based on josh-fisher/datto-rmm implementation
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
  platform: 'vidal', // Extracted from your API URL
};

async function getDattoToken() {
  console.log('Getting Datto OAuth token...');
  console.log('Platform:', DATTO_CONFIG.platform);
  console.log('API URL:', DATTO_CONFIG.apiUrl);
  
  // Encode credentials as Base64 for Basic Auth
  const credentials = Buffer.from(
    `${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`
  ).toString('base64');

  try {
    const response = await axios.post(
      `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ Token received successfully!');
    console.log('Token type:', response.data.token_type);
    console.log('Expires in:', response.data.expires_in, 'seconds');
    
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Failed to get token');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function testApiCall(token) {
  console.log('\nTesting API call - fetching account sites...');
  
  try {
    const response = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('✅ API call successful!');
    console.log('Number of sites:', response.data.sites?.length || 0);
    
    if (response.data.sites && response.data.sites.length > 0) {
      console.log('\nFirst 5 sites:');
      response.data.sites.slice(0, 5).forEach((site, index) => {
        console.log(`  ${index + 1}. ${site.name} (UID: ${site.uid})`);
      });
    }

    return response.data;
  } catch (error) {
    console.error('❌ API call failed');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function main() {
  console.log('=== Datto RMM API Connection Test ===\n');
  
  try {
    const token = await getDattoToken();
    await testApiCall(token);
    
    console.log('\n✅ All tests passed!');
    console.log('\nNext steps:');
    console.log('1. Check Swagger UI for available endpoints:');
    console.log(`   ${DATTO_CONFIG.apiUrl}/api/swagger-ui/index.html`);
    console.log('2. Find endpoint for creating sites');
    console.log('3. Find endpoint for getting agent download links');
    
  } catch (error) {
    console.log('\n❌ Test failed');
    console.log('\nTroubleshooting:');
    console.log('1. Verify API keys are correct in .env file');
    console.log('2. Check that API access is enabled in Datto RMM');
    console.log('3. Ensure the API user has proper permissions');
    console.log('4. Try regenerating the API keys in Datto RMM');
    process.exit(1);
  }
}

main();
