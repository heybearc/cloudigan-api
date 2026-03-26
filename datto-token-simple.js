#!/usr/bin/env node
/**
 * Simple Datto API v2 token acquisition using Basic Auth
 * Based on: https://rmm.datto.com/help/en/Content/2SETUP/APIv2.htm
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.datto-token.json');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL || 'https://vidal-api.centrastage.net',
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function getTokenSimple() {
  console.log('🔑 Requesting access token with Basic Auth...');
  
  // Create Basic Auth header
  const credentials = Buffer.from(`${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`).toString('base64');
  
  try {
    const response = await fetch(`${DATTO_CONFIG.apiUrl}/auth/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: DATTO_CONFIG.apiKey,
        password: DATTO_CONFIG.apiSecretKey,
      }).toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed: ${response.status} - ${errorText}`);
    }
    
    const tokenData = await response.json();
    
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
    console.log(`   Has refresh_token: ${!!tokenData.refresh_token}`);
    
    return tokenInfo;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  (async () => {
    try {
      await getTokenSimple();
      console.log('\n🎉 Token ready for use!');
    } catch (error) {
      console.error('❌ Failed to get token');
      process.exit(1);
    }
  })();
}

module.exports = { getTokenSimple };
