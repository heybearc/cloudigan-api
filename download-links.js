/**
 * Download Links Generator
 * Generates platform-specific Datto RMM agent download links
 */

/**
 * Generate download links for all platforms
 * @param {string} siteUid - Datto site UID
 * @returns {object} Download links for Windows, macOS, and Linux
 */
function generateDownloadLinks(siteUid) {
  // Extract platform from DATTO_API_URL
  // e.g., https://vidal-api.centrastage.net -> vidal
  const platform = process.env.DATTO_API_URL.match(/https:\/\/(\w+)-api/)[1];
  
  const baseUrl = `https://${platform}.rmm.datto.com`;
  
  return {
    windows: `${baseUrl}/download/agent/windows/${siteUid}`,
    mac: `${baseUrl}/download/agent/mac/${siteUid}`,
    linux: `${baseUrl}/download/agent/linux/${siteUid}`
  };
}

module.exports = {
  generateDownloadLinks
};
