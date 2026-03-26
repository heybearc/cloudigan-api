#!/usr/bin/env node
/**
 * Test Playwright OAuth automation
 */

require('dotenv').config();
const { getNewToken } = require('./datto-auth');

async function test() {
  console.log('Testing Playwright OAuth automation...\n');
  
  try {
    const tokenInfo = await getNewToken();
    console.log('\n✅ SUCCESS!');
    console.log('Token obtained:', tokenInfo.access_token.substring(0, 50) + '...');
    console.log('Expires in:', Math.round(tokenInfo.expires_in / 3600), 'hours');
    console.log('Has refresh_token:', !!tokenInfo.refresh_token);
  } catch (error) {
    console.error('\n❌ FAILED!');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

test();
