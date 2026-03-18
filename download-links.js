/**
 * Download Links Generator
 * Generates platform-specific Datto RMM agent download links
 */

/**
 * Generate download links for all platforms
 * @param {string} siteId - Datto site ID (numeric)
 * @param {string} siteUid - Datto site UID
 * @returns {object} Download links (single portal URL for all platforms)
 */
function generateDownloadLinks(siteId, siteUid) {
  // Extract platform from DATTO_API_URL
  // e.g., https://vidal-api.centrastage.net -> vidal
  const platform = process.env.DATTO_API_URL.match(/https:\/\/(\w+)-api/)[1];
  
  // Datto portal URL - customers download agents for all platforms from this single URL
  const portalUrl = `https://${platform}.rmm.datto.com/site/${siteId}`;
  
  return {
    portal: portalUrl,
    windows: portalUrl,
    mac: portalUrl,
    linux: portalUrl,
    siteUid: siteUid
  };
}

module.exports = {
  generateDownloadLinks
};
