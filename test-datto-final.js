/**
 * Final test - Using correct Datto RMM API based on OpenAPI spec
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function getDattoToken() {
  console.log('Getting OAuth token with Basic Auth...');
  
  const credentials = Buffer.from(
    `${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`
  ).toString('base64');

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

  console.log('✅ Token received');
  return response.data.access_token;
}

async function testEndpoints(token) {
  console.log('\n=== Testing Datto RMM API Endpoints ===\n');

  // 1. Get account info
  console.log('1. Getting account info...');
  const accountResponse = await axios.get(
    `${DATTO_CONFIG.apiUrl}/api/v2/account`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  console.log('✅ Account:', accountResponse.data.name);
  console.log('   Account UID:', accountResponse.data.uid);

  // 2. List sites
  console.log('\n2. Listing sites...');
  const sitesResponse = await axios.get(
    `${DATTO_CONFIG.apiUrl}/api/v2/account/sites`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  console.log('✅ Found', sitesResponse.data.sites?.length || 0, 'sites');
  
  if (sitesResponse.data.sites && sitesResponse.data.sites.length > 0) {
    console.log('\nFirst 3 sites:');
    sitesResponse.data.sites.slice(0, 3).forEach((site, i) => {
      console.log(`   ${i + 1}. ${site.name} (UID: ${site.uid})`);
    });
  }

  // 3. Test creating a site (this is what we need for Stripe integration)
  console.log('\n3. Testing site creation endpoint...');
  console.log('   Endpoint: PUT /api/v2/site');
  console.log('   Required fields: name (string)');
  console.log('   Optional fields: description, notes, onDemand, splashtopAutoInstall, proxySettings');
  
  // 4. Check for agent download/installation package endpoint
  console.log('\n4. Checking for agent installation package endpoint...');
  console.log('   Note: Agent download links are typically generated per-site');
  console.log('   Need to check site settings or device deployment endpoints');

  return sitesResponse.data;
}

async function main() {
  try {
    const token = await getDattoToken();
    const data = await testEndpoints(token);
    
    console.log('\n✅ All tests passed!');
    console.log('\n📋 Integration Summary:');
    console.log('   - Authentication: Working ✓');
    console.log('   - List Sites: Working ✓');
    console.log('   - Create Site: Endpoint identified (PUT /api/v2/site)');
    console.log('   - Agent Download: Need to investigate further');
    
    console.log('\n🔍 Next Steps:');
    console.log('   1. Test creating a site via API');
    console.log('   2. Find agent download link endpoint');
    console.log('   3. Update webhook handler with correct endpoints');
    console.log('   4. Deploy and test with Stripe');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

main();
