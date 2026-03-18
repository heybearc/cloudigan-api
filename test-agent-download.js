/**
 * Find the agent download link endpoint
 */

require('dotenv').config();
const dattoAuth = require('./datto-auth');

async function findAgentDownloadEndpoint() {
  console.log('=== Finding Agent Download Link ===\n');
  
  try {
    // Get the test site we just created
    const sitesData = await dattoAuth.makeAuthenticatedRequest('/api/v2/account/sites');
    const testSite = sitesData.sites.find(s => s.name.startsWith('Test Site'));
    
    if (!testSite) {
      console.log('No test site found, using first site');
      testSite = sitesData.sites[0];
    }
    
    console.log('Using site:', testSite.name);
    console.log('Site UID:', testSite.uid);
    
    // Try different potential endpoints
    const endpoints = [
      `/api/v2/site/${testSite.uid}/agent`,
      `/api/v2/site/${testSite.uid}/download`,
      `/api/v2/site/${testSite.uid}/agent-download`,
      `/api/v2/site/${testSite.uid}/installer`,
      `/api/v2/site/${testSite.uid}`,
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\nTrying: ${endpoint}`);
      try {
        const data = await dattoAuth.makeAuthenticatedRequest(endpoint);
        console.log('✅ Response received');
        console.log('Keys:', Object.keys(data).join(', '));
        
        // Look for download-related fields
        const downloadFields = Object.keys(data).filter(k => 
          k.toLowerCase().includes('download') || 
          k.toLowerCase().includes('agent') ||
          k.toLowerCase().includes('installer') ||
          k.toLowerCase().includes('url')
        );
        
        if (downloadFields.length > 0) {
          console.log('📥 Found download-related fields:', downloadFields);
          downloadFields.forEach(field => {
            console.log(`   ${field}:`, data[field]);
          });
        }
        
      } catch (error) {
        console.log('❌', error.message.substring(0, 100));
      }
    }
    
    console.log('\n📋 Checking site details for portal URL...');
    const siteDetails = await dattoAuth.makeAuthenticatedRequest(`/api/v2/site/${testSite.uid}`);
    
    if (siteDetails.portalUrl) {
      console.log('✅ Portal URL found:', siteDetails.portalUrl);
      console.log('   This may contain agent download links');
    }
    
    console.log('\n💡 Agent download might be available through:');
    console.log('   1. Portal URL (requires login)');
    console.log('   2. Direct download URL (may need to be constructed)');
    console.log('   3. Separate agent management API');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findAgentDownloadEndpoint();
