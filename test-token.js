/**
 * Test the Postman token
 */

const axios = require('axios');

const DATTO_API_URL = 'https://vidal-api.centrastage.net';
const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiYWVtLWFwaSJdLCJ1c2VyX25hbWUiOiJjbG91ZHktYXBpIiwic2NvcGUiOlsiZGFmYXVsdCJdLCJjbGllbnRBdXRob3JpdGllcyI6W10sImFjY291bnRfdWlkIjoidmlkZDNlOTAwMDEiLCJleHAiOjE3NzQwMzczMTAsImlhdCI6MTc3MzY3NzMxMCwiYXV0aG9yaXRpZXMiOlsiQVVUT1RBU0tfQUVNX1VTRVIiXSwianRpIjoiU1BxT0Q0ZldIYlR3QUtZWDhGQWpHaFVwenZVIiwiY2xpZW50X2lkIjoicHVibGljLWNsaWVudCJ9.Zl-hGpAIWu_NkDOBbq72_FDnoKPNndUn036AhSv7Y6b9Y5vZmbinP4K26_sQw25D0Ep8MVO2OKIMxheUoisLb-9SV41PXg1u_p1cVSxrVIVxCrxPxGLEu1Lg_9h4osApMdSEu964RPPcZiiUXMFJCo1F4-9DxzPzQIA1bDxJkp8-M62TFhCT87vfRmusXHdpgH0TIdSLtWxFGJS6hnNSWDqDXRoUnGrsGYAq0wr-ZxVpnzekzxyZbUqJNL9odhmbogBkjV95flc9I3TLjNivu5gkQUXnS-AOs41TG0VJS92WZv0uhPHFaQ7njfvMm2RhpOgANQg1Ey9ODR5GnhFKEg';

async function testToken() {
  console.log('Testing Datto API with token...\n');
  
  try {
    // Decode JWT to see expiration
    const payload = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64').toString());
    const expiresAt = new Date(payload.exp * 1000);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
    
    console.log('Token Info:');
    console.log('  User:', payload.user_name);
    console.log('  Account UID:', payload.account_uid);
    console.log('  Expires:', expiresAt.toLocaleString());
    console.log('  Hours until expiry:', Math.round(hoursUntilExpiry));
    console.log();
    
    // Test API calls
    console.log('1. GET /api/v2/account');
    const accountResponse = await axios.get(
      `${DATTO_API_URL}/api/v2/account`,
      { headers: { 'Authorization': `Bearer ${TOKEN}` } }
    );
    console.log('✅ Account:', accountResponse.data.name);
    console.log('   UID:', accountResponse.data.uid);
    
    console.log('\n2. GET /api/v2/account/sites');
    const sitesResponse = await axios.get(
      `${DATTO_API_URL}/api/v2/account/sites`,
      { headers: { 'Authorization': `Bearer ${TOKEN}` } }
    );
    console.log('✅ Sites:', sitesResponse.data.sites?.length || 0);
    
    if (sitesResponse.data.sites && sitesResponse.data.sites.length > 0) {
      console.log('\nExisting sites:');
      sitesResponse.data.sites.slice(0, 3).forEach((site, i) => {
        console.log(`   ${i + 1}. ${site.name} (UID: ${site.uid})`);
      });
    }
    
    console.log('\n✅ TOKEN WORKS! API access confirmed.');
    console.log('\n📋 Next: Implement automated token refresh using Playwright');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testToken();
