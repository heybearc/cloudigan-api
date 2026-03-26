#!/usr/bin/env node
/**
 * Update Datto token from Postman
 * Simple script to save a new token obtained from Postman
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
  console.log('\n📋 Update Datto Token from Postman\n');
  console.log('Instructions:');
  console.log('1. In Postman, get a new token (Authorization tab → Get New Access Token)');
  console.log('2. Copy the Access Token from Postman');
  console.log('3. Paste it below\n');
  
  const accessToken = await question('Paste Access Token from Postman: ');
  
  if (!accessToken || accessToken.trim().length === 0) {
    console.error('❌ Access token is required');
    rl.close();
    process.exit(1);
  }

  // Datto tokens expire in 100 hours (360000 seconds)
  const expiresIn = 360000;
  const obtainedAt = Date.now();
  const expiresAt = obtainedAt + (expiresIn * 1000);

  const tokenInfo = {
    access_token: accessToken.trim(),
    token_type: 'bearer',
    expires_in: expiresIn,
    obtained_at: obtainedAt,
    expires_at: expiresAt
  };

  try {
    // Backup old token
    try {
      const oldToken = await fs.readFile(TOKEN_FILE, 'utf8');
      await fs.writeFile(`${TOKEN_FILE}.backup`, oldToken);
      console.log('✅ Old token backed up to .datto-token.json.backup');
    } catch (error) {
      // No old token to backup
    }

    // Save new token
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
    
    const hoursRemaining = expiresIn / 3600;
    
    console.log('\n✅ Token saved successfully!');
    console.log(`   File: ${TOKEN_FILE}`);
    console.log(`   Obtained: ${new Date(obtainedAt).toISOString()}`);
    console.log(`   Expires: ${new Date(expiresAt).toISOString()}`);
    console.log(`   Valid for: ${hoursRemaining} hours (${Math.floor(hoursRemaining / 24)} days)`);
    console.log('\n📧 You will receive email alerts:');
    console.log('   - Warning at 24 hours before expiration');
    console.log('   - Critical alert when token expires');
    console.log('\n🔄 Next manual refresh needed: ~4 days from now');
    
  } catch (error) {
    console.error('\n❌ Error saving token:', error.message);
    rl.close();
    process.exit(1);
  }
  
  rl.close();
}

main();
