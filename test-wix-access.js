require('dotenv').config();
const axios = require('axios');

const WIX_API_KEY = process.env.WIX_API_KEY;
const WIX_SITE_ID = process.env.WIX_SITE_ID;

console.log('=== Testing Wix API Access ===');
console.log('Site ID:', WIX_SITE_ID);
console.log('API Key present:', !!WIX_API_KEY);
console.log('API Key length:', WIX_API_KEY?.length);

(async () => {
  try {
    // Test 1: Get site info
    console.log('\n1. Testing site access...');
    const siteResponse = await axios.get(
      `https://www.wixapis.com/v2/sites/${WIX_SITE_ID}`,
      {
        headers: {
          'Authorization': WIX_API_KEY,
          'wix-site-id': WIX_SITE_ID
        }
      }
    );
    console.log('✅ Site access successful');
    console.log('Site name:', siteResponse.data.site?.displayName);

    // Test 2: Try to access data collections
    console.log('\n2. Testing data collection access...');
    const collectionsResponse = await axios.get(
      `https://www.wixapis.com/wix-data/v2/collections`,
      {
        headers: {
          'Authorization': WIX_API_KEY,
          'wix-site-id': WIX_SITE_ID
        }
      }
    );
    console.log('✅ Data collections accessible');
    console.log('Collections found:', collectionsResponse.data.collections?.length || 0);
    
    // Test 3: Check for CustomerDownloads collection
    const hasCustomerDownloads = collectionsResponse.data.collections?.some(
      c => c.id === 'CustomerDownloads'
    );
    console.log('CustomerDownloads collection exists:', hasCustomerDownloads);

  } catch (error) {
    console.log('\n❌ Wix API access failed');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n⚠️  Token appears to be expired or invalid');
      console.log('You need to refresh the Wix API token');
    }
  }
})();
