/**
 * Debug script to see the actual token response
 */

require('dotenv').config();
const axios = require('axios');

const DATTO_CONFIG = {
  apiUrl: process.env.DATTO_API_URL,
  apiKey: process.env.DATTO_API_KEY,
  apiSecretKey: process.env.DATTO_API_SECRET_KEY,
};

async function debugToken() {
  console.log('Requesting OAuth token...\n');
  
  const credentials = Buffer.from(
    `${DATTO_CONFIG.apiKey}:${DATTO_CONFIG.apiSecretKey}`
  ).toString('base64');

  try {
    const response = await axios.post(
      `${DATTO_CONFIG.apiUrl}/auth/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('Full response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\nToken value:');
    console.log(response.data.access_token || 'NOT FOUND');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

debugToken();
