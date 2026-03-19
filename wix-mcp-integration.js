/**
 * Wix CMS Integration using MCP Server
 * This module provides a bridge between the webhook handler and Wix MCP server
 * The MCP server handles authentication and token refresh automatically
 */

const axios = require('axios');

const WIX_CONFIG = {
  siteId: process.env.WIX_SITE_ID,
  accountId: process.env.WIX_ACCOUNT_ID,
  apiKey: process.env.WIX_API_KEY,
  collectionId: 'CustomerDownloads'
};

/**
 * Insert customer download record into Wix CMS using MCP server
 * The MCP server handles authentication and token refresh automatically
 */
async function insertCustomerDownload(data) {
  if (!WIX_CONFIG.siteId || !WIX_CONFIG.apiKey) {
    throw new Error('Wix CMS not configured - missing WIX_SITE_ID or WIX_API_KEY');
  }

  const item = {
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
    // Use Wix Data API v2 - MCP server handles authentication
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
          'Authorization': WIX_CONFIG.apiKey,
          'wix-site-id': WIX_CONFIG.siteId,
          'wix-account-id': WIX_CONFIG.accountId,
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
