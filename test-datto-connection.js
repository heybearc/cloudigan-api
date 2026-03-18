/**
 * Test script to verify Datto RMM API connection
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function testDattoConnection() {
  console.log('Testing Datto RMM API connection...');
  console.log('API URL:', DATTO_CONFIG.apiUrl);
  console.log('API Key:', DATTO_CONFIG.apiKey.substring(0, 10) + '...');
  
  try {
    // Step 1: Get OAuth token
    console.log('\n1. Requesting OAuth token...');
    const tokenResponse = await axios.post(
      `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
      new URLSearchParams({
        grant_type: 'password',
        username: DATTO_CONFIG.apiKey,
        password: DATTO_CONFIG.apiSecretKey,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ OAuth token received');
    console.log('Token expires in:', tokenResponse.data.expires_in, 'seconds');

    // Step 2: Test API access - Get account sites
    console.log('\n2. Testing API access - fetching sites...');
    const sitesResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    console.log('✅ Successfully connected to Datto RMM API');
    console.log('Number of sites:', sitesResponse.data.sites?.length || 0);
    
    if (sitesResponse.data.sites && sitesResponse.data.sites.length > 0) {
      console.log('\nFirst 3 sites:');
      sitesResponse.data.sites.slice(0, 3).forEach(site => {
        console.log(`  - ${site.name} (UID: ${site.uid})`);
      });
    }

    // Step 3: Check API documentation endpoint
    console.log('\n3. Checking API documentation...');
    console.log('Swagger UI available at:');
    console.log(`${DATTO_CONFIG.apiUrl}/api/swagger-ui/index.html`);

    console.log('\n✅ All tests passed! Datto RMM API is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Error connecting to Datto RMM API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testDattoConnection();
