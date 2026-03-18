/**
 * Test API with token from Postman
 * This will help us understand token lifetime and API usage
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const DATTO_API_URL = 'https://vidal-api.centrastage.net';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testWithToken(token) {
  console.log('\nTesting Datto API with Postman token...\n');
  
  try {
    // Test 1: Get account
    console.log('1. GET /api/v2/account');
    const accountResponse = await axios.get(
      `${DATTO_API_URL}/api/v2/account`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    console.log('✅ Account:', accountResponse.data.name);
    console.log('   UID:', accountResponse.data.uid);
    
    // Test 2: List sites
    console.log('\n2. GET /api/v2/account/sites');
    const sitesResponse = await axios.get(
      `${DATTO_API_URL}/api/v2/account/sites`,
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
    
    console.log('\n✅ SUCCESS! Token is working!');
    console.log('\n📋 Token appears to be valid.');
    console.log('According to Datto docs, tokens expire after 100 hours.');
    console.log('\nFor automation, we need a way to get tokens programmatically.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n⚠️  Token expired or invalid');
      }
    }
  }
}

rl.question('Paste your access token from Postman: ', (token) => {
  testWithToken(token.trim()).finally(() => rl.close());
});
