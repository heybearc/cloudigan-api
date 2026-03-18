/**
 * Automated Datto RMM OAuth token management using Playwright
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.datto-token.json');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL || 'https://vidal-api.centrastage.net',
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
  authUrl: 'https://vidal-api.centrastage.net/auth/oauth/authorize',
  tokenUrl: 'https://vidal-api.centrastage.net/auth/oauth/token',
  clientId: 'public-client',
  redirectUri: 'https://oauth.pstmn.io/v1/callback',
};

/**
 * Get a fresh OAuth token using Playwright automation
 */
async function getNewToken() {
  console.log('🤖 Starting automated OAuth flow...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Build OAuth authorization URL
    const authParams = new URLSearchParams({
      client_id: DATTO_CONFIG.clientId,
      redirect_uri: DATTO_CONFIG.redirectUri,
      response_type: 'code',
      scope: 'default',
    });
    
    const authUrl = `${DATTO_CONFIG.authUrl}?${authParams.toString()}`;
    
    console.log('📱 Navigating to OAuth login page...');
    await page.goto(authUrl);
    
    // Wait for login form
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    console.log('🔑 Entering API credentials...');
    await page.fill('input[name="username"]', DATTO_CONFIG.apiKey);
    await page.fill('input[name="password"]', DATTO_CONFIG.apiSecretKey);
    
    // Submit form and wait for redirect
    console.log('✅ Submitting login...');
    await Promise.all([
      page.waitForNavigation({ timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);
    
    // Wait for redirect to callback URL with authorization code
    await page.waitForURL(/oauth\.pstmn\.io.*code=/, { timeout: 30000 });
    
    const currentUrl = page.url();
    const urlParams = new URLSearchParams(new URL(currentUrl).search);
    const authCode = urlParams.get('code');
    
    if (!authCode) {
      throw new Error('No authorization code received');
    }
    
    console.log('🎟️  Authorization code received');
    
    // Exchange code for token
    console.log('🔄 Exchanging code for access token...');
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: DATTO_CONFIG.redirectUri,
      client_id: DATTO_CONFIG.clientId,
    });
    
    const tokenResponse = await fetch(DATTO_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Save token with metadata
    const tokenInfo = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      obtained_at: Date.now(),
      expires_at: Date.now() + (tokenData.expires_in * 1000),
    };
    
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
    
    console.log('✅ Token obtained and saved!');
    console.log(`   Expires in: ${Math.round(tokenData.expires_in / 3600)} hours`);
    
    return tokenInfo;
    
  } finally {
    await browser.close();
  }
}

/**
 * Get valid OAuth token (from cache only - no auto-refresh)
 * Token must be refreshed manually outside of webhook processing
 */
async function getToken() {
  try {
    // Try to load cached token
    const tokenData = await fs.readFile(TOKEN_FILE, 'utf8');
    const tokenInfo = JSON.parse(tokenData);
    
    // Check if token is still valid (with 1 hour buffer)
    const expiresIn = tokenInfo.expires_at - Date.now();
    const hoursRemaining = expiresIn / (1000 * 60 * 60);
    
    if (hoursRemaining > 1) {
      console.log(`✅ Using cached token (${Math.round(hoursRemaining)} hours remaining)`);
      return tokenInfo.access_token;
    }
    
    // Token expired - fail fast, don't refresh during webhook processing
    throw new Error(`Datto OAuth token expired (${Math.round(hoursRemaining)} hours remaining). Run 'node datto-auth.js' to refresh manually.`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('No Datto OAuth token found. Run \'node datto-auth.js\' to generate a token.');
    }
    throw error;
  }
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = await getToken();
  
  const response = await fetch(`${DATTO_CONFIG.apiUrl}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

module.exports = {
  getToken,
  getNewToken,
  makeAuthenticatedRequest,
};

// CLI usage
if (require.main === module) {
  (async () => {
    try {
      const token = await getToken();
      console.log('\n🎉 Token ready for use!');
      console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}
