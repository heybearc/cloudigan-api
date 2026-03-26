# How to Get the Authorization Code (No Postman Needed)

## The Redirect Behavior Explained

When you visit the OAuth URL, it redirects to Postman's callback URL. **You don't need Postman installed** - the authorization code is in the URL itself.

---

## Step-by-Step Instructions

### 1. Open this URL in your browser:

```
https://vidal-api.centrastage.net/auth/oauth/authorize?client_id=public-client&redirect_uri=https://oauth.pstmn.io/v1/callback&response_type=code&scope=default
```

### 2. Log in with API credentials:

- **Username:** `BCE6247DP69R8OBFHVE37EMET4IH6325`
- **Password:** `C9CEDEUVO476DF9IKAP3MK33I0QBUCAV`

### 3. After login, you'll be redirected to a URL that looks like:

```
https://oauth.pstmn.io/v1/callback?code=ABC123XYZ456DEF789
```

### 4. Copy ONLY the code part:

**Example:**
- Full URL: `https://oauth.pstmn.io/v1/callback?code=SjQxT3pVYWtLaWlCVU5lMHRTRnZSUjFXSlk`
- **Code to copy:** `SjQxT3pVYWtLaWlCVU5lMHRTRnZSUjFXSlk`

The code is everything after `?code=` in the URL bar.

---

## What to Do with the Code

Once you have the code, run this on the server:

```bash
ssh pve
pct enter 181
cd /opt/cloudigan-api
node manual-token-input.js
```

When prompted, paste the code you copied.

---

## Alternative: Skip the Browser Entirely

If the redirect is confusing, you can also get the code using curl:

```bash
# This will show you the redirect URL with the code
curl -v "https://vidal-api.centrastage.net/auth/oauth/authorize?client_id=public-client&redirect_uri=https://oauth.pstmn.io/v1/callback&response_type=code&scope=default" \
  -u "BCE6247DP69R8OBFHVE37EMET4IH6325:C9CEDEUVO476DF9IKAP3MK33I0QBUCAV" \
  2>&1 | grep -i location
```

The code will be in the `Location:` header.

---

## Troubleshooting

**Q: The page says "Postman not installed"**
- **A:** That's fine! Just look at the URL bar - the code is there.

**Q: The page is blank or shows an error**
- **A:** Ignore the page content. The code is in the URL bar at the top of your browser.

**Q: I don't see a code in the URL**
- **A:** Make sure you completed the login. The URL should change from `vidal-api.centrastage.net` to `oauth.pstmn.io` with `?code=` in it.

---

## Quick Reference

1. Visit OAuth URL → Log in
2. Look at URL bar (not page content)
3. Copy everything after `?code=`
4. Run `node manual-token-input.js` on server
5. Paste code when prompted
6. Done! Token with refresh_token is saved
