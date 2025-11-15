# Panduan Deployment ke GitHub Pages

## Quick Start (5 Menit)

### Step 1: Push ke GitHub

```bash
cd md-docs-manager

# Initialize git (jika belum)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: MD Docs Manager"

# Create repository di GitHub (via web)
# Kemudian link dan push:
git remote add origin https://github.com/YOUR_USERNAME/md-docs-manager.git
git branch -M main
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Buka repository di GitHub
2. Klik tab **Settings**
3. Scroll ke **Pages** (di sidebar kiri)
4. Di **Source**, pilih:
   - Branch: `main`
   - Folder: `/ (root)`
5. Klik **Save**
6. Tunggu 1-2 menit
7. Akses di: `https://YOUR_USERNAME.github.io/md-docs-manager`

### Step 3: Buat Repository untuk Dokumen

```bash
# Via GitHub CLI (jika ada)
gh repo create my-team-docs --public

# Atau via web:
# 1. Buka https://github.com/new
# 2. Nama: my-team-docs
# 3. Public/Private sesuai kebutuhan
# 4. Klik Create Repository
```

### Step 4: Setup di Web App

1. Buka `https://YOUR_USERNAME.github.io/md-docs-manager`
2. Login dengan GitHub Personal Access Token
3. Isi Repository Config:
   - Owner: `YOUR_USERNAME`
   - Repository: `my-team-docs`
   - Path: `docs/` (atau kosongkan)
4. Save Config
5. Upload file `.md` pertama

**Done!** Sistem sudah berjalan.

---

## Deployment Options

### Option 1: GitHub Pages (Recommended)

**Pros:**
- ✅ Gratis selamanya
- ✅ HTTPS otomatis
- ✅ Custom domain support
- ✅ CDN global

**Cons:**
- ❌ Public repository required (atau bayar GitHub Pro)
- ❌ Max 1GB storage untuk site

**Setup:**
```bash
git push origin main
# Enable di Settings > Pages
```

**URL:** `https://username.github.io/repo-name`

---

### Option 2: Vercel

**Pros:**
- ✅ Gratis untuk personal
- ✅ Auto deploy on push
- ✅ Analytics included
- ✅ Fast CDN

**Cons:**
- ❌ Perlu akun Vercel

**Setup:**
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd md-docs-manager
vercel
```

3. Follow prompts
4. URL otomatis: `https://project-name.vercel.app`

---

### Option 3: Netlify

**Pros:**
- ✅ Gratis untuk personal
- ✅ Drag & drop deploy
- ✅ Form handling
- ✅ Serverless functions

**Setup:**
1. Buka https://app.netlify.com
2. Drag folder `md-docs-manager` ke Netlify
3. Deploy otomatis
4. URL: `https://random-name.netlify.app`

---

### Option 4: Cloudflare Pages

**Pros:**
- ✅ Gratis unlimited
- ✅ Super fast CDN
- ✅ Unlimited bandwidth

**Setup:**
1. Push ke GitHub
2. Buka https://pages.cloudflare.com
3. Connect GitHub repository
4. Deploy

---

## Custom Domain Setup

### Jika punya domain sendiri (contoh: docs.mycompany.com)

#### GitHub Pages:
1. Tambahkan file `CNAME` di root:
```bash
echo "docs.mycompany.com" > CNAME
git add CNAME
git commit -m "Add CNAME"
git push
```

2. Di DNS provider, tambahkan CNAME record:
```
Type: CNAME
Name: docs
Value: YOUR_USERNAME.github.io
```

3. Wait 5-10 menit
4. Akses di `https://docs.mycompany.com`

#### Vercel/Netlify:
1. Di dashboard, klik "Add domain"
2. Masukkan domain
3. Update DNS sesuai instruksi
4. Done

---

## Environment Variables (Optional)

Jika mau hardcode config untuk tim, edit `app.js`:

```javascript
// Default repository config
const DEFAULT_REPO = {
    owner: 'your-company',
    name: 'team-docs',
    path: 'docs/'
};

// Di function init()
if (!state.repo.owner) {
    state.repo = DEFAULT_REPO;
    saveRepoConfig();
}
```

---

## Advanced: Auto Deploy on Push

### Setup GitHub Actions

Buat `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

Setiap push ke `main` otomatis deploy.

---

## Monitoring & Analytics

### Google Analytics (Optional)

Tambahkan di `index.html` sebelum `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Vercel Analytics

Sudah include otomatis jika deploy di Vercel.

---

## Security Checklist

- [ ] Gunakan private repository untuk dokumen confidential
- [ ] Jangan commit token ke git
- [ ] Set repository permissions dengan benar
- [ ] Enable 2FA di GitHub account
- [ ] Regular review token permissions
- [ ] Use HTTPS (otomatis di semua platform)

---

## Troubleshooting Deployment

### GitHub Pages 404
```bash
# Pastikan branch dan folder benar
# Settings > Pages > Source = main, / (root)

# Cek file ada di repository
git ls-files

# Force rebuild
git commit --allow-empty -m "Rebuild pages"
git push
```

### Custom domain not working
```bash
# Check CNAME file
cat CNAME

# Check DNS propagation
dig docs.mycompany.com

# Wait 10-30 minutes for DNS
```

### App tidak load setelah deploy
```bash
# Check browser console
# Biasanya issue CORS atau missing files

# Verify all files pushed
git status
git push

# Clear browser cache
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## Update & Maintenance

### Update aplikasi:
```bash
git pull origin main  # Get latest changes
# Edit files
git add .
git commit -m "Update features"
git push  # Auto deploy
```

### Rollback jika ada bug:
```bash
git log  # Find good commit
git revert <commit-hash>
git push
```

---

## Production Checklist

Sebelum launch ke team:

- [ ] Deploy berhasil dan bisa diakses
- [ ] Login dengan token berfungsi
- [ ] Upload file .md berfungsi
- [ ] Edit & save berfungsi
- [ ] Delete berfungsi
- [ ] Dark/Light mode berfungsi
- [ ] Responsive di mobile
- [ ] Update README dengan URL actual
- [ ] Share credentials/setup guide ke tim
- [ ] Test dengan tim member (minimal 2 orang)

---

**Selamat! Aplikasi siap digunakan tim! 🚀**
