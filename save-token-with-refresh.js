#!/usr/bin/env node
/**
 * Save Datto token with refresh_token
 * Use this after getting token from Datto portal or OAuth flow
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
  console.log('\n🔧 Save Datto Token with refresh_token\n');
  console.log('This will save a token that supports automatic renewal.\n');
  
  const accessToken = await question('Enter access_token: ');
  const refreshToken = await question('Enter refresh_token (or press Enter if none): ');
  
  if (!accessToken || accessToken.trim().length === 0) {
    console.error('❌ access_token is required');
    process.exit(1);
  }

  const tokenInfo = {
    access_token: accessToken.trim(),
    refresh_token: refreshToken.trim() || null,
    token_type: 'bearer',
    expires_in: 360000, // 100 hours in seconds
    obtained_at: Date.now(),
    expires_at: Date.now() + (360000 * 1000)
  };

  try {
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
    
    console.log('\n✅ Token saved successfully!');
    console.log(`   File: ${TOKEN_FILE}`);
    console.log(`   Expires: ${new Date(tokenInfo.expires_at).toISOString()}`);
    console.log(`   Has refresh_token: ${!!tokenInfo.refresh_token}`);
    
    if (!tokenInfo.refresh_token) {
      console.log('\n⚠️  WARNING: No refresh_token provided!');
      console.log('   Automatic renewal will NOT work.');
      console.log('   You will need to manually refresh in 100 hours.');
    } else {
      console.log('\n✅ Token has refresh_token - automatic renewal will work!');
    }
    
  } catch (error) {
    console.error('\n❌ Error saving token:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
