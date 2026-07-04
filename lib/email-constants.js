/**
 * Shared customer-facing email addresses and copy.
 */

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || process.env.SERVICE_SUPPORT_EMAIL || 'support@cloudigan.com';

const BNI_CHAPTER_HUB_NAME = 'BNI Chapter Hub';

const CHAPTER_HUB_APP_URL = process.env.CHAPTER_HUB_APP_URL || 'https://hub.cloudigan.net';

const STRIPE_CUSTOMER_PORTAL_URL =
  process.env.STRIPE_CUSTOMER_PORTAL_URL ||
  'https://pay.cloudigan.com/p/login/eVq4gz6nrgSW1Kh6e9gnK00';

const NO_REPLY_NOTE =
  'This message was sent from a no-reply address. Please contact our help desk rather than replying to this email.';

module.exports = {
  SUPPORT_EMAIL,
  BNI_CHAPTER_HUB_NAME,
  CHAPTER_HUB_APP_URL,
  STRIPE_CUSTOMER_PORTAL_URL,
  NO_REPLY_NOTE,
};
