/**
 * Test new API credentials
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function testAuth() {
  console.log('=== Testing New Datto API Credentials ===\n');
  console.log('API URL:', DATTO_CONFIG.apiUrl);
  console.log('API Key:', DATTO_CONFIG.apiKey);
  console.log('API Secret:', DATTO_CONFIG.apiSecretKey.substring(0, 10) + '...\n');
  
  // Step 1: Get OAuth token
  console.log('Step 1: Getting OAuth token...');
  const credentials = Buffer.from(
    `${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`
  ).toString('base64');
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  
  try {
    const tokenResponse = await axios.post(
      `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
      params,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        validateStatus: () => true,
      }
    );
    
    console.log('Token Response Status:', tokenResponse.status);
    console.log('Token Response Data:', JSON.stringify(tokenResponse.data, null, 2));
    
    if (tokenResponse.status !== 200) {
      console.log('\n❌ Failed to get token - Status:', tokenResponse.status);
      return;
    }
    
    const token = tokenResponse.data.access_token;
    if (!token) {
      console.log('\n❌ No access_token in response');
      return;
    }
    
    console.log('\n✅ Token received:', token.substring(0, 30) + '...');
    
    // Step 2: Test API call
    console.log('\nStep 2: Testing API call...');
    const accountResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    console.log('✅ Account:', accountResponse.data.name);
    console.log('   UID:', accountResponse.data.uid);
    
    // Step 3: List sites
    console.log('\nStep 3: Listing sites...');
    const sitesResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    console.log('✅ Sites found:', sitesResponse.data.sites?.length || 0);
    
    if (sitesResponse.data.sites && sitesResponse.data.sites.length > 0) {
      console.log('\nExisting sites:');
      sitesResponse.data.sites.slice(0, 5).forEach((site, i) => {
        console.log(`   ${i + 1}. ${site.name} (UID: ${site.uid})`);
      });
    }
    
    console.log('\n✅ SUCCESS! Datto RMM API is working!');
    console.log('\n🚀 Ready to complete Stripe integration');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuth();
