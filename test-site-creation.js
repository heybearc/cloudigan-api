/**
 * Test Datto site creation
 */

require('dotenv').config();
const dattoAuth = require('./datto-auth');

async function testSiteCreation() {
  console.log('=== Testing Datto Site Creation ===\n');
  
  const testSite = {
    name: `Test Site ${Date.now()}`,
    description: 'Test site created via API',
    notes: 'This is a test site - can be deleted',
  };
  
  try {
    console.log('Creating site:', testSite.name);
    
    const siteData = await dattoAuth.makeAuthenticatedRequest('/api/v2/site', {
      method: 'PUT',
      body: JSON.stringify(testSite),
    });
    
    console.log('\n✅ Site created successfully!');
    console.log('Site UID:', siteData.uid);
    console.log('Site Name:', siteData.name);
    console.log('Site ID:', siteData.id);
    
    // List all sites to confirm
    console.log('\n📋 Listing all sites...');
    const sitesData = await dattoAuth.makeAuthenticatedRequest('/api/v2/account/sites');
    console.log(`Total sites: ${sitesData.sites?.length || 0}`);
    
    // Find our new site
    const newSite = sitesData.sites?.find(s => s.uid === siteData.uid);
    if (newSite) {
      console.log('✅ New site confirmed in site list');
    }
    
    console.log('\n🎉 Site creation test PASSED!');
    console.log('\n📋 Next steps:');
    console.log('1. Find agent download link endpoint');
    console.log('2. Test complete webhook flow');
    console.log('3. Deploy webhook handler');
    
    return siteData;
    
  } catch (error) {
    console.error('\n❌ Site creation failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    throw error;
  }
}

testSiteCreation();
