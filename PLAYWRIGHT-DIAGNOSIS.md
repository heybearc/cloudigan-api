# Playwright OAuth Automation - Diagnosis Report

## Summary

Playwright successfully automates the OAuth login flow and retrieves authorization codes, but **token exchange consistently fails** with 302 redirects to the login page.

## What Works ✅

1. **OAuth Authorization Flow**
   - Playwright navigates to Datto OAuth page
   - Successfully fills in API key/secret credentials
   - Submits login form
   - Captures authorization code from redirect URL
   - Authorization codes are valid format (e.g., `V2a99P`, `hafGml`, `X5nsWM`)

2. **Code Interception**
   - Successfully intercepts redirect before Postman consumes the code
   - Stops page navigation to preserve authorization code
   - Extracts code from URL parameters

## What Fails ❌

**Token Exchange Endpoint**: `POST https://vidal-api.centrastage.net/auth/oauth/token`

### Consistent Error Pattern

```
Token response status: 302
Location: https://vidal-api.centrastage.net/auth/userlogin
www-authenticate: Basic realm="oauth2/client"
```

### Attempts Made

1. **No Authentication** → 401 Unauthorized
2. **Basic Auth with API key:secret** → 302 Redirect
3. **Basic Auth with client_id:secret** → 302 Redirect  
4. **client_secret in POST body** → 302 Redirect
5. **client_id in POST body + Basic Auth** → 302 Redirect
6. **Intercepting code before Postman** → 302 Redirect

### POST Body Tested

```
grant_type=authorization_code
code=<auth_code>
redirect_uri=https://oauth.pstmn.io/v1/callback
client_id=public-client
```

### Authentication Headers Tested

```
Authorization: Basic <base64(API_KEY:API_SECRET)>
Authorization: Basic <base64(client_id:API_SECRET)>
```

## Root Cause Analysis

The 302 redirect with `www-authenticate: Basic realm="oauth2/client"` indicates:

1. **Authentication is failing** - Datto's token endpoint doesn't accept our credentials
2. **Authorization codes are valid** - The codes are correctly formatted and captured
3. **OAuth flow mismatch** - There may be a mismatch between how Postman authenticates vs our implementation

## Why Postman Works

Postman likely has special handling for Datto's OAuth implementation:
- May use different authentication method
- May have pre-configured OAuth client credentials
- May handle the token exchange differently

## Conclusion

**Playwright automation is NOT viable for Datto OAuth token renewal** due to:
- Inability to successfully exchange authorization codes for tokens
- Datto's token endpoint authentication requirements are unclear
- No documentation on proper authentication method

## Recommendation

**Continue with the existing manual workflow:**

1. **Every 4 days**: Get token in Postman (2 minutes)
2. **Run**: `node update-token-from-postman.js`
3. **Paste** token
4. **Done**

**Automated monitoring ensures you never miss expiration:**
- Hourly token expiration checks
- Email alerts at 24h warning
- Prometheus metrics
- Grafana dashboard

This is the most reliable solution given Datto's API limitations.
