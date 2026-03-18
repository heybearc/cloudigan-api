/**
 * Test script v2 - Try different OAuth authentication method
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function testDattoConnection() {
  console.log('Testing Datto RMM API connection (v2)...');
  console.log('API URL:', DATTO_CONFIG.apiUrl);
  
  try {
    // Try method 1: Client credentials grant
    console.log('\nMethod 1: Trying client_credentials grant...');
    try {
      const response1 = await axios.post(
        `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: DATTO_CONFIG.apiKey,
          client_secret: DATTO_CONFIG.apiSecretKey,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      console.log('✅ Success with client_credentials!');
      console.log('Token:', response1.data.access_token.substring(0, 20) + '...');
      return response1.data.access_token;
    } catch (err1) {
      console.log('❌ client_credentials failed:', err1.response?.status, err1.response?.data);
    }

    // Try method 2: Password grant (original)
    console.log('\nMethod 2: Trying password grant...');
    try {
      const response2 = await axios.post(
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
      console.log('✅ Success with password grant!');
      console.log('Token:', response2.data.access_token.substring(0, 20) + '...');
      return response2.data.access_token;
    } catch (err2) {
      console.log('❌ password grant failed:', err2.response?.status, err2.response?.data);
    }

    // Try method 3: Basic auth with API keys
    console.log('\nMethod 3: Trying Basic Auth...');
    try {
      const basicAuth = Buffer.from(`${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`).toString('base64');
      const response3 = await axios.post(
        `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      console.log('✅ Success with Basic Auth!');
      console.log('Token:', response3.data.access_token.substring(0, 20) + '...');
      return response3.data.access_token;
    } catch (err3) {
      console.log('❌ Basic Auth failed:', err3.response?.status, err3.response?.data);
    }

    // Try method 4: Direct API call without OAuth (some APIs allow this)
    console.log('\nMethod 4: Trying direct API call with API keys...');
    try {
      const response4 = await axios.get(
        `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
        {
          headers: {
            'X-API-Key': DATTO_CONFIG.apiKey,
            'X-API-Secret': DATTO_CONFIG.apiSecretKey,
          },
        }
      );
      console.log('✅ Success with direct API call!');
      console.log('Sites:', response4.data.sites?.length || 0);
      return 'direct';
    } catch (err4) {
      console.log('❌ Direct API call failed:', err4.response?.status, err4.response?.data);
    }

    console.log('\n❌ All authentication methods failed.');
    console.log('\nPlease check:');
    console.log('1. API keys are correct and active');
    console.log('2. API access is enabled in Datto RMM');
    console.log('3. User has proper permissions');
    console.log('\nAPI Documentation:');
    console.log(`${DATTO_CONFIG.apiUrl}/api/swagger-ui/index.html`);
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

testDattoConnection();
