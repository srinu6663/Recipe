// Merged upload logic using Guffran chunk API with Food Corpus UI
const UP_API = 'https://api.corpus.swecha.org/api/v1';
const FOOD_CATEGORY_ID = '833299f6-ff1c-4fde-804f-6d3b3877c76e';

let selectedFile = null;
let selectedMediaType = null;
let resolvedCategoryId = FOOD_CATEGORY_ID; // fixed per provided Food category

function selectMediaType(type) {
    selectedMediaType = type;
    document.querySelectorAll('.media-option').forEach(el => el.classList.remove('selected'));
    const el = document.querySelector(`[data-type="${type}"]`); if (el) el.classList.add('selected');
    const icons = { image: '🖼️', audio: '🎤', video: '📹', text: '📝' };
    const titles = { image: 'Image Content', audio: 'Audio Content', video: 'Video Content', text: 'Text Content' };
    const iconEl = document.getElementById('selectedTypeIcon');
    const textEl = document.getElementById('selectedTypeText');
    if (iconEl) iconEl.textContent = icons[type];
    if (textEl) textEl.textContent = titles[type];
    const fileInput = document.getElementById('fileInput');
    const uploadSubtext = document.getElementById('uploadSubtext');
    if (fileInput && uploadSubtext) {
        if (type === 'image') { fileInput.accept = '.jpg,.jpeg,.png,.gif,.webp'; uploadSubtext.textContent = 'Supports: JPG, JPEG, PNG, GIF, WebP formats'; }
        if (type === 'audio') { fileInput.accept = 'audio/*'; uploadSubtext.textContent = 'Supports: MP3, WAV, OGG, M4A formats'; }
        if (type === 'video') { fileInput.accept = 'video/*'; uploadSubtext.textContent = 'Supports: MP4, AVI, MOV, WebM formats'; }
        if (type === 'text') { fileInput.accept = '.txt,.doc,.docx,.pdf'; uploadSubtext.textContent = 'Supports: TXT, DOC, DOCX, PDF formats'; }
    }
    const form = document.getElementById('uploadForm');
    const selector = document.querySelector('.media-type-selector');
    if (form) form.style.display = 'block';
    if (selector) selector.style.display = 'none';
    const mediaTypeInput = document.getElementById('mediaType');
    if (mediaTypeInput) mediaTypeInput.value = type;
}

function resetMediaType() {
    selectedMediaType = null; selectedFile = null; hideFileInfo(); hideProgress();
    const form = document.getElementById('uploadForm');
    const selector = document.querySelector('.media-type-selector');
    if (form) { form.reset(); form.style.display = 'none'; }
    if (selector) selector.style.display = 'block';
}

function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    if (!uploadArea || !fileInput || !uploadForm) return;
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', e => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', e => { e.preventDefault(); uploadArea.classList.remove('dragover'); const f = e.dataTransfer.files[0]; if (f) { selectedFile = f; displayFileInfo(f); } });
    uploadForm.addEventListener('submit', handleUpload);
}

function handleFileSelect(e) { const f = e.target.files[0]; if (f) { selectedFile = f; displayFileInfo(f); } }

function displayFileInfo(file) {
    const info = document.getElementById('fileInfo');
    if (info) info.style.display = 'block';
    const fn = document.getElementById('fileName'); const fs = document.getElementById('fileSize'); const ft = document.getElementById('fileType');
    if (fn) fn.textContent = file.name; if (fs) fs.textContent = `Size: ${formatFileSize(file.size)}`; if (ft) ft.textContent = `Type: ${file.type || 'Unknown'}`;
    const area = document.getElementById('uploadArea');
    if (area) area.innerHTML = `<div class="upload-icon">📄</div><div class="upload-text">File selected: ${file.name}</div><div class="upload-subtext">Click to select a different file</div>`;
}

function hideFileInfo() { const el = document.getElementById('fileInfo'); if (el) el.style.display = 'none'; }
function showProgress() { const el = document.getElementById('progressContainer'); if (el) el.style.display = 'block'; updateProgress(0); }
function hideProgress() { const el = document.getElementById('progressContainer'); if (el) el.style.display = 'none'; }
function updateProgress(p) { const fill = document.getElementById('progressFill'); const txt = document.getElementById('progressText'); if (fill) fill.style.width = `${p}%`; if (txt) txt.textContent = `${p}%`; }
function formatFileSize(b) { if (b === 0) return '0 Bytes'; const k = 1024, s = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(b) / Math.log(k)); return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + s[i]; }

function showAlert(message, type = 'info') { const c = document.getElementById('alertContainer'); if (!c) return; c.innerHTML = `<div class="alert alert-${type}"><span>${message}</span></div>`; setTimeout(() => { if (c.firstChild) c.firstChild.remove(); }, 5000); }

function generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }

async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) return showAlert('Please select a file to upload.', 'error');
    const form = new FormData(e.target);
    const title = form.get('title');
    const description = form.get('description');
    const language = form.get('language');
    const releaseRights = form.get('releaseRights');
    const mediaType = form.get('mediaType') || selectedMediaType;
    if (!title || !description || !language || !releaseRights || !mediaType) return showAlert('Please fill in all required fields.', 'error');
    // Category is pinned; no dynamic resolution needed

    const btn = document.getElementById('uploadBtn');
    const txt = document.getElementById('uploadText');
    const load = document.getElementById('uploadLoading');
    if (btn && txt && load) { btn.disabled = true; txt.style.display = 'none'; load.style.display = 'inline'; }

    try {
        const metadata = { title: title.trim(), description: description.trim(), media_type: mediaType, language, release_rights: releaseRights, tags: form.get('tags')?.trim() || '' };
        let result;
        if (mediaType === 'audio' || mediaType === 'video') result = await uploadWithChunks(selectedFile, metadata);
        else result = await uploadDirect(selectedFile, metadata);
        showAlert('Upload successful! Your contribution has been added.', 'success');
        setTimeout(() => location.href = 'dashboard.html', 1200);
    } catch (err) {
        showAlert(`Upload failed: ${err.message}`, 'error');
    } finally {
        if (btn && txt && load) { btn.disabled = false; txt.style.display = 'inline'; load.style.display = 'none'; }
        hideProgress();
    }
}

// Category is fixed to FOOD_CATEGORY_ID per user instruction; no resolver needed.

async function uploadWithChunks(file, metadata) {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadUuid = generateUUID();
    showProgress();
    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE, end = Math.min(file.size, start + CHUNK_SIZE); const chunk = file.slice(start, end);
        const fd = new FormData();
        fd.append('chunk', chunk);
        fd.append('filename', file.name);
        fd.append('chunk_index', i);
        fd.append('total_chunks', totalChunks);
        fd.append('upload_uuid', uploadUuid);
        const resp = await fetch(`${UP_API}/records/upload/chunk`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        if (!resp.ok) { let t; try { t = await resp.json(); } catch { t = {}; } throw new Error(`Chunk ${i + 1}/${totalChunks} failed: ${t.message || resp.statusText}`); }
        updateProgress(Math.round(((i + 1) / totalChunks) * 90));
    }
    // finalize
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Missing user ID');
    const finalize = new URLSearchParams();
    finalize.append('title', metadata.title);
    finalize.append('description', metadata.description || '');
    finalize.append('category_id', resolvedCategoryId || '833299f6-ff1c-4fde-804f-6d3b3877c76e');
    finalize.append('user_id', userId);
    finalize.append('media_type', metadata.media_type);
    finalize.append('upload_uuid', uploadUuid);
    finalize.append('filename', file.name);
    finalize.append('total_chunks', totalChunks);
    finalize.append('release_rights', metadata.release_rights);
    finalize.append('language', metadata.language);
    if (metadata.tags) finalize.append('tags', metadata.tags);
    const finResp = await fetch(`${UP_API}/records/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: finalize.toString() });
    if (!finResp.ok) { let t; try { t = await finResp.json(); } catch { t = {}; } throw new Error(t.message || finResp.statusText); }
    updateProgress(100);
    return finResp.json();
}

async function uploadDirect(file, metadata) {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    showProgress(); updateProgress(30);
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Missing user ID');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', metadata.title);
    fd.append('description', metadata.description);
    fd.append('category_id', resolvedCategoryId || '833299f6-ff1c-4fde-804f-6d3b3877c76e');
    fd.append('user_id', userId);
    fd.append('media_type', metadata.media_type);
    fd.append('language', metadata.language);
    // Some API variants require release_rights for all media types (including text & image)
    if (metadata.release_rights) fd.append('release_rights', metadata.release_rights);
    if (metadata.tags) fd.append('tags', metadata.tags);
    const resp = await fetch(`${UP_API}/records/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
    if (!resp.ok) {
        // Try to parse detailed error
        let errDetail = '';
        try {
            const t = await resp.json();
            if (t.detail && Array.isArray(t.detail)) {
                errDetail = t.detail.map(d => `${(d.loc || []).join('.')}: ${d.msg}`).join('; ');
            } else {
                errDetail = t.message || t.error || resp.statusText;
            }
        } catch {
            errDetail = resp.statusText;
        }

        // If validation failed (422), fallback to chunked path which is accepted for all media types
        if (resp.status === 422) {
            // Fallback: upload as single or multi chunk then finalize
            try {
                return await uploadWithChunks(file, metadata);
            } catch (fallbackErr) {
                throw new Error(`Direct upload 422 (${errDetail}); chunked fallback also failed: ${fallbackErr.message}`);
            }
        }
        throw new Error(errDetail);
    }
    updateProgress(100);
    return resp.json();
}
