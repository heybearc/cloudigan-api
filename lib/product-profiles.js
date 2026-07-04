/**
 * Product profiles — single source for purchase type, admin email fields, and action labels.
 * Extend PROFILES or PRODUCT_ID_OVERRIDES when adding Stripe products.
 */

const SERVICE_KEYWORDS = [
  'technical support',
  'support hour',
  'consulting hour',
  'block of hours',
  'hourly',
];

const CHAPTER_HUB_KEYWORDS = ['bni chapter hub', 'chapter hub'];

/** Stripe product ID → profile id (optional overrides) */
const PRODUCT_ID_OVERRIDES = {};

const PROFILES = {
  rmm: {
    id: 'rmm',
    categoryLabel: 'RMM subscription',
    quantityLabel: 'Devices',
    formatProductLine(productName, quantity) {
      const q = quantity || 1;
      return `${productName} (x${q} device${q === 1 ? '' : 's'})`;
    },
    adminFields: ['product', 'customer', 'company', 'email', 'devices', 'amount', 'dattoSiteUid', 'stripeSession'],
    actionsSectionTitle: 'Automated actions completed',
    actionLabels: {
      datto_site: 'Datto RMM site created',
      download_links: 'Agent download links generated',
      welcome_email: 'Welcome email sent to customer',
      wix_cms: 'Wix CMS record created',
    },
    notApplicableNote: null,
  },
  service: {
    id: 'service',
    categoryLabel: 'Professional services',
    quantityLabel: 'Quantity',
    formatProductLine(productName, quantity) {
      const q = quantity || 1;
      if (q <= 1) return productName;
      return `${productName} (x${q})`;
    },
    adminFields: ['product', 'customer', 'company', 'email', 'quantity', 'amount', 'stripeSession'],
    actionsSectionTitle: 'Processing summary',
    actionLabels: {
      payment_received: 'Stripe payment received and recorded',
      admin_notification: 'Admin notification sent',
      service_confirmation: 'Customer confirmation email sent',
    },
    notApplicableNote: null,
  },
  'chapter-hub': {
    id: 'chapter-hub',
    categoryLabel: 'BNI Chapter Hub subscription',
    quantityLabel: 'Plan',
    formatProductLine(productName) {
      return productName || 'BNI Chapter Hub';
    },
    adminFields: ['product', 'customer', 'company', 'email', 'amount', 'stripeSession'],
    actionsSectionTitle: 'Processing summary',
    actionLabels: {
      payment_received: 'Stripe payment received and recorded',
      chapter_hub_confirmation: 'BNI Chapter Hub welcome email sent to customer',
      admin_notification: 'Admin notification sent',
    },
    notApplicableNote: null,
  },
};

function classifyProduct(productName = '', productId = null) {
  if (productId && PRODUCT_ID_OVERRIDES[productId]) {
    return PRODUCT_ID_OVERRIDES[productId];
  }
  const lower = String(productName).toLowerCase();
  if (CHAPTER_HUB_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return 'chapter-hub';
  }
  if (SERVICE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return 'service';
  }
  return 'rmm';
}

function getProfile(profileId) {
  return PROFILES[profileId] || PROFILES.rmm;
}

function isRmmProfile(profileId) {
  return profileId === 'rmm';
}

/** Human-readable quantity for service products (block vs hourly). */
function formatServiceQuantity(productName = '', quantity = 1) {
  const q = quantity || 1;
  const lower = String(productName).toLowerCase();
  if (lower.includes('hourly')) {
    return `${q} hour${q === 1 ? '' : 's'}`;
  }
  if (lower.includes('block')) {
    return `${q} block${q === 1 ? '' : 's'} of support`;
  }
  if (lower.includes('support hour')) {
    return `${q} support hour${q === 1 ? '' : 's'}`;
  }
  return q === 1 ? '1 item' : `${q} items`;
}

/**
 * Build action list for admin email from webhook processing results.
 * @param {string} profileId
 * @param {object} results — flags from webhook handler
 */
function buildAdminActionSummary(profileId, results) {
  const profile = getProfile(profileId);
  const items = [];

  if (profileId === 'rmm') {
    if (results.dattoSiteCreated) items.push('datto_site');
    if (results.downloadLinksGenerated) items.push('download_links');
    if (results.welcomeEmailSent) items.push('welcome_email');
    if (results.wixCmsCreated) items.push('wix_cms');
  } else {
    items.push('payment_received');
    if (results.chapterHubConfirmationSent) items.push('chapter_hub_confirmation');
    if (results.serviceConfirmationSent) items.push('service_confirmation');
    items.push('admin_notification');
  }

  return items.map((id) => ({
    id,
    label: profile.actionLabels[id] || id,
  }));
}

function isChapterHubStripeMetadata(metadata = {}) {
  return Boolean(metadata.user_id && metadata.plan_tier);
}

function isBusinessProductName(productName = '') {
  const lower = String(productName).toLowerCase();
  return (
    lower.includes('business') ||
    lower.includes('complete package') ||
    lower.includes('essentials')
  );
}

module.exports = {
  SERVICE_KEYWORDS,
  CHAPTER_HUB_KEYWORDS,
  PROFILES,
  PRODUCT_ID_OVERRIDES,
  classifyProduct,
  getProfile,
  isRmmProfile,
  buildAdminActionSummary,
  formatServiceQuantity,
  isChapterHubStripeMetadata,
  isBusinessProductName,
};
