/**
 * Automated Datto RMM OAuth token management using Playwright
 */

require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

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
    // Note: Omitting scope parameter due to Datto bug that returns 'dafault' instead of 'default'
    const authParams = new URLSearchParams({
      client_id: DATTO_CONFIG.clientId,
      redirect_uri: DATTO_CONFIG.redirectUri,
      response_type: 'code',
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
    await page.click('button[type="submit"]');
    
    // Wait a moment for the page to start loading
    await page.waitForTimeout(2000);
    
    // Check current URL and page content for debugging
    let currentUrl = page.url();
    console.log('📍 Current URL after submit:', currentUrl);
    
    // Take screenshot for debugging
    await page.screenshot({ path: '/tmp/playwright-debug.png' });
    console.log('📸 Screenshot saved to /tmp/playwright-debug.png');
    
    // Check if we're already at the callback URL
    if (currentUrl.includes('oauth.pstmn.io') && currentUrl.includes('code=')) {
      console.log('✅ Already at callback URL');
    } else if (currentUrl.includes('error')) {
      // Check for error in URL
      const urlObj = new URL(currentUrl);
      const error = urlObj.searchParams.get('error');
      const errorDesc = urlObj.searchParams.get('error_description');
      throw new Error(`OAuth error: ${error} - ${errorDesc}`);
    } else {
      // Wait for redirect to callback URL with authorization code
      console.log('⏳ Waiting for redirect to callback URL...');
      await page.waitForURL(/oauth\.pstmn\.io.*code=/, { timeout: 60000 });
      currentUrl = page.url();
    }
    
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
    
    // Exchange authorization code for token using https module
    const auth = Buffer.from(`${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`).toString('base64');
    const postData = tokenParams.toString();
    
    const tokenData = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'vidal-api.centrastage.net',
        port: 443,
        path: '/auth/oauth/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Basic ${auth}`
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('Token response status:', res.statusCode);
          console.log('Token response headers:', JSON.stringify(res.headers));
          console.log('Token response (first 200 chars):', data.substring(0, 200));
          
          // Handle redirects
          if (res.statusCode === 302 || res.statusCode === 301) {
            console.error('Token endpoint returned redirect to:', res.headers.location);
            console.error('This usually means the authorization code was invalid or already used');
            reject(new Error(`Token exchange failed with redirect: ${res.statusCode} to ${res.headers.location}`));
            return;
          }
          
          if (res.statusCode !== 200) {
            console.error('Token exchange failed. Full response:', data.substring(0, 1000));
            reject(new Error(`Token exchange failed: ${res.statusCode} - ${data.substring(0, 200)}`));
            return;
          }
          
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (parseError) {
            console.error('Failed to parse token response as JSON');
            console.error('Response:', data.substring(0, 500));
            reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Token request error: ${error.message}`));
      });
      
      req.write(postData);
      req.end();
    });
    
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
 * Refresh OAuth token using refresh_token (no browser required)
 */
async function refreshToken() {
  console.log('🔄 Refreshing OAuth token using refresh_token...');
  
  try {
    // Load existing token to get refresh_token
    const tokenData = await fs.readFile(TOKEN_FILE, 'utf8');
    const tokenInfo = JSON.parse(tokenData);
    
    if (!tokenInfo.refresh_token) {
      throw new Error('No refresh_token found. Need to generate new token with Playwright.');
    }
    
    // Use refresh_token to get new access_token
    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenInfo.refresh_token,
      client_id: DATTO_CONFIG.clientId,
    });
    
    const tokenResponse = await fetch(DATTO_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token refresh failed: ${tokenResponse.status} - ${errorText}`);
    }
    
    const newTokenData = await tokenResponse.json();
    
    // Save new token with metadata
    const newTokenInfo = {
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token || tokenInfo.refresh_token, // Keep old refresh_token if not provided
      token_type: newTokenData.token_type,
      expires_in: newTokenData.expires_in,
      obtained_at: Date.now(),
      expires_at: Date.now() + (newTokenData.expires_in * 1000),
    };
    
    await fs.writeFile(TOKEN_FILE, JSON.stringify(newTokenInfo, null, 2));
    
    console.log('✅ Token refreshed successfully!');
    console.log(`   Expires in: ${Math.round(newTokenData.expires_in / 3600)} hours`);
    
    return newTokenInfo;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    throw error;
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
  refreshToken,
  makeAuthenticatedRequest,
};

// CLI usage
if (require.main === module) {
  (async () => {
    try {
      // Try to get existing token first
      let token;
      try {
        token = await getToken();
        console.log('\n✅ Using existing token');
      } catch (error) {
        // Token expired or missing - try to refresh first
        console.log('\n⚠️  Token expired or missing');
        
        try {
          // Try refresh_token first (no browser required)
          console.log('🔄 Attempting to refresh using refresh_token...');
          const tokenInfo = await refreshToken();
          token = tokenInfo.access_token;
          console.log('✅ Token refreshed successfully!');
        } catch (refreshError) {
          // Refresh failed - fall back to Playwright
          console.log('⚠️  Refresh failed, falling back to Playwright...');
          console.log('🔄 Generating new token with browser automation...');
          const tokenInfo = await getNewToken();
          token = tokenInfo.access_token;
        }
      }
      console.log('\n🎉 Token ready for use!');
      console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}
