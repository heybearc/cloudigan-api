#!/usr/bin/env node
/**
 * Check Datto site details for Wendy Ellis
 */

require('dotenv').config();
const { makeAuthenticatedRequest } = require('./datto-auth');

const siteUid = '18683ccb-2b46-4eab-a223-1ab1ff70b13b';

makeAuthenticatedRequest(`/api/v2/site/${siteUid}`)
  .then(data => {
    console.log('\n=== DATTO SITE DETAILS ===\n');
    console.log('Site UID:', data.uid);
    console.log('Site Name:', data.name);
    console.log('Description:', data.description);
    console.log('Notes:', data.notes);
    console.log('\n=== RAW DATA ===\n');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Error retrieving site:', err.message);
    process.exit(1);
  });
