# MD Docs Manager

Sistem dokumentasi berbasis Markdown dengan GitHub sebagai storage. Solusi gratis dan unlimited untuk menggantikan Google Docs dalam dokumentasi tim.

## Features

- **Unlimited Storage** - Simpan dokumen di GitHub repository (gratis)
- **Kolaborasi Tim** - Share dan edit bersama team
- **Version Control** - Git history otomatis untuk setiap perubahan
- **Markdown Support** - Full markdown syntax + syntax highlighting untuk code
- **Editor Real-time** - Edit dengan preview langsung
- **Dark/Light Mode** - Theme yang nyaman untuk mata
- **Responsive Design** - Akses dari desktop atau mobile
- **No Backend Required** - Fully static, deploy di GitHub Pages

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Marked.js - Markdown parser
- Highlight.js - Syntax highlighting
- GitHub API - Storage & authentication
- GitHub Pages - Free hosting

## Cara Setup

### 1. Fork & Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/md-docs-manager.git
cd md-docs-manager
```

### 2. Buat GitHub Personal Access Token

1. Buka https://github.com/settings/tokens
2. Klik "Generate new token (classic)"
3. Beri nama token: `MD Docs Manager`
4. Pilih scope: **repo** (full control of private repositories)
5. Klik "Generate token"
6. **Copy token** - simpan di tempat aman (akan digunakan untuk login)

### 3. Deploy ke GitHub Pages

#### Via GitHub Settings:
1. Push kode ke repository GitHub Anda
2. Buka repository settings
3. Scroll ke bagian "Pages"
4. Source: pilih `main` branch dan `/ (root)` folder
5. Klik Save
6. Akses di: `https://YOUR_USERNAME.github.io/md-docs-manager`

#### Via Command Line:
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/md-docs-manager.git
git push -u origin main
```

### 4. Setup Repository untuk Dokumen

Anda perlu repository terpisah untuk menyimpan file .md:

```bash
# Buat repository baru di GitHub (via web atau CLI)
gh repo create my-docs --public

# Atau gunakan repository yang sudah ada
```

## Cara Menggunakan

### 1. Login ke Aplikasi

1. Buka web app di browser
2. Klik "Login with GitHub"
3. Paste Personal Access Token yang sudah dibuat
4. Klik OK

### 2. Konfigurasi Repository

Di sidebar, isi:
- **Username**: GitHub username Anda
- **Repository**: Nama repository untuk menyimpan docs (contoh: `my-docs`)
- **Path**: Folder di dalam repo (contoh: `docs/` atau kosongkan untuk root)
- Klik "Save Config"

### 3. Upload Dokumen

1. Klik tombol "+ Upload"
2. Pilih file `.md` dari komputer
3. File otomatis tersimpan ke GitHub repository
4. File langsung muncul di sidebar

### 4. Edit Dokumen

1. Klik dokumen di sidebar untuk membuka
2. Klik tombol "Edit"
3. Edit di panel kiri, preview otomatis di kanan
4. Klik "Save" untuk commit ke GitHub

### 5. Kolaborasi Tim

Share link web app ke team:
```
https://YOUR_USERNAME.github.io/md-docs-manager
```

Setiap member tim:
1. Buat Personal Access Token masing-masing
2. Login di web app
3. Gunakan repository yang sama
4. Semua bisa edit & lihat dokumen yang sama

## Structure Repository Dokumen

Contoh struktur yang recommended:

```
my-docs/
├── docs/
│   ├── projects/
│   │   ├── project-a.md
│   │   └── project-b.md
│   ├── meetings/
│   │   ├── 2024-01-meeting.md
│   │   └── 2024-02-meeting.md
│   └── guides/
│       ├── setup-guide.md
│       └── workflow.md
```

## Markdown Syntax Support

Aplikasi ini support full GitHub Flavored Markdown:

### Heading
```markdown
# H1
## H2
### H3
```

### Text Formatting
```markdown
**bold**
*italic*
~~strikethrough~~
`inline code`
```

### Code Block
````markdown
```javascript
function hello() {
  console.log("Hello World!");
}
```
````

### List
```markdown
- Item 1
- Item 2
  - Sub item

1. First
2. Second
```

### Table
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Link & Image
```markdown
[Link text](https://example.com)
![Alt text](image-url.jpg)
```

### Blockquote
```markdown
> Quote text
```

## Tips & Best Practices

### 1. Naming Convention
```
YYYY-MM-DD-topic-name.md
project-name-documentation.md
meeting-notes-team-sprint-1.md
```

### 2. Use Templates
Buat template di repository untuk konsistensi:

```markdown
# [Project Name]

## Overview
Brief description

## Goals
- Goal 1
- Goal 2

## Technical Details
...

## Next Steps
- [ ] Task 1
- [ ] Task 2
```

### 3. Organize by Folders
```
docs/
├── 01-projects/
├── 02-meetings/
├── 03-guides/
└── 04-archive/
```

### 4. Use GitHub Issues
Link dokumen ke GitHub issues untuk tracking:
```markdown
Related to: #123
Fixes: #456
```

### 5. Backup Strategy
- GitHub repository sudah otomatis backup
- Download repository secara berkala: `git clone`
- Export individual files via "Download" button

## Troubleshooting

### Token tidak valid
- Pastikan token memiliki scope `repo`
- Token expired? Generate token baru
- Paste ulang token di login

### File tidak muncul
- Periksa repository config (username, repo name, path)
- Pastikan path diakhiri dengan `/` jika folder
- Cek repository di GitHub, apakah file benar-benar ada

### Failed to save
- Periksa koneksi internet
- Token masih valid?
- Repository permission benar?

### Preview tidak render
- Pastikan syntax markdown benar
- Check browser console untuk error
- Refresh halaman

## Security Notes

### Token Storage
- Token disimpan di localStorage browser
- Jangan share token ke orang lain
- Revoke token jika tidak digunakan lagi

### Repository Permissions
- Gunakan **private repository** untuk dokumen confidential
- **Public repository** untuk dokumentasi open source
- Set repository permissions per collaborator

### Best Practices
- Jangan commit sensitive data (password, API keys)
- Use `.gitignore` untuk file yang tidak boleh di-push
- Review commit history secara berkala

## Roadmap

- [ ] GitHub OAuth App (no manual token)
- [ ] Multi-repository support
- [ ] Folder navigation
- [ ] Search across all documents
- [ ] Collaborative editing (real-time)
- [ ] Comment system
- [ ] File history viewer
- [ ] Export to PDF
- [ ] Mobile app

## Contributing

Contributions welcome! Fork repository dan submit PR.

## License

MIT License - Free to use for personal and commercial projects

## Support

Issues? Create issue di GitHub repository atau email ke [your-email]

---

**Made with ❤️ for better documentation workflow**
