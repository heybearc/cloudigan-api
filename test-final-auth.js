/**
 * Final authentication test with proper error handling
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function getDattoToken() {
  console.log('Getting OAuth token...\n');
  
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
        validateStatus: () => true,
      }
    );
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.access_token) {
      console.log('\n✅ Token received successfully!');
      return response.data.access_token;
    } else {
      console.log('\n❌ Token request failed');
      throw new Error(`Status ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

async function testApiCalls(token) {
  console.log('\n=== Testing API Calls ===\n');
  
  try {
    const accountResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    console.log('✅ Account:', accountResponse.data.name);
    
    const sitesResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    console.log('✅ Sites:', sitesResponse.data.sites?.length || 0);
    
    return true;
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const token = await getDattoToken();
    await testApiCalls(token);
    console.log('\n✅ SUCCESS! Ready for Stripe integration');
  } catch (error) {
    console.log('\n❌ Authentication failed');
    console.log('\nPlease regenerate API keys in Datto RMM:');
    console.log('Setup > Users > cloudy-api > Generate API Keys');
    process.exit(1);
  }
}

main();
