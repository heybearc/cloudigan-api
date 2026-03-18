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
    siteUid: data.siteUid,
    customerEmail: data.customerEmail,
    customerName: data.customerName || data.customerEmail,
    windowsDownloadLink: data.downloadLinks.windows,
    macDownloadLink: data.downloadLinks.mac,
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
    console.error('Wix CMS insert failed:', error.response?.data || error.message);
    throw new Error(`Failed to insert into Wix CMS: ${error.message}`);
  }
}

module.exports = {
  insertCustomerDownload
};
