#!/usr/bin/env node
/**
 * Manually process failed customer signup
 * Usage: node manual-process-signup.js <session_id>
 */

require('dotenv').config();
const { makeAuthenticatedRequest } = require('./datto-auth');
const { sendWelcomeEmail } = require('./m365-email');

async function processSignup(customerData) {
  console.log('\n🔄 Processing signup for:', customerData.customerName);
  console.log('   Email:', customerData.customerEmail);
  
  try {
    // 1. Create Datto RMM site
    console.log('\n📡 Creating Datto RMM site...');
    const siteResponse = await makeAuthenticatedRequest('/api/v2/site', {
      method: 'PUT',
      body: JSON.stringify({
        name: customerData.customerName,
        description: `Cloudigan customer - ${customerData.customerEmail}`,
      }),
    });
    
    const siteUid = siteResponse.uid;
    const siteId = siteResponse.id;
    
    console.log('✅ Datto site created!');
    console.log('   Site UID:', siteUid);
    console.log('   Site ID:', siteId);
    
    // 2. Generate download links
    const downloadLinks = {
      windows: `https://vidal.rmm.datto.com/download-agent/windows/${siteUid}`,
      mac: `https://vidal.rmm.datto.com/download-agent/mac/${siteUid}`,
      linux: `https://vidal.rmm.datto.com/download-agent/linux/${siteUid}`,
    };
    
    console.log('\n📥 Download links generated:');
    console.log('   Windows:', downloadLinks.windows);
    console.log('   Mac:', downloadLinks.mac);
    console.log('   Linux:', downloadLinks.linux);
    
    // 3. Send welcome email
    console.log('\n📧 Sending welcome email...');
    await sendWelcomeEmail({
      customerEmail: customerData.customerEmail,
      customerName: customerData.customerName,
      companyName: customerData.companyName || '',
      isBusinessProduct: customerData.isBusinessProduct || false,
      deviceQuantity: customerData.deviceQuantity || 1,
      downloadLinks: downloadLinks,
    });
    
    console.log('✅ Welcome email sent!');
    
    console.log('\n🎉 Signup processed successfully!');
    console.log('   Customer:', customerData.customerName);
    console.log('   Email:', customerData.customerEmail);
    console.log('   Datto Site:', siteUid);
    
    return {
      success: true,
      siteUid,
      siteId,
      downloadLinks,
    };
    
  } catch (error) {
    console.error('\n❌ Error processing signup:', error.message);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const customerData = {
    customerName: 'Amber M Williams',
    customerEmail: 'amberwillms@gmail.com',
    companyName: '',
    isBusinessProduct: false,
    deviceQuantity: 1,
    sessionId: 'cs_live_a1o01plUIw1sQJsfGjXuyWvJLzcFWRiu07Nx6PJBHEmdi2P6cYOHtpRmOx',
  };
  
  processSignup(customerData)
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { processSignup };
