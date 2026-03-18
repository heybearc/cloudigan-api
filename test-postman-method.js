/**
 * Test using the exact Postman OAuth 2.0 method from Datto docs
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function testPostmanMethod() {
  console.log('Testing Postman OAuth 2.0 method...\n');
  console.log('API URL:', DATTO_CONFIG.apiUrl);
  console.log('Token URL:', `${DATTO_CONFIG.apiUrl}/auth/oauth/token`);
  
  // Try the exact parameters Postman would use for OAuth 2.0 Password Grant
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', DATTO_CONFIG.apiKey);
  params.append('password', DATTO_CONFIG.apiSecretKey);
  
  console.log('\nRequest details:');
  console.log('Method: POST');
  console.log('URL:', `${DATTO_CONFIG.apiUrl}/auth/oauth/token`);
  console.log('Content-Type: application/x-www-form-urlencoded');
  console.log('Body:', params.toString());
  
  try {
    const response = await axios.post(
      `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        validateStatus: () => true, // Don't throw on any status
      }
    );
    
    console.log('\n=== Response ===');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    
    if (response.status === 200) {
      console.log('\n✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return response.data.access_token;
    } else {
      console.log('\n❌ Failed with status:', response.status);
      
      // Check if HTML response
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.log('Response: HTML login page (truncated)');
        console.log(response.data.substring(0, 500) + '...');
      } else {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

async function checkApiKeyFormat() {
  console.log('\n=== Checking API Key Format ===');
  console.log('API Key length:', DATTO_CONFIG.apiKey.length);
  console.log('API Secret length:', DATTO_CONFIG.apiSecretKey.length);
  console.log('API Key format:', /^[A-Z0-9]+$/.test(DATTO_CONFIG.apiKey) ? 'Valid (alphanumeric uppercase)' : 'Invalid format');
  console.log('API Secret format:', /^[A-Z0-9]+$/.test(DATTO_CONFIG.apiSecretKey) ? 'Valid (alphanumeric uppercase)' : 'Invalid format');
}

async function main() {
  await checkApiKeyFormat();
  await testPostmanMethod();
  
  console.log('\n=== Troubleshooting Steps ===');
  console.log('1. Verify API access is enabled: Setup > Global Settings > Access Control');
  console.log('2. Verify user has API keys: Setup > Users > cloudy-api');
  console.log('3. Try regenerating API keys (this invalidates old ones)');
  console.log('4. Check if user account is active (not disabled)');
  console.log('5. Verify you copied the FULL API Secret Key (only shown once)');
  console.log('\nIf still failing, the API keys may need to be regenerated.');
}

main();
