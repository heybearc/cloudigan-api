/**
 * Test OAuth using public-client credentials from Postman config
 * Trying Resource Owner Password Credentials grant
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
  tokenUrl: 'https://vidal-api.centrastage.net/auth/oauth/token',
  clientId: 'public-client',
  clientSecret: 'public',
};

async function getTokenWithPublicClient() {
  console.log('=== Testing OAuth with public-client ===\n');
  console.log('Token URL:', DATTO_CONFIG.tokenUrl);
  console.log('Client ID:', DATTO_CONFIG.clientId);
  console.log('Grant Type: password (Resource Owner Password Credentials)\n');
  
  // Try Resource Owner Password Credentials grant
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', DATTO_CONFIG.clientId);
  params.append('client_secret', DATTO_CONFIG.clientSecret);
  params.append('username', DATTO_CONFIG.apiKey);
  params.append('password', DATTO_CONFIG.apiSecretKey);
  
  try {
    console.log('Requesting token...');
    const response = await axios.post(
      DATTO_CONFIG.tokenUrl,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        validateStatus: () => true,
      }
    );
    
    console.log('Response Status:', response.status);
    
    if (response.status === 200 && response.data.access_token) {
      console.log('\n✅ SUCCESS! Got access token!');
      console.log('Access Token:', response.data.access_token.substring(0, 30) + '...');
      console.log('Token Type:', response.data.token_type);
      console.log('Expires In:', response.data.expires_in, 'seconds');
      
      if (response.data.refresh_token) {
        console.log('Refresh Token:', response.data.refresh_token.substring(0, 30) + '...');
      }
      
      // Test the token
      await testApiWithToken(response.data.access_token);
      
      return response.data;
    } else {
      console.log('\n❌ Failed to get token');
      console.log('Response:', typeof response.data === 'string' ? 
        response.data.substring(0, 200) : 
        JSON.stringify(response.data, null, 2)
      );
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

async function testApiWithToken(token) {
  console.log('\n=== Testing API with token ===\n');
  
  try {
    const accountResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    console.log('✅ Account:', accountResponse.data.name);
    console.log('   UID:', accountResponse.data.uid);
    
    const sitesResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    
    console.log('✅ Sites:', sitesResponse.data.sites?.length || 0);
    
    console.log('\n🎉 AUTHENTICATION WORKING!');
    console.log('Ready to implement in webhook handler.');
    
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    console.error('Status:', error.response?.status);
  }
}

getTokenWithPublicClient();
