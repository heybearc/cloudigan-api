# Datto RMM API Authentication Issue

## Summary
Unable to authenticate with Datto RMM API v2 despite having API access enabled and valid API keys generated.

## Account Information
- **API URL**: `https://vidal-api.centrastage.net`
- **Platform**: Vidal
- **API Key**: `BCE6247DP69R8OBFHVE37EMET4IH6325`
- **API Secret Key**: `C9CEDEUVO476DF9IKAP3MK33I0QBUCAV`
- **User**: cloudy-api

## Configuration Verified
✅ API Access enabled in Setup > Global Settings > Access Control
✅ API Keys generated for user "cloudy-api"
✅ User account is active
✅ API keys are properly formatted (32-character alphanumeric)

## Problem
When attempting to authenticate using OAuth 2.0 as documented, the `/auth/oauth/token` endpoint returns an HTML login page instead of an OAuth access token.

## Authentication Methods Tried

### 1. OAuth 2.0 Password Grant
```bash
POST https://vidal-api.centrastage.net/auth/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=BCE6247DP69R8OBFHVE37EMET4IH6325&password=C9CEDEUVO476DF9IKAP3MK33I0QBUCAV
```
**Result**: 401 Unauthorized, returns HTML login page

### 2. OAuth 2.0 Client Credentials Grant
```bash
POST https://vidal-api.centrastage.net/auth/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&username=BCE6247DP69R8OBFHVE37EMET4IH6325&password=C9CEDEUVO476DF9IKAP3MK33I0QBUCAV
```
**Result**: 401 Unauthorized, returns HTML login page

### 3. OAuth 2.0 with Basic Authentication
```bash
POST https://vidal-api.centrastage.net/auth/oauth/token
Authorization: Basic QkNFNjI0N0RQNjlSOE9CRkhWRTM3RU1FVDRJSDY...
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```
**Result**: 401 Unauthorized, returns HTML login page

### 4. Direct API Call with Basic Auth
```bash
GET https://vidal-api.centrastage.net/api/v2/account
Authorization: Basic QkNFNjI0N0RQNjlSOE9CRkhWRTM3RU1FVDRJSDY...
```
**Result**: 401 Unauthorized

## What Works
✅ `GET /api/v2/system/status` - Works without authentication (as documented)
✅ Swagger UI loads at `https://vidal-api.centrastage.net/api/swagger-ui/index.html`

## What Doesn't Work
❌ All OAuth token requests return HTML login page
❌ All authenticated API calls return 401
❌ Swagger UI shows lock icon but has no authentication configuration

## Questions for Datto Support

1. **How do I properly authenticate with the API using my API keys?**
   - What is the correct OAuth endpoint and parameters?
   - Should I use a different authentication method?

2. **Are my API keys active and valid?**
   - Can you verify API Key `BCE6247DP69R8OBFHVE37EMET4IH6325` is active?

3. **Is there additional configuration needed?**
   - Are there account-level settings beyond "Enable API Access"?
   - Does the user need specific permissions or roles?

4. **Can you provide a working authentication example?**
   - Preferably in curl or Node.js/JavaScript

## Use Case
Integrating Stripe checkout with Datto RMM to automatically:
1. Create sites when customers subscribe
2. Retrieve agent download links
3. Provide links to customers on confirmation page

## Technical Details
- Testing with: Node.js, axios, Postman
- All requests follow OAuth 2.0 RFC 6749 standard
- OpenAPI spec at `/api/v3/api-docs/Datto-RMM` shows no security definitions

## Request
Please provide the correct authentication method or verify why the current API keys are not working.

---
**Contact**: Cloudigan IT
**Date**: March 16, 2026
