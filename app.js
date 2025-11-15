// GitHub Repository Configuration
const REPO_CONFIG = {
  owner: "muhammad-seman",
  name: "md-docs-storage", // Ganti dengan nama repo untuk storage
  path: "docs/",
  branch: "main",
};

// State Management
const state = {
  token: sessionStorage.getItem("admin_token"), // Session only, hilang saat close browser
  isAdmin: false,
  files: [],
  currentFile: null,
  theme: localStorage.getItem("theme") || "light",
};

// DOM Elements
const elements = {
  adminModeBtn: document.getElementById("adminModeBtn"),
  modeIndicator: document.getElementById("modeIndicator"),
  newDocBtn: document.getElementById("newDocBtn"),
  fileInput: document.getElementById("fileInput"),
  fileList: document.getElementById("fileList"),
  searchInput: document.getElementById("searchInput"),
  themeToggle: document.getElementById("themeToggle"),

  welcomeScreen: document.getElementById("welcomeScreen"),
  viewerScreen: document.getElementById("viewerScreen"),
  editorScreen: document.getElementById("editorScreen"),

  docTitle: document.getElementById("docTitle"),
  docPath: document.getElementById("docPath"),
  markdownContent: document.getElementById("markdownContent"),
  editBtn: document.getElementById("editBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  downloadBtn: document.getElementById("downloadBtn"),

  fileNameInput: document.getElementById("fileNameInput"),
  markdownEditor: document.getElementById("markdownEditor"),
  markdownPreview: document.getElementById("markdownPreview"),
  saveBtn: document.getElementById("saveBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),

  loadingOverlay: document.getElementById("loadingOverlay"),
};

// Initialize
function init() {
  setupTheme();
  setupEventListeners();

  if (state.token) {
    state.isAdmin = true;
    updateUI();
  }

  loadFiles();
}

// Event Listeners
function setupEventListeners() {
  elements.adminModeBtn.addEventListener("click", toggleAdminMode);
  elements.newDocBtn.addEventListener("click", createNewDocument);
  elements.searchInput.addEventListener("input", handleSearch);
  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.markdownEditor.addEventListener("input", updatePreview);
  elements.saveBtn.addEventListener("click", saveDocument);
  elements.cancelEditBtn.addEventListener("click", cancelEdit);

  elements.editBtn.addEventListener("click", editCurrentDocument);
  elements.deleteBtn.addEventListener("click", deleteCurrentDocument);
  elements.downloadBtn.addEventListener("click", downloadCurrentDocument);
}

// Theme
function setupTheme() {
  document.body.setAttribute("data-theme", state.theme);
  elements.themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", state.theme);
  setupTheme();
}

// Admin Mode Toggle
function toggleAdminMode() {
  if (state.isAdmin) {
    // Logout admin
    if (confirm("Exit admin mode?")) {
      state.token = null;
      state.isAdmin = false;
      sessionStorage.removeItem("admin_token");
      updateUI();
      showWelcomeScreen();
    }
  } else {
    // Enter admin mode
    const token = prompt(
      "🔑 Enter GitHub Personal Access Token:\n\n" +
        "Create at: https://github.com/settings/tokens\n" +
        "Required scope: repo\n\n" +
        "⚠️ Token will be stored in session only (cleared on browser close)",
    );

    if (token && token.trim()) {
      state.token = token.trim();
      sessionStorage.setItem("admin_token", state.token);
      state.isAdmin = true;
      updateUI();
      loadFiles();
    }
  }
}

// UI Update
function updateUI() {
  if (state.isAdmin) {
    elements.adminModeBtn.textContent = "🚪 Exit Admin";
    elements.adminModeBtn.className = "btn-danger";
    elements.modeIndicator.textContent = "⚡ Admin Mode";
    elements.modeIndicator.style.color = "#c0392b";
    elements.modeIndicator.style.fontWeight = "bold";
    elements.newDocBtn.disabled = false;
    elements.editBtn.disabled = false;
    elements.deleteBtn.disabled = false;
  } else {
    elements.adminModeBtn.textContent = "🔑 Admin Mode";
    elements.adminModeBtn.className = "btn-secondary";
    elements.modeIndicator.textContent = "👁️ Public Mode";
    elements.modeIndicator.style.color = "#666";
    elements.modeIndicator.style.fontWeight = "normal";
    elements.newDocBtn.disabled = true;
    elements.editBtn.disabled = true;
    elements.deleteBtn.disabled = true;
  }
}

// GitHub API
async function githubAPI(endpoint, options = {}) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "MD-Docs-Storage",
  };

  if (state.token) {
    headers["Authorization"] = `token ${state.token}`;
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Load Files (Public - No Auth Required)
async function loadFiles() {
  try {
    showLoading(true);
    const path = REPO_CONFIG.path || "";

    try {
      const contents = await githubAPI(
        `/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.name}/contents/${path}`,
      );
      state.files = contents.filter(
        (file) => file.name.endsWith(".md") || file.name.endsWith(".markdown"),
      );
      renderFileList();
    } catch (error) {
      if (error.message.includes("404")) {
        elements.fileList.innerHTML =
          '<p class="empty-state">No documents yet.<br>Admin: Create your first document!</p>';
        state.files = [];
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Failed to load files:", error);
    elements.fileList.innerHTML =
      '<p class="empty-state">Failed to load documents.<br>' +
      error.message +
      "</p>";
  } finally {
    showLoading(false);
  }
}

// Get File Content (Public)
async function getFileContent(file) {
  try {
    showLoading(true);
    const response = await fetch(file.download_url);
    if (!response.ok) throw new Error("Failed to fetch");
    return await response.text();
  } catch (error) {
    throw error;
  } finally {
    showLoading(false);
  }
}

// Save File (Admin Only)
async function saveFileToGitHub(fileName, content, message, sha = null) {
  if (!state.isAdmin) {
    alert("⚠️ Admin mode required to save!");
    return false;
  }

  try {
    showLoading(true);
    const path = `${REPO_CONFIG.path}${fileName}`;

    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: REPO_CONFIG.branch,
    };

    if (sha) {
      body.sha = sha;
    }

    await githubAPI(
      `/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.name}/contents/${path}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );

    await loadFiles();
    alert("✅ Document saved!");
    return true;
  } catch (error) {
    console.error("Failed to save:", error);
    alert("❌ Failed to save: " + error.message);
    return false;
  } finally {
    showLoading(false);
  }
}

// Delete File (Admin Only)
async function deleteFileFromGitHub(file) {
  if (!state.isAdmin) {
    alert("⚠️ Admin mode required to delete!");
    return;
  }

  if (!confirm(`Delete "${file.name}"?\n\nCannot be undone!`)) return;

  try {
    showLoading(true);
    await githubAPI(
      `/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.name}/contents/${file.path}`,
      {
        method: "DELETE",
        body: JSON.stringify({
          message: `Delete ${file.name}`,
          sha: file.sha,
          branch: REPO_CONFIG.branch,
        }),
      },
    );

    await loadFiles();
    showWelcomeScreen();
    alert("✅ Document deleted!");
  } catch (error) {
    console.error("Failed to delete:", error);
    alert("❌ Failed to delete: " + error.message);
  } finally {
    showLoading(false);
  }
}

// UI Rendering
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

// Document Operations
async function viewDocument(file) {
  try {
    const content = await getFileContent(file);
    state.currentFile = { ...file, content };

    elements.docTitle.textContent = file.name;
    elements.docPath.textContent = file.path;
    renderMarkdown(content, elements.markdownContent);

    showViewerScreen();
  } catch (error) {
    alert("❌ Failed to load document: " + error.message);
  }
}

function createNewDocument() {
  if (!state.isAdmin) {
    alert("⚠️ Admin mode required!");
    return;
  }

  state.currentFile = null;
  elements.fileNameInput.value = "";
  elements.markdownEditor.value = "";
  elements.markdownPreview.innerHTML = "";
  showEditorScreen();
}

function editCurrentDocument() {
  if (!state.isAdmin) {
    alert("⚠️ Admin mode required to edit!");
    return;
  }

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
    alert("⚠️ File name required!");
    return;
  }

  if (!fileName.endsWith(".md") && !fileName.endsWith(".markdown")) {
    alert("⚠️ File must end with .md or .markdown");
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
  if (confirm("Discard changes?")) {
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
        } catch (e) {}
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

// Loading
function showLoading(show) {
  if (show) {
    elements.loadingOverlay.classList.remove("hidden");
  } else {
    elements.loadingOverlay.classList.add("hidden");
  }
}

// Initialize
init();
