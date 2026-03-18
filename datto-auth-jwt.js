/**
 * Datto RMM API Authentication using JWT (API Key/Secret)
 * Based on official Datto documentation
 */

require('dotenv').config();

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL || 'https://vidal-api.centrastage.net',
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

/**
 * Generate authentication header for Datto API
 * Uses API key and secret key directly (not base64 encoded)
 */
function generateAuthHeader() {
  // Datto uses the API key and secret key directly in the format shown in docs
  return `${DATTO_CONFIG.apiKey} ${DATTO_CONFIG.apiSecretKey}`;
}

/**
 * Make authenticated API request to Datto RMM
 */
async function makeAuthenticatedRequest(endpoint, options = {}) {
  const authHeader = generateAuthHeader();
  
  const url = `${DATTO_CONFIG.apiUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Datto API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Test the JWT authentication
 */
async function testAuth() {
  try {
    console.log('🔑 Testing Datto JWT authentication...');
    console.log('API URL:', DATTO_CONFIG.apiUrl);
    
    // Test with a simple API call (list sites)
    const result = await makeAuthenticatedRequest('/api/v2/account/sites');
    
    console.log('✅ Authentication successful!');
    console.log(`Found ${result.sites?.length || 0} sites`);
    
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

module.exports = {
  makeAuthenticatedRequest,
  generateAuthHeader,
  testAuth,
};

// CLI usage
if (require.main === module) {
  (async () => {
    const success = await testAuth();
    process.exit(success ? 0 : 1);
  })();
}
