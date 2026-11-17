/**
 * Stripe product catalog for Cloudigan API.
 * Maps live Stripe product IDs → profile + email copy hints.
 * Keep in sync with Dashboard products; prefer ID overrides over name keywords.
 */

/** @typedef {'rmm' | 'service' | 'chapter-hub' | 'hosting'} ProfileId */

/**
 * @type {Record<string, {
 *   profileId: ProfileId,
 *   name: string,
 *   description?: string,
 *   nextSteps?: string,
 * }>}
 */
const PRODUCT_CATALOG = {
  // RMM / managed device plans
  prod_U4jozRCw1TiL5x: {
    profileId: 'rmm',
    name: 'Personal',
    description:
      'Automated security coverage for 1 personal computer. Includes automated system patching, antivirus protection, and remote monitoring.',
  },
  prod_U56pe5Nv5JX5w3: {
    profileId: 'rmm',
    name: 'Family',
    description:
      'Automated security coverage for up to 3 personal computers with patching, antivirus, and remote monitoring.',
  },
  prod_U56yWwBFfVO6C7: {
    profileId: 'rmm',
    name: 'Family Plus',
    description:
      'Automated security coverage for up to 5 personal devices with patching, antivirus, and remote monitoring.',
  },
  prod_U4jQbfzDb0HSLn: {
    profileId: 'rmm',
    name: 'Essentials Package',
    description:
      'Flat-rate IT coverage for small businesses: monitoring, security, managed updates, and helpdesk hours.',
  },
  prod_U4jV558THixvm0: {
    profileId: 'rmm',
    name: 'Complete Package',
    description:
      'Comprehensive IT management for growing businesses with stronger protection and faster support.',
  },
  prod_U4jY8ME9ADgSCy: {
    profileId: 'rmm',
    name: 'Secure+ Package',
    description:
      'Premium IT management with elevated security, compliance readiness, and strategic IT oversight.',
  },

  // Hosting (no Datto / no RMM welcome)
  prod_VBivzzY2t1mYuR: {
    profileId: 'hosting',
    name: 'Windows Server Hosting - Internal',
    description:
      'Internal Windows Server hosting service providing secure, managed Windows-based infrastructure for approved business applications, services, and workloads.',
    nextSteps:
      'Our team will provision or confirm your hosted Windows Server environment and reach out within one business day with access details and next steps.',
  },

  // Chapter Hub
  prod_Ub03vF0PSBQqBy: {
    profileId: 'chapter-hub',
    name: 'Chapter Hub - Small Chapter',
    description: 'BNI chapter subscription for 1-20 members.',
  },
  prod_Ub03rGUm2XanMV: {
    profileId: 'chapter-hub',
    name: 'Chapter Hub - Medium Chapter',
    description: 'BNI chapter subscription for 21-35 members.',
  },
  prod_Ub03tdYDEQE4ho: {
    profileId: 'chapter-hub',
    name: 'Chapter Hub - Large Chapter',
    description: 'BNI chapter subscription for 36-50 members.',
  },
  prod_Ub035NKNZvo0Rw: {
    profileId: 'chapter-hub',
    name: 'Chapter Hub - XL Chapter',
    description: 'BNI chapter subscription for 51+ members.',
  },

  // Professional services / training / add-ons (no Datto)
  prod_UWS4AXaaRStoYK: {
    profileId: 'service',
    name: 'Technical Support - Hourly',
    description: 'Technical support by the hour.',
    nextSteps:
      'If you have not already coordinated your support hours with our team, a member of our team will reach out within one business day to schedule time and answer questions about how to use your hours.',
  },
  prod_U52kZUyYj3Ezao: {
    profileId: 'service',
    name: 'Technical Support - Block of Hours',
    description:
      'Technical support for configuration, deep troubleshooting, or special projects outside monthly package coverage.',
    nextSteps:
      'If you have not already coordinated your support hours with our team, a member of our team will reach out within one business day to schedule time and answer questions about how to use your hours.',
  },
  prod_U4jY8ME9ADgSCy_PLACEHOLDER: undefined, // keep catalog keys intentional only
  prod_U4jbWzBYQomMvi: {
    profileId: 'service',
    name: 'Intro Session',
    description:
      '30-minute guided preview of our Computer Confidence Program.',
    nextSteps:
      'We will confirm your class time and send any prep details within one business day if they are not already in your confirmation.',
  },
  prod_U4jezdnwOqJh6Q: {
    profileId: 'service',
    name: '1-on-1 Computer Basics Class',
    description: 'Private 60-minute Computer Basics class session.',
    nextSteps:
      'We will confirm scheduling and class materials within one business day if not already arranged.',
  },
  prod_U4jiwIqWccDi12: {
    profileId: 'service',
    name: 'Group Computer Basics Class',
    description: 'Private small-group Computer Basics class (you invite up to three people).',
    nextSteps:
      'We will confirm scheduling and class materials within one business day if not already arranged.',
  },
  prod_U54UudcfrDp6yw: {
    profileId: 'service',
    name: 'Group Computer Basics Class (Package of 4 Classes)',
    description: 'Package of 4 small-group Computer Basics classes.',
    nextSteps:
      'We will confirm scheduling for your package within one business day if not already arranged.',
  },
  prod_U54YrfWQULrxkH: {
    profileId: 'service',
    name: '1-on-1 Computer Basics Class (Package of 4 Classes)',
    description: 'Package of 4 private 60-minute Computer Basics classes.',
    nextSteps:
      'We will confirm scheduling for your package within one business day if not already arranged.',
  },
  prod_U53vubWB6zyFwL: {
    profileId: 'service',
    name: 'Phishing Simulation',
    description:
      'Simulated phishing campaigns to test and improve your team’s ability to recognize email threats.',
    nextSteps:
      'Our team will reach out within one business day to confirm campaign timing and recipients.',
  },
  prod_U53iZ3xbS1yZHE: {
    profileId: 'service',
    name: 'Dark Web Monitoring',
    description:
      'Continuous monitoring of breach databases for exposed business email credentials.',
    nextSteps:
      'Our team will confirm setup details and alerting contacts within one business day.',
  },
  prod_U53G9c8Mg5jWCo: {
    profileId: 'service',
    name: 'Advanced Email Security',
    description:
      'Advanced email threat protection that works with your existing mail platform.',
    nextSteps:
      'Our team will reach out within one business day to coordinate mail-platform setup.',
  },
  prod_U52uxDatzEZauT: {
    profileId: 'service',
    name: 'Password Manager Set-up (Up to 5 users)',
    description:
      'Professional setup and guided onboarding for a business password manager for up to five users.',
    nextSteps:
      'Our team will reach out within one business day to schedule configuration and training.',
  },
  prod_U537zYiJjYvsgu: {
    profileId: 'service',
    name: 'Password Set-up: Additional User',
    description: 'Additional password manager user setup.',
    nextSteps:
      'Our team will reach out within one business day to add the additional user.',
  },
};

// Remove accidental placeholder if present
delete PRODUCT_CATALOG.prod_U4jY8ME9ADgSCy_PLACEHOLDER;

const HOSTING_KEYWORDS = ['server hosting', 'windows server hosting', 'hosting - internal'];

const TRAINING_KEYWORDS = [
  'computer basics',
  'intro session',
  'demo class',
  'phishing simulation',
  'dark web monitoring',
  'advanced email security',
  'password manager',
  'password set-up',
  'password setup',
];

/**
 * @param {string | null | undefined} productId
 * @param {string} [productName]
 * @param {string} [productDescription]
 */
function resolveCatalogEntry(productId, productName = '', productDescription = '') {
  if (productId && PRODUCT_CATALOG[productId]) {
    return { ...PRODUCT_CATALOG[productId], productId };
  }

  const lower = String(productName).toLowerCase();
  if (HOSTING_KEYWORDS.some((k) => lower.includes(k))) {
    return {
      profileId: 'hosting',
      name: productName || 'Server hosting',
      description: productDescription || undefined,
      nextSteps:
        'Our team will provision or confirm your hosted environment and reach out within one business day with access details and next steps.',
      productId: productId || null,
    };
  }

  return null;
}

module.exports = {
  PRODUCT_CATALOG,
  HOSTING_KEYWORDS,
  TRAINING_KEYWORDS,
  resolveCatalogEntry,
};
