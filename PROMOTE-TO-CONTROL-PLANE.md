# Promote to Control Plane

This file is used by `/sync-governance` workflow to promote discoveries to the control plane.

---

## Decision: Product Type Detection Pattern for Webhook Handlers

**Type:** Decision  
**Date:** 2026-04-17  
**App:** cloudigan-api  
**Status:** Implemented and Deployed

### Context
Customer purchased technical support hours via Stripe payment link. The webhook incorrectly created a Datto RMM site and sent welcome email with download links. This was inappropriate for a standalone service product that doesn't include RMM monitoring.

### Problem
Webhook handler treated all Stripe purchases identically:
- Always created Datto RMM site
- Always sent welcome email with download links
- Always inserted into Wix CMS

No distinction between:
- **RMM products** (Home Protect, Business packages) - need Datto site
- **Service products** (Technical Support hours) - no Datto site needed

### Decision
Implement dynamic product type detection based on Stripe product names:

**Detection Logic:**
```javascript
// Service products - keywords in product name
const isStandaloneService = productName.includes('technical support') ||
                           productName.includes('support hour') ||
                           productName.includes('consulting hour');

// RMM products - everything else (default)
const isRmmProduct = !isStandaloneService;
```

**Routing:**
- **RMM Products** → Create Datto site + Send welcome email + Insert Wix CMS
- **Service Products** → Skip Datto + Skip email + Admin notification only

### Benefits
1. **Fully Dynamic** - No code changes needed for new products
2. **Keyword-Based** - Simple naming convention determines behavior
3. **Flexible** - Easy to add new product categories
4. **Maintainable** - Product behavior controlled by product naming

### Implementation
- Modified `webhook-handler.js` to detect product type from Stripe session
- Added `isRmmProduct` and `isStandaloneService` flags to customerData
- Conditional Datto site creation based on product type
- Conditional email sending based on product type
- Conditional Wix CMS insert based on product type
- Enhanced logging to track product type routing

### Pattern for Other Apps
This pattern applies to any webhook handler that needs to route different product types differently:

1. **Extract product metadata** from payment provider (Stripe, etc.)
2. **Classify product type** using keywords or product IDs
3. **Route actions conditionally** based on product type
4. **Log classification** for debugging and monitoring
5. **Keep detection dynamic** - avoid hardcoded product IDs

**Example Use Cases:**
- E-commerce: Physical products vs digital downloads vs services
- SaaS: Different tiers requiring different onboarding flows
- Subscriptions: Trial vs paid vs enterprise requiring different setup

### Lessons Learned
- **Default behavior matters** - Choose the safest default (RMM products in our case)
- **Logging is critical** - Log product type classification for every purchase
- **Test edge cases** - What happens with misspelled product names?
- **Admin notifications** - Always notify admin regardless of product type

### Related Files
- `webhook-handler.js` - Product type detection implementation
- `TASK-STATE.md` - Documentation of integration flow
- Commit: 9aafc98 - "feat: add product type detection for RMM vs standalone service products"

### Recommendation for Control Plane
Add this pattern to webhook handler best practices:
- Document product type detection pattern
- Provide template for keyword-based routing
- Include logging and monitoring guidance
- Add to webhook handler checklist

---

