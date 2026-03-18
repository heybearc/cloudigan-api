/**
 * Download Links Generator
 * Generates platform-specific Datto RMM agent download links
 */

/**
 * Generate download links for all platforms
 * @param {string} siteId - Datto site ID (numeric)
 * @param {string} siteUid - Datto site UID
 * @returns {object} Download links for Windows, macOS, and Linux
 */
function generateDownloadLinks(siteId, siteUid) {
  // Extract platform from DATTO_API_URL
  // e.g., https://vidal-api.centrastage.net -> vidal
  const platform = process.env.DATTO_API_URL.match(/https:\/\/(\w+)-api/)[1];
  
  const baseUrl = `https://${platform}.rmm.datto.com/download-agent`;
  
  return {
    windows: `${baseUrl}/windows/${siteUid}`,
    mac: `${baseUrl}/mac/${siteUid}`,
    linux: `${baseUrl}/linux/${siteUid}`,
    siteUid: siteUid
  };
}

module.exports = {
  generateDownloadLinks
};
