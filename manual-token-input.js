#!/usr/bin/env node
/**
 * Manual token input utility
 * Use this when Playwright automation fails
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const TOKEN_FILE = path.join(__dirname, '.datto-token.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔧 Manual Datto OAuth Token Input\n');
  console.log('Follow these steps to get a token:');
  console.log('1. Go to: https://vidal-api.centrastage.net/auth/oauth/authorize?client_id=public-client&redirect_uri=https://oauth.pstmn.io/v1/callback&response_type=code&scope=default');
  console.log('2. Log in with your Datto API credentials');
  console.log('3. After redirect, copy the "code" parameter from the URL');
  console.log('4. Paste it below\n');
  
  const authCode = await question('Enter authorization code: ');
  
  if (!authCode || authCode.trim().length === 0) {
    console.error('❌ No authorization code provided');
    process.exit(1);
  }
  
  console.log('\n🔄 Exchanging code for token...');
  
  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode.trim(),
      redirect_uri: 'https://oauth.pstmn.io/v1/callback',
      client_id: 'public-client',
    });
    
    const tokenResponse = await fetch('https://vidal-api.centrastage.net/auth/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
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
    
    console.log('\n✅ Token saved successfully!');
    console.log(`   Expires in: ${Math.round(tokenData.expires_in / 3600)} hours`);
    console.log(`   Has refresh_token: ${!!tokenData.refresh_token}`);
    console.log(`\n📁 Token saved to: ${TOKEN_FILE}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
