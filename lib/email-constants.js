/**
 * Shared customer-facing email addresses and copy.
 */

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || process.env.SERVICE_SUPPORT_EMAIL || 'support@cloudigan.com';

const CHAPTER_HUB_APP_URL = process.env.CHAPTER_HUB_APP_URL || 'https://bnitoolkit.cloudigan.net';

const NO_REPLY_NOTE =
  'This message was sent from a no-reply address. Please contact our help desk rather than replying to this email.';

module.exports = {
  SUPPORT_EMAIL,
  CHAPTER_HUB_APP_URL,
  NO_REPLY_NOTE,
};
