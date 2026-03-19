#!/usr/bin/env node
/**
 * Test site-level access token vs account-level IST token
 */

require('dotenv').config();
const axios = require('axios');

const SITE_TOKEN = 'e1c7c474-4d12-462d-b03a-6ad2fc003e59:CmK5faVFyMYlq1mC:imirjTuDoCwVyOSoe7Cde2hoSRzLE4b9';
const ACCOUNT_TOKEN = process.env.WIX_API_KEY;
const SITE_ID = process.env.WIX_SITE_ID;

async function testToken(tokenName, token) {
  console.log(`\nTesting ${tokenName}...`);
  try {
    const response = await axios.post(
      'https://www.wixapis.com/wix-data/v2/items',
      {
        dataCollectionId: 'CustomerDownloads',
        dataItem: {
          data: {
            title: `${tokenName} Test ${Date.now()}`,
            sessionId: `test_${Date.now()}`,
            customerEmail: 'test@test.com',
            customerName: 'Test User',
            dattoSiteUid: 'test-uid',
            companyName: '',
            isBusinessProduct: false,
            windowsDownloadLink: 'https://test.com/win',
            macOsDownloadLink: 'https://test.com/mac',
            linuxDownloadLink: 'https://test.com/linux',
            createdDate: new Date().toISOString()
          }
        }
      },
      {
        headers: {
          'Authorization': token,
          'wix-site-id': SITE_ID,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ ${tokenName} SUCCESS!`);
    console.log('Created item:', response.data.dataItem?.id);
    return true;
  } catch (error) {
    console.log(`❌ ${tokenName} FAILED:`, error.response?.status, error.response?.data?.message);
    return false;
  }
}

(async () => {
  console.log('Testing Wix API tokens...\n');
  
  const siteTokenWorks = await testToken('Site-Level Token', SITE_TOKEN);
  const accountTokenWorks = await testToken('Account-Level Token (IST)', ACCOUNT_TOKEN);
  
  console.log('\n=== RESULTS ===');
  console.log('Site-Level Token:', siteTokenWorks ? '✅ WORKS' : '❌ FAILED');
  console.log('Account-Level Token:', accountTokenWorks ? '✅ WORKS' : '❌ FAILED');
  
  if (siteTokenWorks && !accountTokenWorks) {
    console.log('\n💡 Solution: Replace WIX_API_KEY with site-level access token');
  }
})();
