/**
 * Shared customer-facing email addresses and copy.
 */

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || process.env.SERVICE_SUPPORT_EMAIL || 'support@cloudigan.com';

const NO_REPLY_NOTE =
  'This message was sent from a no-reply address. Please email our help desk instead of replying to this message.';

module.exports = {
  SUPPORT_EMAIL,
  NO_REPLY_NOTE,
};
