// GitHub Configuration
const GITHUB_CONFIG = {
  clientId: "YOUR_GITHUB_CLIENT_ID", // Will be set by user
  redirectUri: window.location.origin,
  scope: "repo",
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
  loginBtn: document.getElementById("loginBtn"),
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
  elements.loginBtn.addEventListener("click", loginWithGitHub);
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

// GitHub OAuth
function loginWithGitHub() {
  // For demo purposes, using Personal Access Token
  const token = prompt(
    "Enter your GitHub Personal Access Token:\n\nCreate one at: https://github.com/settings/tokens\nRequired scopes: repo\n\nNote: For production, use OAuth App flow",
  );

  if (token) {
    state.token = token;
    localStorage.setItem("github_token", token);
    loadUser();
  }
}

function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    // In production, exchange code for token via backend
    console.log("OAuth code received:", code);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem("github_token");
  updateUI();
}

// GitHub API Calls
async function githubAPI(endpoint, options = {}) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `token ${state.token}`,
      Accept: "application/vnd.github.v3+json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "GitHub API error");
  }

  return response.json();
}

async function loadUser() {
  try {
    showLoading(true);
    state.user = await githubAPI("/user");
    updateUI();
    loadFiles();
  } catch (error) {
    console.error("Failed to load user:", error);
    alert("Failed to authenticate. Please check your token.");
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
      state.files = contents.filter((file) => file.name.endsWith(".md"));
      renderFileList();
    } catch (error) {
      if (error.message.includes("404")) {
        elements.fileList.innerHTML =
          '<p class="empty-state">No documents found. Upload your first .md file!</p>';
        state.files = [];
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Failed to load files:", error);
    alert("Failed to load files: " + error.message);
  } finally {
    showLoading(false);
  }
}

async function getFileContent(file) {
  try {
    showLoading(true);
    const response = await fetch(file.download_url);
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
      content: btoa(unescape(encodeURIComponent(content))),
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
    alert("Failed to save: " + error.message);
    return false;
  } finally {
    showLoading(false);
  }
}

async function deleteFileFromGitHub(file) {
  if (!confirm(`Delete "${file.name}"?`)) return;

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
  } catch (error) {
    console.error("Failed to delete file:", error);
    alert("Failed to delete: " + error.message);
  } finally {
    showLoading(false);
  }
}

// File Upload
async function handleFileUpload(event) {
  const files = Array.from(event.target.files);

  for (const file of files) {
    if (!file.name.endsWith(".md")) {
      alert(`Skipping ${file.name}: Only .md files are supported`);
      continue;
    }

    const content = await file.text();
    await saveFileToGitHub(file.name, content, `Upload ${file.name}`);
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

  localStorage.setItem("repo_owner", state.repo.owner);
  localStorage.setItem("repo_name", state.repo.name);
  localStorage.setItem("repo_path", state.repo.path);

  loadFiles();
}

// UI Rendering
function updateUI() {
  if (state.user) {
    elements.loginBtn.style.display = "none";
    elements.userInfo.style.display = "flex";
    elements.username.textContent = state.user.login;
    elements.uploadBtn.disabled = false;
    elements.repoConfig.classList.remove("hidden");
  } else {
    elements.loginBtn.style.display = "inline-block";
    elements.userInfo.style.display = "none";
    elements.uploadBtn.disabled = true;
    elements.repoConfig.classList.add("hidden");
    elements.fileList.innerHTML =
      '<p class="empty-state">Login untuk melihat dokumen</p>';
  }
}

function renderFileList(files = state.files) {
  if (files.length === 0) {
    elements.fileList.innerHTML =
      '<p class="empty-state">No documents found</p>';
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
    alert("Failed to load document: " + error.message);
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
    alert("Please enter a file name");
    return;
  }

  if (!fileName.endsWith(".md")) {
    alert("File name must end with .md");
    return;
  }

  const sha = state.currentFile?.sha;
  const message = state.currentFile
    ? `Update ${fileName}`
    : `Create ${fileName}`;

  const success = await saveFileToGitHub(fileName, content, message, sha);

  if (success) {
    showWelcomeScreen();
  }
}

function cancelEdit() {
  if (state.currentFile) {
    viewDocument(state.currentFile);
  } else {
    showWelcomeScreen();
  }
}

async function deleteCurrentDocument() {
  if (!state.currentFile) return;
  await deleteFileFromGitHub(state.currentFile);
}

function downloadCurrentDocument() {
  if (!state.currentFile) return;

  const blob = new Blob([state.currentFile.content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = state.currentFile.name;
  a.click();
  URL.revokeObjectURL(url);
}

// Markdown Rendering
function renderMarkdown(markdown, element) {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
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
