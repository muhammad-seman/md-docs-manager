# GitHub OAuth Setup Guide

## ⚠️ PENTING: Keamanan OAuth

OAuth flow yang **AMAN** memerlukan backend server untuk:
1. **Menyimpan Client Secret** secara rahasia
2. **Exchange authorization code** untuk access token
3. **Validasi state parameter** untuk CSRF protection

**Client-side OAuth (tanpa backend) TIDAK AMAN** karena Client Secret akan terekspos.

---

## Pilihan Login

Aplikasi ini menyediakan **2 opsi login**:

### Option 1: Personal Access Token (Recommended untuk development)
✅ **Paling simple dan aman untuk personal/small team**
- Tidak perlu setup OAuth App
- Token tersimpan di localStorage browser
- Setiap user buat token sendiri

**Kelebihan:**
- Setup cepat (< 2 menit)
- Tidak perlu backend
- Full control per user

**Kekurangan:**
- User harus manual buat token
- Token tidak auto-refresh

### Option 2: GitHub OAuth App (Recommended untuk production)
✅ **Untuk aplikasi production dengan banyak user**
- User login dengan akun GitHub
- Token management otomatis
- Better UX (no manual token)

**Kelebihan:**
- User experience lebih baik
- Token auto-refresh
- Centralized access control

**Kekurangan:**
- **BUTUH BACKEND SERVER** untuk keamanan
- Setup lebih kompleks

---

## Setup Option 1: Personal Access Token (Simple)

### Step 1: User buat token di GitHub

1. Buka: https://github.com/settings/tokens
2. Klik **"Generate new token (classic)"**
3. Token settings:
   - **Note**: `MD Docs Manager`
   - **Expiration**: 90 days (atau custom)
   - **Scopes**: ✓ `repo` (full control of private repositories)
4. Klik **"Generate token"**
5. **COPY TOKEN** - hanya muncul sekali!

### Step 2: Login di aplikasi

1. Buka web app
2. Klik **"🔑 Use Token"**
3. Paste token
4. Done! ✅

### Keamanan:
- ✅ Token tersimpan di localStorage (hanya di browser user)
- ✅ Token tidak terkirim ke server manapun
- ✅ Setiap user control token sendiri
- ✅ Bisa revoke kapan saja di GitHub settings

---

## Setup Option 2: GitHub OAuth App (Advanced)

⚠️ **Memerlukan backend server!**

### Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Browser   │──────▶│ GitHub OAuth │──────▶│   Backend   │
│  (Frontend) │◀──────│   Endpoint   │◀──────│   Proxy     │
└─────────────┘       └──────────────┘       └─────────────┘
      │                                              │
      └──────────────────────────────────────────────┘
              Access Token (secure exchange)
```

### Step 1: Buat GitHub OAuth App

1. Buka: https://github.com/settings/developers
2. Klik **"New OAuth App"**
3. Fill settings:
   ```
   Application name: MD Docs Manager
   Homepage URL: https://muhammad-seman.github.io/md-docs-manager/
   Authorization callback URL: https://your-backend.com/auth/github/callback
   ```
4. Klik **"Register application"**
5. **COPY**:
   - Client ID (public)
   - Client Secret (RAHASIA!)

### Step 2: Setup Backend Proxy

Anda memerlukan backend untuk exchange code → token.

#### Example: Node.js Express Backend

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'https://muhammad-seman.github.io'
}));

// Environment variables (JANGAN commit ke git!)
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// OAuth callback endpoint
app.get('/auth/github/callback', async (req, res) => {
    const { code, state } = req.query;
    
    try {
        // Exchange code for token
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code
        }, {
            headers: { Accept: 'application/json' }
        });
        
        const { access_token } = response.data;
        
        // Redirect back to frontend with token
        res.redirect(`https://muhammad-seman.github.io/md-docs-manager/?token=${access_token}&state=${state}`);
    } catch (error) {
        res.redirect('https://muhammad-seman.github.io/md-docs-manager/?error=auth_failed');
    }
});

app.listen(3000, () => console.log('OAuth proxy running on port 3000'));
```

#### Deployment Options:
- **Vercel** (Serverless Functions)
- **Netlify** (Functions)
- **Heroku** (Free tier)
- **Railway** (Free tier)
- **AWS Lambda** (Serverless)

### Step 3: Update Frontend Config

Edit `app.js`:

```javascript
const OAUTH_CONFIG = {
    clientId: 'your_actual_client_id_here',
    redirectUri: 'https://your-backend.com/auth/github/callback',
    scope: 'repo',
    authEndpoint: 'https://github.com/login/oauth/authorize'
};
```

### Step 4: Update OAuth Callback Handler

Edit `app.js` function `handleOAuthCallback()`:

```javascript
function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token'); // From backend
    const returnedState = params.get('state');
    const error = params.get('error');
    
    if (error) {
        alert('❌ OAuth Error: ' + error);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    if (token) {
        // Verify state (CSRF protection)
        const savedState = sessionStorage.getItem('oauth_state');
        
        if (!savedState || savedState !== returnedState) {
            alert('❌ Security Error: Invalid state');
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
        
        // Save token
        state.token = token;
        localStorage.setItem('github_token', token);
        
        // Clear URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Load user
        loadUser();
    }
}
```

---

## Keamanan Best Practices

### ✅ DO:
- Store Client Secret di environment variables backend
- Use HTTPS everywhere
- Validate state parameter (CSRF protection)
- Set token expiration
- Use secure CORS settings
- Rate limit your backend
- Log auth attempts
- Revoke tokens yang tidak digunakan

### ❌ DON'T:
- Commit Client Secret ke git
- Store Client Secret di frontend code
- Use HTTP (non-secure)
- Skip state validation
- Expose token di URL (jika tidak perlu)
- Trust user input tanpa validasi
- Store tokens di cookies (use localStorage)

---

## Token Security

### LocalStorage vs Cookies vs SessionStorage

| Storage | Security | Persistence | Best For |
|---------|----------|-------------|----------|
| localStorage | Medium | Permanent | Long-term tokens |
| sessionStorage | Medium | Tab session | Temporary data |
| Cookies (HttpOnly) | High | Configurable | With backend |

**Rekomendasi**: localStorage untuk GitHub token karena:
- Tidak terkirim otomatis ke server (XSS protection lebih baik)
- User control penuh
- Simple untuk static site

### XSS Protection

Aplikasi ini sudah protected dari XSS:
- ✅ No `eval()` or `Function()` constructor
- ✅ No `innerHTML` dengan user input
- ✅ Marked.js sanitize HTML by default
- ✅ CSP headers (jika di production)

### Content Security Policy (Recommended)

Tambahkan di GitHub Pages dengan meta tag:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
               connect-src 'self' https://api.github.com https://raw.githubusercontent.com">
```

---

## Troubleshooting

### OAuth redirect tidak bekerja
- Periksa callback URL di GitHub OAuth App settings
- Pastikan HTTPS (GitHub tidak support HTTP callback)
- Cek CORS di backend

### Token tidak valid
- Periksa scope token (harus `repo`)
- Token expired? Generate baru
- Rate limit exceeded? Tunggu 1 jam

### CORS errors
- Pastikan backend set CORS headers dengan benar
- Allow origin dari frontend URL
- Allow credentials jika perlu

---

## Monitoring & Analytics

### Track OAuth Events

```javascript
// Add analytics tracking
function loginWithOAuth() {
    // Track event
    if (window.gtag) {
        gtag('event', 'login', {
            method: 'github_oauth'
        });
    }
    
    // ... rest of OAuth flow
}
```

### Error Reporting

```javascript
// Add error reporting (e.g., Sentry)
try {
    await githubAPI('/user');
} catch (error) {
    if (window.Sentry) {
        Sentry.captureException(error);
    }
    throw error;
}
```

---

## FAQ

### Q: Apakah aman menyimpan token di localStorage?
A: Ya untuk aplikasi static. Untuk production dengan traffic tinggi, pertimbangkan backend dengan HttpOnly cookies.

### Q: Berapa lama token valid?
A: Personal Access Token: sesuai setting user (30/60/90 days atau no expiration)
   OAuth Token: Permanent sampai revoked

### Q: Bagaimana cara revoke token?
A: Personal Token: https://github.com/settings/tokens
   OAuth: https://github.com/settings/applications

### Q: Apakah perlu backend untuk production?
A: Untuk OAuth: **YA** (wajib untuk keamanan)
   Untuk Personal Token: **TIDAK** (sudah aman tanpa backend)

### Q: Bisa pakai Netlify/Vercel Functions untuk backend?
A: **YA!** Keduanya support serverless functions yang perfect untuk OAuth proxy.

---

## Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [PKCE for OAuth](https://oauth.net/2/pkce/)

---

**Rekomendasi**: 
- **Development/Small Team**: Gunakan **Personal Access Token**
- **Production/Large Team**: Gunakan **OAuth dengan Backend**

Untuk aplikasi ini yang di-deploy di GitHub Pages (static), **Personal Access Token adalah pilihan terbaik** karena simple, secure, dan tidak perlu backend! 🚀
