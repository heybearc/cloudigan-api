/**
 * Wix CMS Integration
 * Inserts customer download records into Wix CMS collection
 */

const axios = require('axios');

const WIX_CONFIG = {
  siteId: process.env.WIX_SITE_ID,
  apiKey: process.env.WIX_API_KEY,
  collectionId: 'CustomerDownloads'
};

/**
 * Insert customer download record into Wix CMS
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
    windowsDownloadLink: data.downloadLinks.windows,
    macOsDownloadLink: data.downloadLinks.mac,
    linuxDownloadLink: data.downloadLinks.linux,
    createdDate: new Date().toISOString()
  };

  try {
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
          'Content-Type': 'application/json'
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
