/**
 * Correct OAuth 2.0 flow for Datto RMM
 * Based on official documentation
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function getDattoOAuthToken() {
  console.log('Step 1: Getting OAuth 2.0 access token...\n');
  console.log('API URL:', DATTO_CONFIG.apiUrl);
  console.log('Grant Type: password');
  console.log('Username (API Key):', DATTO_CONFIG.apiKey.substring(0, 10) + '...');
  
  try {
    // OAuth 2.0 password grant with API keys as username/password
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', DATTO_CONFIG.apiKey);
    params.append('password', DATTO_CONFIG.apiSecretKey);
    
    const tokenResponse = await axios.post(
      `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log('✅ OAuth token received!');
    console.log('Access Token:', tokenResponse.data.access_token.substring(0, 20) + '...');
    console.log('Token Type:', tokenResponse.data.token_type);
    console.log('Expires In:', tokenResponse.data.expires_in, 'seconds');
    
    return tokenResponse.data.access_token;
    
  } catch (error) {
    console.error('❌ Failed to get OAuth token');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    
    // Check if it's an HTML response (login page)
    if (typeof error.response?.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
      console.error('\n⚠️  Received HTML login page instead of token');
      console.error('This usually means:');
      console.error('  1. API access is not enabled in Datto RMM');
      console.error('  2. API keys are incorrect or expired');
      console.error('  3. The user account doesn\'t have API access');
      console.error('\nPlease verify in Datto RMM:');
      console.error('  - Setup > Global Settings > Access Control > Enable API Access = ON');
      console.error('  - Setup > Users > [Your User] > API Keys are generated');
    }
    
    throw error;
  }
}

async function testApiWithToken(token) {
  console.log('\nStep 2: Testing API calls with OAuth token...\n');
  
  try {
    // Test 1: Get account info
    console.log('Test 1: GET /api/v2/account');
    const accountResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Account:', accountResponse.data.name);
    console.log('   UID:', accountResponse.data.uid);
    
    // Test 2: List sites
    console.log('\nTest 2: GET /api/v2/account/sites');
    const sitesResponse = await axios.get(
      `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Sites:', sitesResponse.data.sites?.length || 0);
    
    if (sitesResponse.data.sites && sitesResponse.data.sites.length > 0) {
      console.log('\nExisting sites:');
      sitesResponse.data.sites.slice(0, 5).forEach((site, i) => {
        console.log(`   ${i + 1}. ${site.name} (UID: ${site.uid})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API call failed');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('=== Datto RMM OAuth 2.0 Authentication Test ===\n');
  
  try {
    const token = await getDattoOAuthToken();
    await testApiWithToken(token);
    
    console.log('\n✅ SUCCESS! Datto RMM API is working correctly.');
    console.log('\n📋 Integration Ready:');
    console.log('   ✓ OAuth authentication working');
    console.log('   ✓ API access verified');
    console.log('   ✓ Can list sites');
    console.log('\n🚀 Next: Update webhook handler and test site creation');
    
  } catch (error) {
    console.log('\n❌ Integration test failed');
    console.log('\nPlease check:');
    console.log('  1. API access is enabled in Datto RMM (Setup > Global Settings)');
    console.log('  2. API keys are correctly generated for your user');
    console.log('  3. Keys haven\'t been regenerated (which invalidates old keys)');
    process.exit(1);
  }
}

main();
