/**
 * Wix CMS Integration using OAuth
 * This module uses OAuth access tokens that are refreshed every 3 hours
 * Token refresh is handled by scripts/refresh-wix-token.sh (cron job)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.wix-tokens.json');

const WIX_CONFIG = {
  siteId: process.env.WIX_SITE_ID,
  accountId: process.env.WIX_ACCOUNT_ID,
  collectionId: 'CustomerDownloads'
};

/**
 * Get current OAuth access token from token file
 */
function getAccessToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      throw new Error('Wix token file not found. Run token refresh script first.');
    }
    const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    if (!tokens.access_token) {
      throw new Error('No access token found in token file');
    }
    return tokens.access_token;
  } catch (error) {
    console.error('Failed to read Wix access token:', error.message);
    throw error;
  }
}

/**
 * Insert customer download record into Wix CMS using MCP server
 * The MCP server handles authentication and token refresh automatically
 */
async function insertCustomerDownload(data) {
  if (!WIX_CONFIG.siteId) {
    throw new Error('Wix CMS not configured - missing WIX_SITE_ID');
  }

  const item = {
    title: `${data.customerName || data.customerEmail} - ${new Date().toLocaleDateString()}`,
    sessionId: data.sessionId,
    dattoSiteUid: data.siteUid,
    customerEmail: data.customerEmail,
    customerName: data.customerName || data.customerEmail,
    companyName: data.companyName || '',
    isBusinessProduct: data.isBusinessProduct || false,
    windowsDownloadLink: data.downloadLinks.windows,
    macOsDownloadLink: data.downloadLinks.mac,
    linuxDownloadLink: data.downloadLinks.linux,
    createdDate: new Date().toISOString()
  };

  try {
    // Get current OAuth access token
    const accessToken = getAccessToken();
    
    // Use Wix Data API v2 with OAuth authentication
    const response = await axios.post(
      `https://www.wixapis.com/wix-data/v2/items`,
      {
        dataCollectionId: WIX_CONFIG.collectionId,
        dataItem: {
          data: item
        }
      },
      {
        headers: {
          'Authorization': accessToken,
          'wix-site-id': WIX_CONFIG.siteId,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Wix CMS item created:', response.data);
    return response.data;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('Wix CMS insert failed:', JSON.stringify(errorDetails, null, 2));
    console.error('Request payload:', JSON.stringify({ dataCollectionId: WIX_CONFIG.collectionId, dataItem: { data: item } }, null, 2));
    throw new Error(`Failed to insert into Wix CMS: ${JSON.stringify(errorDetails)}`);
  }
}

module.exports = {
  insertCustomerDownload
};
