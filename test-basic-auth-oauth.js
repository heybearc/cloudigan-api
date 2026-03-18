/**
 * Correct OAuth flow - Basic Auth to get token
 * Based on www-authenticate header response
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function getDattoToken() {
  console.log('Getting OAuth token with Basic Auth...\n');
  
  // Create Basic Auth header
  const credentials = Buffer.from(
    `${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`
  ).toString('base64');
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  
  try {
    const response = await axios.post(
      `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
      params,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log('✅ Token received!');
    console.log('Access Token:', response.data.access_token.substring(0, 30) + '...');
    console.log('Token Type:', response.data.token_type);
    console.log('Expires In:', response.data.expires_in, 'seconds');
    
    return response.data.access_token;
    
  } catch (error) {
    console.error('❌ Failed to get token');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    throw error;
  }
}

async function testApiCalls(token) {
  console.log('\n=== Testing API Calls ===\n');
  
  // Test 1: Get account
  console.log('1. GET /api/v2/account');
  const accountResponse = await axios.get(
    `${DATTO_CONFIG.apiUrl}/api/v2/account`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  console.log('✅ Account:', accountResponse.data.name);
  console.log('   UID:', accountResponse.data.uid);
  
  // Test 2: List sites
  console.log('\n2. GET /api/v2/account/sites');
  const sitesResponse = await axios.get(
    `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  console.log('✅ Sites:', sitesResponse.data.sites?.length || 0);
  
  if (sitesResponse.data.sites && sitesResponse.data.sites.length > 0) {
    console.log('\nExisting sites:');
    sitesResponse.data.sites.slice(0, 5).forEach((site, i) => {
      console.log(`   ${i + 1}. ${site.name} (UID: ${site.uid})`);
    });
  }
  
  return sitesResponse.data;
}

async function main() {
  console.log('=== Datto RMM API Authentication Test ===\n');
  
  try {
    const token = await getDattoToken();
    await testApiCalls(token);
    
    console.log('\n✅ SUCCESS! Datto RMM API is fully working!');
    console.log('\n🚀 Ready to integrate with Stripe');
    console.log('   Next: Update webhook handler and test site creation');
    
  } catch (error) {
    console.error('\n❌ Test failed');
    console.error('Error:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n⚠️  Still getting 401 - API keys may need to be regenerated');
      console.log('In Datto RMM:');
      console.log('1. Go to Setup > Users > cloudy-api');
      console.log('2. Click "Generate API Keys" (this invalidates old keys)');
      console.log('3. Copy the NEW API Key and Secret Key');
      console.log('4. Update the .env file with new credentials');
    }
    
    process.exit(1);
  }
}

main();
