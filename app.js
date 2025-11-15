// GitHub OAuth Configuration
const OAUTH_CONFIG = {
  clientId: "Ov23liUQiJUP9NCLvWyA",
  redirectUri: "https://muhammad-seman.github.io/md-docs-manager/",
  scope: "repo",
  authEndpoint: "https://github.com/login/oauth/authorize",
};

// State Management
const state = {
  token: localStorage.getItem("github_token"),
  user: null,
  repo: {
    owner: localStorage.getItem("repo_owner") || "",
    name: localStorage.getItem("repo_name") || "",
    path: localStorage.getItem("repo_path") || "docs/",
  },
  files: [],
  currentFile: null,
  theme: localStorage.getItem("theme") || "dark",
};

// DOM Elements
const elements = {
  loginOAuthBtn: document.getElementById("loginOAuthBtn"),
  loginTokenBtn: document.getElementById("loginTokenBtn"),
  loginButtons: document.getElementById("loginButtons"),
  logoutBtn: document.getElementById("logoutBtn"),
  userInfo: document.getElementById("userInfo"),
  username: document.getElementById("username"),
  uploadBtn: document.getElementById("uploadBtn"),
  fileInput: document.getElementById("fileInput"),
  fileList: document.getElementById("fileList"),
  searchInput: document.getElementById("searchInput"),
  themeToggle: document.getElementById("themeToggle"),

  // Screens
  welcomeScreen: document.getElementById("welcomeScreen"),
  viewerScreen: document.getElementById("viewerScreen"),
  editorScreen: document.getElementById("editorScreen"),

  // Repo Config
  repoConfig: document.getElementById("repoConfig"),
  repoOwner: document.getElementById("repoOwner"),
  repoName: document.getElementById("repoName"),
  repoPath: document.getElementById("repoPath"),
  saveRepoConfig: document.getElementById("saveRepoConfig"),

  // Viewer
  docTitle: document.getElementById("docTitle"),
  docPath: document.getElementById("docPath"),
  markdownContent: document.getElementById("markdownContent"),
  editBtn: document.getElementById("editBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  downloadBtn: document.getElementById("downloadBtn"),

  // Editor
  fileNameInput: document.getElementById("fileNameInput"),
  markdownEditor: document.getElementById("markdownEditor"),
  markdownPreview: document.getElementById("markdownPreview"),
  saveBtn: document.getElementById("saveBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),

  loadingOverlay: document.getElementById("loadingOverlay"),
};

// Security: Generate random state for CSRF protection
function generateSecureState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

// Initialize App
function init() {
  setupTheme();
  setupEventListeners();
  handleOAuthCallback();

  if (state.token) {
    loadUser();
  }

  loadRepoConfig();
}

// Setup Event Listeners
function setupEventListeners() {
  if (elements.loginOAuthBtn) {
    elements.loginOAuthBtn.addEventListener("click", loginWithOAuth);
  }
  if (elements.loginTokenBtn) {
    elements.loginTokenBtn.addEventListener("click", loginWithToken);
  }
  elements.logoutBtn.addEventListener("click", logout);
  elements.uploadBtn.addEventListener("click", () =>
    elements.fileInput.click(),
  );
  elements.fileInput.addEventListener("change", handleFileUpload);
  elements.searchInput.addEventListener("input", handleSearch);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.saveRepoConfig.addEventListener("click", saveRepoConfig);

  // Editor
  elements.markdownEditor.addEventListener("input", updatePreview);
  elements.saveBtn.addEventListener("click", saveDocument);
  elements.cancelEditBtn.addEventListener("click", cancelEdit);

  // Viewer
  elements.editBtn.addEventListener("click", editCurrentDocument);
  elements.deleteBtn.addEventListener("click", deleteCurrentDocument);
  elements.downloadBtn.addEventListener("click", downloadCurrentDocument);
}

// Theme Management
function setupTheme() {
  document.body.setAttribute("data-theme", state.theme);
  elements.themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", state.theme);
  setupTheme();
}

// GitHub OAuth Flow (Secure)
function loginWithOAuth() {
  // Check if client ID is configured
  if (OAUTH_CONFIG.clientId === "YOUR_GITHUB_OAUTH_CLIENT_ID") {
    alert(
      "⚠️ GitHub OAuth belum dikonfigurasi!\n\n" +
        "Untuk menggunakan OAuth:\n" +
        "1. Buat OAuth App di https://github.com/settings/developers\n" +
        "2. Set Homepage URL: " +
        window.location.origin +
        "\n" +
        "3. Set Callback URL: " +
        OAUTH_CONFIG.redirectUri +
        "\n" +
        "4. Copy Client ID ke file oauth-config.js atau app.js\n\n" +
        'Atau gunakan tombol "Use Token" untuk login dengan Personal Access Token.',
    );
    return;
  }

  // Generate and store CSRF protection state
  const csrfState = generateSecureState();
  sessionStorage.setItem("oauth_state", csrfState);
  sessionStorage.setItem("oauth_timestamp", Date.now().toString());

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scope,
    state: csrfState,
    allow_signup: "false", // Security: Prevent account creation during auth
  });

  // Redirect to GitHub OAuth
  window.location.href = `${OAUTH_CONFIG.authEndpoint}?${params.toString()}`;
}

// Personal Access Token Login (Fallback)
function loginWithToken() {
  const tokenInfo =
    "Masukkan GitHub Personal Access Token:\n\n" +
    "✅ Cara membuat:\n" +
    "1. Buka: https://github.com/settings/tokens\n" +
    '2. Klik "Generate new token (classic)"\n' +
    "3. Nama: MD Docs Manager\n" +
    "4. Pilih scope: ✓ repo\n" +
    "5. Generate & copy token\n\n" +
    "⚠️ Token hanya tampil sekali, simpan dengan aman!";

  const token = prompt(tokenInfo);

  if (token && token.trim()) {
    // Validate token format (basic check)
    if (token.trim().length < 20) {
      alert("❌ Token tidak valid. Token GitHub minimal 20 karakter.");
      return;
    }

    state.token = token.trim();
    localStorage.setItem("github_token", state.token);
    loadUser();
  }
}

// Handle OAuth Callback
function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");
  const error = params.get("error");

  // Check for OAuth errors
  if (error) {
    alert("❌ OAuth Error: " + error);
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  if (code) {
    // Security: Verify CSRF state
    const savedState = sessionStorage.getItem("oauth_state");
    const timestamp = parseInt(
      sessionStorage.getItem("oauth_timestamp") || "0",
    );
    const now = Date.now();

    // Clear session storage
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_timestamp");

    // Validate state (CSRF protection)
    if (!savedState || savedState !== returnedState) {
      alert(
        "❌ Security Error: Invalid state parameter. Possible CSRF attack.",
      );
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Validate timestamp (prevent replay attacks - 5 minute window)
    if (now - timestamp > 5 * 60 * 1000) {
      alert("❌ Security Error: OAuth session expired. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Exchange code for token
    // NOTE: This requires a backend proxy for security
    // Client-side OAuth code exchange is NOT SECURE
    alert(
      "⚠️ OAuth Code Exchange memerlukan backend server!\n\n" +
        "Untuk keamanan, exchange code untuk token harus dilakukan di backend.\n" +
        'Silakan gunakan "Use Token" untuk login dengan Personal Access Token,\n' +
        "atau setup backend proxy untuk OAuth flow.\n\n" +
        "Dokumentasi: lihat OAUTH-SETUP.md",
    );

    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function logout() {
  if (confirm("Logout dari aplikasi?")) {
    state.token = null;
    state.user = null;
    localStorage.removeItem("github_token");
    updateUI();
    showWelcomeScreen();
  }
}

// GitHub API Calls
async function githubAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        Authorization: `token ${state.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "MD-Docs-Manager", // Required by GitHub API
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.error("GitHub API Error:", error);
    throw error;
  }
}

async function loadUser() {
  try {
    showLoading(true);
    state.user = await githubAPI("/user");
    updateUI();
    loadFiles();
  } catch (error) {
    console.error("Failed to load user:", error);
    alert(
      "❌ Gagal autentikasi. Periksa token Anda.\n\nError: " + error.message,
    );
    logout();
  } finally {
    showLoading(false);
  }
}

async function loadFiles() {
  if (!state.repo.owner || !state.repo.name) {
    elements.fileList.innerHTML =
      '<p class="empty-state">Configure repository settings first</p>';
    return;
  }

  try {
    showLoading(true);
    const path = state.repo.path || "";

    try {
      const contents = await githubAPI(
        `/repos/${state.repo.owner}/${state.repo.name}/contents/${path}`,
      );
      state.files = contents.filter(
        (file) => file.name.endsWith(".md") || file.name.endsWith(".markdown"),
      );
      renderFileList();
    } catch (error) {
      if (error.message.includes("404")) {
        elements.fileList.innerHTML =
          '<p class="empty-state">📄 No documents found.<br>Upload your first .md file!</p>';
        state.files = [];
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Failed to load files:", error);
    alert("❌ Gagal memuat files: " + error.message);
  } finally {
    showLoading(false);
  }
}

async function getFileContent(file) {
  try {
    showLoading(true);
    const response = await fetch(file.download_url);
    if (!response.ok) throw new Error("Failed to fetch file");
    return await response.text();
  } catch (error) {
    console.error("Failed to get file content:", error);
    throw error;
  } finally {
    showLoading(false);
  }
}

async function saveFileToGitHub(
  fileName,
  content,
  message = "Update document",
  sha = null,
) {
  try {
    showLoading(true);
    const path = `${state.repo.path}${fileName}`;

    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), // UTF-8 safe base64
      branch: "main",
    };

    if (sha) {
      body.sha = sha;
    }

    await githubAPI(
      `/repos/${state.repo.owner}/${state.repo.name}/contents/${path}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );

    await loadFiles();
    return true;
  } catch (error) {
    console.error("Failed to save file:", error);
    alert("❌ Gagal menyimpan: " + error.message);
    return false;
  } finally {
    showLoading(false);
  }
}

async function deleteFileFromGitHub(file) {
  if (!confirm(`🗑️ Delete "${file.name}"?\n\nTidak bisa di-undo!`)) return;

  try {
    showLoading(true);
    await githubAPI(
      `/repos/${state.repo.owner}/${state.repo.name}/contents/${file.path}`,
      {
        method: "DELETE",
        body: JSON.stringify({
          message: `Delete ${file.name}`,
          sha: file.sha,
          branch: "main",
        }),
      },
    );

    await loadFiles();
    showWelcomeScreen();
    alert("✅ File berhasil dihapus!");
  } catch (error) {
    console.error("Failed to delete file:", error);
    alert("❌ Gagal menghapus: " + error.message);
  } finally {
    showLoading(false);
  }
}

// File Upload
async function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  let successCount = 0;

  for (const file of files) {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      alert(`⚠️ Skipping ${file.name}: Only .md files are supported`);
      continue;
    }

    const content = await file.text();
    const success = await saveFileToGitHub(
      file.name,
      content,
      `Upload ${file.name}`,
    );
    if (success) successCount++;
  }

  if (successCount > 0) {
    alert(`✅ ${successCount} file(s) berhasil di-upload!`);
  }

  event.target.value = "";
}

// Repository Configuration
function loadRepoConfig() {
  elements.repoOwner.value = state.repo.owner;
  elements.repoName.value = state.repo.name;
  elements.repoPath.value = state.repo.path;
}

function saveRepoConfig() {
  state.repo.owner = elements.repoOwner.value.trim();
  state.repo.name = elements.repoName.value.trim();
  state.repo.path = elements.repoPath.value.trim();

  if (!state.repo.owner || !state.repo.name) {
    alert("⚠️ Owner dan Repository name harus diisi!");
    return;
  }

  localStorage.setItem("repo_owner", state.repo.owner);
  localStorage.setItem("repo_name", state.repo.name);
  localStorage.setItem("repo_path", state.repo.path);

  alert("✅ Repository config saved!");
  loadFiles();
}

// UI Rendering
function updateUI() {
  if (state.user) {
    elements.loginButtons.style.display = "none";
    elements.userInfo.style.display = "flex";
    elements.username.textContent = "@" + state.user.login;
    elements.uploadBtn.disabled = false;
    elements.repoConfig.classList.remove("hidden");
  } else {
    elements.loginButtons.style.display = "flex";
    elements.userInfo.style.display = "none";
    elements.uploadBtn.disabled = true;
    elements.repoConfig.classList.add("hidden");
    elements.fileList.innerHTML =
      '<p class="empty-state">🔐 Login untuk melihat dokumen</p>';
  }
}

function renderFileList(files = state.files) {
  if (files.length === 0) {
    elements.fileList.innerHTML =
      '<p class="empty-state">📄 No documents found</p>';
    return;
  }

  elements.fileList.innerHTML = files
    .map(
      (file) => `
        <div class="file-item" data-path="${file.path}">
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
        </div>
    `,
    )
    .join("");

  elements.fileList.querySelectorAll(".file-item").forEach((item) => {
    item.addEventListener("click", () => {
      const file = files.find((f) => f.path === item.dataset.path);
      viewDocument(file);
    });
  });
}

function handleSearch(event) {
  const query = event.target.value.toLowerCase();
  const filtered = state.files.filter((file) =>
    file.name.toLowerCase().includes(query),
  );
  renderFileList(filtered);
}

// Screen Navigation
function showWelcomeScreen() {
  elements.welcomeScreen.classList.remove("hidden");
  elements.viewerScreen.classList.add("hidden");
  elements.editorScreen.classList.add("hidden");
  state.currentFile = null;
}

function showViewerScreen() {
  elements.welcomeScreen.classList.add("hidden");
  elements.viewerScreen.classList.remove("hidden");
  elements.editorScreen.classList.add("hidden");
}

function showEditorScreen() {
  elements.welcomeScreen.classList.add("hidden");
  elements.viewerScreen.classList.add("hidden");
  elements.editorScreen.classList.remove("hidden");
}

// Document Viewing
async function viewDocument(file) {
  try {
    const content = await getFileContent(file);
    state.currentFile = { ...file, content };

    elements.docTitle.textContent = file.name;
    elements.docPath.textContent = file.path;
    renderMarkdown(content, elements.markdownContent);

    showViewerScreen();
  } catch (error) {
    alert("❌ Gagal memuat dokumen: " + error.message);
  }
}

// Document Editing
function editCurrentDocument() {
  if (!state.currentFile) return;

  elements.fileNameInput.value = state.currentFile.name;
  elements.markdownEditor.value = state.currentFile.content;
  updatePreview();
  showEditorScreen();
}

async function saveDocument() {
  const fileName = elements.fileNameInput.value.trim();
  const content = elements.markdownEditor.value;

  if (!fileName) {
    alert("⚠️ File name tidak boleh kosong!");
    return;
  }

  if (!fileName.endsWith(".md") && !fileName.endsWith(".markdown")) {
    alert("⚠️ File name harus berakhiran .md atau .markdown");
    return;
  }

  const sha = state.currentFile?.sha;
  const message = state.currentFile
    ? `Update ${fileName}`
    : `Create ${fileName}`;

  const success = await saveFileToGitHub(fileName, content, message, sha);

  if (success) {
    alert("✅ Dokumen berhasil disimpan!");
    showWelcomeScreen();
  }
}

function cancelEdit() {
  if (confirm("❌ Buang perubahan?")) {
    if (state.currentFile) {
      viewDocument(state.currentFile);
    } else {
      showWelcomeScreen();
    }
  }
}

async function deleteCurrentDocument() {
  if (!state.currentFile) return;
  await deleteFileFromGitHub(state.currentFile);
}

function downloadCurrentDocument() {
  if (!state.currentFile) return;

  const blob = new Blob([state.currentFile.content], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = state.currentFile.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Markdown Rendering
function renderMarkdown(markdown, element) {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (e) {
          console.error("Highlight error:", e);
        }
      }
      return hljs.highlightAuto(code).value;
    },
  });

  element.innerHTML = marked.parse(markdown);
}

function updatePreview() {
  const markdown = elements.markdownEditor.value;
  renderMarkdown(markdown, elements.markdownPreview);
}

// Loading State
function showLoading(show) {
  if (show) {
    elements.loadingOverlay.classList.remove("hidden");
  } else {
    elements.loadingOverlay.classList.add("hidden");
  }
}

// Initialize on load
init();
