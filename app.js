// GitHub Repository Configuration
const REPO_CONFIG = {
  owner: "muhammad-seman",
  name: "md-docs-storage",
  path: "docs/",
  branch: "main",
};

// State Management
const state = {
  token: sessionStorage.getItem("admin_token"),
  isAdmin: false,
  files: [],
  currentFile: null,
};

// DOM Elements
const elements = {
  newDocBtn: document.getElementById("newDocBtn"),
  fileList: document.getElementById("fileList"),
  searchInput: document.getElementById("searchInput"),

  viewerScreen: document.getElementById("viewerScreen"),
  editorScreen: document.getElementById("editorScreen"),

  docTitle: document.getElementById("docTitle"),
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
async function init() {
  if (state.token) {
    state.isAdmin = true;
    updateUI();
  }

  setupEventListeners();
  await loadFiles();
  handleURLRouting();
}

// Event Listeners
function setupEventListeners() {
  elements.newDocBtn.addEventListener("click", createNewDocument);
  elements.searchInput.addEventListener("input", handleSearch);

  elements.markdownEditor.addEventListener("input", updatePreview);
  elements.saveBtn.addEventListener("click", saveDocument);
  elements.cancelEditBtn.addEventListener("click", cancelEdit);

  elements.editBtn.addEventListener("click", editCurrentDocument);
  elements.deleteBtn.addEventListener("click", deleteCurrentDocument);
  elements.downloadBtn.addEventListener("click", downloadCurrentDocument);

  window.addEventListener("popstate", handleURLRouting);
}

// URL Routing
function handleURLRouting() {
  const hash = window.location.hash.substring(1);
  if (hash) {
    const fileName = decodeURIComponent(hash);
    const file = state.files.find((f) => f.name === fileName);
    if (file) {
      viewDocument(file);
    }
  }
}

function setURLHash(fileName) {
  window.location.hash = encodeURIComponent(fileName);
}

// UI Update
function updateUI() {
  if (state.isAdmin) {
    elements.newDocBtn.disabled = false;
    elements.editBtn.disabled = false;
    elements.deleteBtn.disabled = false;
  } else {
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

// Load Files
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
        state.files = [];
        renderFileList();
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Failed to load files:", error);
  } finally {
    showLoading(false);
  }
}

// Get File Content
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

// Save File
async function saveFileToGitHub(fileName, content, message, sha = null) {
  if (!state.isAdmin) return false;

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
    return true;
  } catch (error) {
    console.error("Failed to save:", error);
    alert("Failed to save: " + error.message);
    return false;
  } finally {
    showLoading(false);
  }
}

// Delete File
async function deleteFileFromGitHub(file) {
  if (!state.isAdmin) return;
  if (!confirm(`Delete "${file.name}"?`)) return;

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
    hideViewer();
  } catch (error) {
    console.error("Failed to delete:", error);
    alert("Failed to delete: " + error.message);
  } finally {
    showLoading(false);
  }
}

// UI Rendering
function renderFileList(files = state.files) {
  if (files.length === 0) {
    elements.fileList.innerHTML = "";
    return;
  }

  elements.fileList.innerHTML = files
    .map(
      (file) => `
        <div class="file-item" data-path="${file.path}" data-name="${file.name}">
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

    // Right click to copy share link
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const fileName = item.dataset.name;
      const shareURL = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(fileName)}`;
      navigator.clipboard.writeText(shareURL).then(() => {
        const originalText = item.querySelector(".file-name").textContent;
        item.querySelector(".file-name").textContent = "Link copied!";
        setTimeout(() => {
          item.querySelector(".file-name").textContent = originalText;
        }, 1000);
      });
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
function hideViewer() {
  elements.viewerScreen.classList.add("hidden");
  elements.editorScreen.classList.add("hidden");
  state.currentFile = null;
  window.location.hash = "";
}

function showViewerScreen() {
  elements.viewerScreen.classList.remove("hidden");
  elements.editorScreen.classList.add("hidden");
}

function showEditorScreen() {
  elements.viewerScreen.classList.add("hidden");
  elements.editorScreen.classList.remove("hidden");
}

// Document Operations
async function viewDocument(file) {
  try {
    const content = await getFileContent(file);
    state.currentFile = { ...file, content };

    elements.docTitle.textContent = file.name;
    renderMarkdown(content, elements.markdownContent);

    showViewerScreen();
    setURLHash(file.name);
  } catch (error) {
    alert("Failed to load document: " + error.message);
  }
}

function createNewDocument() {
  if (!state.isAdmin) return;

  state.currentFile = null;
  elements.fileNameInput.value = "";
  elements.markdownEditor.value = "";
  elements.markdownPreview.innerHTML = "";
  showEditorScreen();
}

function editCurrentDocument() {
  if (!state.isAdmin || !state.currentFile) return;

  elements.fileNameInput.value = state.currentFile.name;
  elements.markdownEditor.value = state.currentFile.content;
  updatePreview();
  showEditorScreen();
}

async function saveDocument() {
  const fileName = elements.fileNameInput.value.trim();
  const content = elements.markdownEditor.value;

  if (!fileName) {
    alert("File name required");
    return;
  }

  if (!fileName.endsWith(".md") && !fileName.endsWith(".markdown")) {
    alert("File must end with .md");
    return;
  }

  const sha = state.currentFile?.sha;
  const message = state.currentFile
    ? `Update ${fileName}`
    : `Create ${fileName}`;

  const success = await saveFileToGitHub(fileName, content, message, sha);

  if (success) {
    hideViewer();
  }
}

function cancelEdit() {
  if (state.currentFile) {
    viewDocument(state.currentFile);
  } else {
    hideViewer();
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
