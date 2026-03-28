#!/usr/bin/env node
/**
 * Get Amber Williams' purchase information
 */

require('dotenv').config();
const { makeAuthenticatedRequest } = require('./datto-auth');

const siteUid = '1f47a27a-1a8b-4c08-962d-59d5aed58178';

makeAuthenticatedRequest(`/api/v2/site/${siteUid}`)
  .then(data => {
    console.log('\n=== AMBER WILLIAMS DATTO SITE ===\n');
    console.log('Site UID:', data.uid);
    console.log('Site Name:', data.name);
    console.log('Description:', data.description);
    console.log('Notes:', data.notes);
    
    // Extract email from description
    const emailMatch = data.description.match(/Customer: (.+)/);
    const email = emailMatch ? emailMatch[1] : 'ambera1027@gmail.com';
    
    console.log('\n=== DATA FOR WIX CMS ===\n');
    console.log(JSON.stringify({
      siteUid: data.uid,
      customerEmail: email,
      customerName: data.name,
      siteId: data.id
    }, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
