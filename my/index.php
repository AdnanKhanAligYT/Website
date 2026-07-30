<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Documents</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#0c0a0a;
  --panel:#161112;
  --panel2:#1c1516;
  --border:#2b1e1f;
  --red:#e2342f;
  --red-dim:#7a1d1a;
  --text:#f2e9e9;
  --muted:#a68d8d;
  --font-head:'Syne',sans-serif;
  --font-body:'DM Sans',sans-serif;
  --font-mono:'DM Mono',monospace;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{
  background:var(--bg);
  color:var(--text);
  font-family:var(--font-body);
  min-height:100vh;
  padding-bottom:40px;
}
header{
  padding:24px 20px 16px;
  border-bottom:1px solid var(--border);
  position:sticky;top:0;background:rgba(12,10,10,0.95);backdrop-filter:blur(6px);z-index:20;
}
h1{
  font-family:var(--font-head);
  font-size:24px;
  font-weight:800;
  letter-spacing:-0.5px;
  color:var(--text);
}
h1 span{color:var(--red);}
.subtitle{color:var(--muted);font-size:13px;margin-top:4px;font-family:var(--font-mono);}

.toolbar{
  display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;
}
.search-box{
  flex:1;min-width:180px;
  background:var(--panel);
  border:1px solid var(--border);
  border-radius:10px;
  padding:10px 14px;
  color:var(--text);
  font-family:var(--font-body);
  font-size:14px;
}
.search-box:focus{outline:none;border-color:var(--red-dim);}

select, .btn{
  background:var(--panel);
  border:1px solid var(--border);
  border-radius:10px;
  padding:10px 14px;
  color:var(--text);
  font-family:var(--font-body);
  font-size:14px;
  cursor:pointer;
}
.btn-primary{
  background:var(--red);
  border-color:var(--red);
  color:#fff;
  font-weight:700;
}
.btn-primary:hover{background:#c92a25;}
.view-toggle{display:flex;border:1px solid var(--border);border-radius:10px;overflow:hidden;}
.view-toggle button{
  background:var(--panel);border:none;color:var(--muted);padding:10px 14px;cursor:pointer;font-family:var(--font-body);
}
.view-toggle button.active{background:var(--red-dim);color:#fff;}

main{padding:20px;}

#grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(140px,1fr));
  gap:14px;
}
#grid.list-mode{
  grid-template-columns:1fr;
}
.card{
  background:var(--panel);
  border:1px solid var(--border);
  border-radius:14px;
  overflow:hidden;
  cursor:pointer;
  transition:border-color .15s, transform .1s;
  display:flex;flex-direction:column;
}
.card:active{transform:scale(0.98);}
.card:hover{border-color:var(--red-dim);}
.thumb{
  height:110px;
  background:var(--panel2);
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
}
.thumb img{width:100%;height:100%;object-fit:cover;}
.thumb .pdf-icon{
  font-family:var(--font-head);font-weight:800;color:var(--red);font-size:13px;
  display:flex;flex-direction:column;align-items:center;gap:4px;
}
.card-info{padding:10px 12px;position:relative;}
.card-name{
  font-size:13px;font-weight:500;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  padding-right:20px;
}
.quick-edit{
  position:absolute;top:8px;right:8px;
  background:none;border:none;color:var(--muted);
  font-size:13px;cursor:pointer;padding:2px 4px;
  line-height:1;
}
.quick-edit:hover{color:var(--red);}
.card-meta{
  font-size:11px;color:var(--muted);margin-top:3px;font-family:var(--font-mono);
  display:flex;justify-content:space-between;gap:6px;
}
.tag-pill{
  display:inline-block;background:var(--red-dim);color:#fff;font-size:10px;
  padding:2px 8px;border-radius:20px;margin-top:6px;font-family:var(--font-mono);
}

#grid.list-mode .card{flex-direction:row;align-items:center;}
#grid.list-mode .thumb{width:60px;height:60px;flex-shrink:0;}
#grid.list-mode .card-info{flex:1;padding:8px 12px;}

.empty-state{
  text-align:center;color:var(--muted);padding:60px 20px;font-family:var(--font-mono);font-size:14px;
}

/* Upload FAB */
.fab{
  position:fixed;bottom:24px;right:20px;
  width:58px;height:58px;border-radius:50%;
  background:var(--red);color:#fff;border:none;
  font-size:28px;box-shadow:0 4px 20px rgba(226,52,47,0.4);
  cursor:pointer;z-index:30;display:flex;align-items:center;justify-content:center;
}

/* Modal */
.modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,0.75);
  display:none;align-items:flex-end;justify-content:center;z-index:100;
}
.modal-overlay.active{display:flex;}
.modal{
  background:var(--panel);
  border-top:1px solid var(--border);
  border-radius:18px 18px 0 0;
  width:100%;max-width:520px;
  max-height:88vh;overflow-y:auto;
  padding:20px;
  animation:slideup .2s ease-out;
}
@media(min-width:600px){
  .modal-overlay{align-items:center;}
  .modal{border-radius:18px;}
}
@keyframes slideup{from{transform:translateY(30px);opacity:0;}to{transform:translateY(0);opacity:1;}}

.modal h2{font-family:var(--font-head);font-size:18px;margin-bottom:16px;}
.modal label{display:block;font-size:12px;color:var(--muted);margin:12px 0 6px;font-family:var(--font-mono);}
.modal input[type=text], .modal select, .modal textarea{
  width:100%;background:var(--panel2);border:1px solid var(--border);border-radius:8px;
  padding:10px 12px;color:var(--text);font-family:var(--font-body);font-size:14px;
}
.modal textarea{resize:vertical;min-height:60px;}
.modal-actions{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;}
.modal-actions .btn{flex:1;min-width:100px;text-align:center;}
.close-modal{position:absolute;top:16px;right:16px;background:none;border:none;color:var(--muted);font-size:22px;cursor:pointer;}
.modal{position:relative;}

/* Preview modal */
.preview-content{width:100%;max-height:60vh;display:flex;align-items:center;justify-content:center;background:var(--panel2);border-radius:10px;overflow:hidden;margin-bottom:16px;}
.preview-content img{max-width:100%;max-height:60vh;object-fit:contain;}
.preview-content iframe{width:100%;height:60vh;border:none;}

.action-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}
.action-grid button{
  background:var(--panel2);border:1px solid var(--border);color:var(--text);
  border-radius:10px;padding:12px 6px;font-size:12px;font-family:var(--font-body);cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:4px;
}
.action-grid button:active{background:var(--red-dim);}
.action-grid .icon{font-size:18px;}

/* Drag overlay */
#dropzone{
  position:fixed;inset:0;background:rgba(226,52,47,0.15);border:3px dashed var(--red);
  display:none;align-items:center;justify-content:center;z-index:200;font-family:var(--font-head);font-size:20px;color:var(--red);
}
#dropzone.active{display:flex;}

.toast{
  position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
  background:var(--panel2);border:1px solid var(--border);padding:10px 18px;border-radius:30px;
  font-size:13px;z-index:300;opacity:0;transition:opacity .2s;pointer-events:none;
}
.toast.show{opacity:1;}

.progress-wrap{margin-top:14px;display:none;}
.progress-bar{height:6px;background:var(--panel2);border-radius:10px;overflow:hidden;}
.progress-fill{height:100%;background:var(--red);width:0%;transition:width .15s;}
</style>
</head>
<body>

<header>
  <h1>My <span>Documents</span></h1>
  <div class="subtitle" id="stats">loading...</div>
  <div class="toolbar">
    <input type="text" id="search" class="search-box" placeholder="Search by name or note...">
    <select id="categoryFilter"><option value="">All Categories</option></select>
    <div class="view-toggle">
      <button id="gridBtn" class="active" onclick="setView('grid')">▦</button>
      <button id="listBtn" onclick="setView('list')">☰</button>
    </div>
  </div>
</header>

<main>
  <div id="grid"></div>
  <div class="empty-state" id="emptyState" style="display:none;">No documents yet. Tap + to upload.</div>
</main>

<button class="fab" onclick="openUploadModal()">+</button>

<!-- Upload Modal -->
<div class="modal-overlay" id="uploadOverlay">
  <div class="modal">
    <button class="close-modal" onclick="closeModal('uploadOverlay')">&times;</button>
    <h2>Upload Document</h2>
    <input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" style="width:100%;color:var(--muted);">
    <label>Category</label>
    <input type="text" id="uploadCategory" placeholder="e.g. CTET, Certificates" list="categoryList">
    <datalist id="categoryList"></datalist>
    <label>Note / Description (optional)</label>
    <textarea id="uploadDescription" placeholder="Add a note..."></textarea>
    <div class="progress-wrap" id="progressWrap">
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="doUpload()" style="width:100%;">Upload</button>
    </div>
  </div>
</div>

<!-- Preview / Actions Modal -->
<div class="modal-overlay" id="previewOverlay">
  <div class="modal">
    <button class="close-modal" onclick="closeModal('previewOverlay')">&times;</button>
    <h2 id="previewTitle" style="font-size:15px;word-break:break-word;padding-right:24px;"></h2>
    <div class="preview-content" id="previewContent"></div>
    <div class="action-grid">
      <button onclick="shareCurrentFile()"><span class="icon">📤</span>Share</button>
      <button onclick="downloadCurrentFile()"><span class="icon">⬇️</span>Download</button>
      <button onclick="openRenameModal()"><span class="icon">✏️</span>Rename</button>
      <button onclick="openMoveModal()"><span class="icon">📁</span>Move</button>
      <button onclick="openNoteModal()"><span class="icon">📝</span>Edit Note</button>
      <button onclick="deleteCurrentFile()" style="color:var(--red);"><span class="icon">🗑️</span>Delete</button>
    </div>
  </div>
</div>

<!-- Rename Modal -->
<div class="modal-overlay" id="renameOverlay">
  <div class="modal">
    <button class="close-modal" onclick="closeModal('renameOverlay')">&times;</button>
    <h2>Rename</h2>
    <input type="text" id="renameInput">
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="submitRename()" style="width:100%;">Save</button>
    </div>
  </div>
</div>

<!-- Move Modal -->
<div class="modal-overlay" id="moveOverlay">
  <div class="modal">
    <button class="close-modal" onclick="closeModal('moveOverlay')">&times;</button>
    <h2>Move to Category</h2>
    <input type="text" id="moveInput" list="categoryList" placeholder="Category name">
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="submitMove()" style="width:100%;">Save</button>
    </div>
  </div>
</div>

<!-- Note Modal -->
<div class="modal-overlay" id="noteOverlay">
  <div class="modal">
    <button class="close-modal" onclick="closeModal('noteOverlay')">&times;</button>
    <h2>Edit Note</h2>
    <textarea id="noteInput" style="min-height:100px;"></textarea>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="submitNote()" style="width:100%;">Save</button>
    </div>
  </div>
</div>

<div id="dropzone">Drop file to upload</div>
<div class="toast" id="toast"></div>

<script>
let documents = [];
let currentView = 'grid';
let currentDoc = null;

async function fetchDocs(){
  const res = await fetch('api.php?action=list');
  const data = await res.json();
  documents = data.documents || [];
  renderCategories();
  renderGrid();
}

function renderCategories(){
  const cats = [...new Set(documents.map(d => d.category))].sort();
  const filterSel = document.getElementById('categoryFilter');
  const currentVal = filterSel.value;
  filterSel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  filterSel.value = currentVal;

  const list = document.getElementById('categoryList');
  list.innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
}

function esc(s){
  return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function formatSize(bytes){
  if(bytes < 1024) return bytes + ' B';
  if(bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

function formatDate(ts){
  const d = new Date(ts*1000);
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'});
}

function renderGrid(){
  const search = document.getElementById('search').value.toLowerCase();
  const catFilter = document.getElementById('categoryFilter').value;

  let filtered = documents.filter(d => {
    const matchSearch = !search || d.originalName.toLowerCase().includes(search) || (d.description||'').toLowerCase().includes(search);
    const matchCat = !catFilter || d.category === catFilter;
    return matchSearch && matchCat;
  });

  const grid = document.getElementById('grid');
  const empty = document.getElementById('emptyState');

  if(filtered.length === 0){
    grid.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = filtered.map(d => `
      <div class="card" onclick="openPreview('${d.id}')">
        <div class="thumb">
          ${d.type === 'image'
            ? `<img src="file.php?id=${d.id}&mode=view" loading="lazy">`
            : `<div class="pdf-icon">📄<span>PDF</span></div>`}
        </div>
        <div class="card-info">
          <button class="quick-edit" onclick="quickRename(event,'${d.id}')">✏️</button>
          <div class="card-name">${esc(d.originalName)}</div>
          <div class="card-meta"><span>${formatSize(d.size)}</span><span>${formatDate(d.uploadedAt)}</span></div>
          <span class="tag-pill">${esc(d.category)}</span>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('stats').textContent = `${documents.length} document${documents.length!==1?'s':''} stored`;
}

function setView(v){
  currentView = v;
  document.getElementById('grid').className = v === 'list' ? 'list-mode' : '';
  document.getElementById('gridBtn').classList.toggle('active', v==='grid');
  document.getElementById('listBtn').classList.toggle('active', v==='list');
}

document.getElementById('search').addEventListener('input', renderGrid);
document.getElementById('categoryFilter').addEventListener('change', renderGrid);

function openModal(id){ document.getElementById(id).classList.add('active'); }
function closeModal(id){ document.getElementById(id).classList.remove('active'); }

function openUploadModal(){
  document.getElementById('fileInput').value = '';
  document.getElementById('uploadCategory').value = '';
  document.getElementById('uploadDescription').value = '';
  document.getElementById('progressWrap').style.display = 'none';
  document.getElementById('progressFill').style.width = '0%';
  openModal('uploadOverlay');
}

async function uploadFile(file, category, description){
  const formData = new FormData();
  formData.append('action', 'upload');
  formData.append('file', file);
  formData.append('category', category || 'General');
  formData.append('description', description || '');

  document.getElementById('progressWrap').style.display = 'block';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'api.php');
    xhr.upload.onprogress = (e) => {
      if(e.lengthComputable){
        const pct = (e.loaded/e.total)*100;
        document.getElementById('progressFill').style.width = pct + '%';
      }
    };
    xhr.onload = () => {
      try{ resolve(JSON.parse(xhr.responseText)); }
      catch(err){ reject(err); }
    };
    xhr.onerror = reject;
    xhr.send(formData);
  });
}

async function doUpload(){
  const fileInput = document.getElementById('fileInput');
  if(!fileInput.files.length){ showToast('Choose a file first'); return; }
  const category = document.getElementById('uploadCategory').value;
  const description = document.getElementById('uploadDescription').value;

  const result = await uploadFile(fileInput.files[0], category, description);
  if(result.ok){
    closeModal('uploadOverlay');
    showToast('Uploaded successfully');
    fetchDocs();
  } else {
    showToast(result.error || 'Upload failed');
  }
}

function openPreview(id){
  currentDoc = documents.find(d => d.id === id);
  if(!currentDoc) return;
  document.getElementById('previewTitle').textContent = currentDoc.originalName;
  const content = document.getElementById('previewContent');
  if(currentDoc.type === 'image'){
    content.innerHTML = `<img src="file.php?id=${currentDoc.id}&mode=view">`;
  } else {
    content.innerHTML = `<iframe src="file.php?id=${currentDoc.id}&mode=view"></iframe>`;
  }
  openModal('previewOverlay');
}

function downloadCurrentFile(){
  if(!currentDoc) return;
  window.location.href = `file.php?id=${currentDoc.id}&mode=download`;
}

async function shareCurrentFile(){
  if(!currentDoc) return;
  try{
    const res = await fetch(`file.php?id=${currentDoc.id}&mode=download`);
    const blob = await res.blob();
    const file = new File([blob], currentDoc.originalName, {type: blob.type});

    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({
        files: [file],
        title: currentDoc.originalName,
        text: currentDoc.description || currentDoc.originalName
      });
    } else if(navigator.share){
      await navigator.share({
        title: currentDoc.originalName,
        text: currentDoc.originalName + ' - ' + window.location.origin + `/file.php?id=${currentDoc.id}&mode=download`
      });
    } else {
      showToast('Sharing not supported, use Download instead');
    }
  } catch(err){
    if(err.name !== 'AbortError') showToast('Share failed or cancelled');
  }
}

function openRenameModal(){
  if(!currentDoc) return;
  document.getElementById('renameInput').value = currentDoc.originalName;
  openModal('renameOverlay');
}

// Quick rename directly from card, without opening preview
function quickRename(event, id){
  event.stopPropagation();
  currentDoc = documents.find(d => d.id === id);
  if(!currentDoc) return;
  document.getElementById('renameInput').value = currentDoc.originalName;
  openModal('renameOverlay');
}

async function submitRename(){
  const newName = document.getElementById('renameInput').value.trim();
  if(!newName || !currentDoc) return;
  const formData = new FormData();
  formData.append('action','rename');
  formData.append('id', currentDoc.id);
  formData.append('newName', newName);
  const res = await fetch('api.php', {method:'POST', body:formData});
  const result = await res.json();
  if(result.ok){
    closeModal('renameOverlay');
    closeModal('previewOverlay');
    showToast('Renamed');
    fetchDocs();
  } else showToast(result.error || 'Failed');
}

function openMoveModal(){
  if(!currentDoc) return;
  document.getElementById('moveInput').value = currentDoc.category;
  openModal('moveOverlay');
}

async function submitMove(){
  const category = document.getElementById('moveInput').value.trim();
  if(!category || !currentDoc) return;
  const formData = new FormData();
  formData.append('action','move');
  formData.append('id', currentDoc.id);
  formData.append('category', category);
  const res = await fetch('api.php', {method:'POST', body:formData});
  const result = await res.json();
  if(result.ok){
    closeModal('moveOverlay');
    closeModal('previewOverlay');
    showToast('Moved');
    fetchDocs();
  } else showToast(result.error || 'Failed');
}

function openNoteModal(){
  if(!currentDoc) return;
  document.getElementById('noteInput').value = currentDoc.description || '';
  openModal('noteOverlay');
}

async function submitNote(){
  const description = document.getElementById('noteInput').value.trim();
  if(!currentDoc) return;
  const formData = new FormData();
  formData.append('action','update_description');
  formData.append('id', currentDoc.id);
  formData.append('description', description);
  const res = await fetch('api.php', {method:'POST', body:formData});
  const result = await res.json();
  if(result.ok){
    closeModal('noteOverlay');
    closeModal('previewOverlay');
    showToast('Note saved');
    fetchDocs();
  } else showToast(result.error || 'Failed');
}

async function deleteCurrentFile(){
  if(!currentDoc) return;
  if(!confirm(`Delete "${currentDoc.originalName}"? This cannot be undone.`)) return;
  const formData = new FormData();
  formData.append('action','delete');
  formData.append('id', currentDoc.id);
  const res = await fetch('api.php', {method:'POST', body:formData});
  const result = await res.json();
  if(result.ok){
    closeModal('previewOverlay');
    showToast('Deleted');
    fetchDocs();
  } else showToast(result.error || 'Failed');
}

let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Drag and drop upload
const dropzone = document.getElementById('dropzone');
let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  dropzone.classList.add('active');
});
document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if(dragCounter <= 0) dropzone.classList.remove('active');
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', async (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropzone.classList.remove('active');
  if(e.dataTransfer.files.length){
    const result = await uploadFile(e.dataTransfer.files[0], 'General', '');
    if(result.ok){ showToast('Uploaded'); fetchDocs(); }
    else showToast(result.error || 'Upload failed');
  }
});

fetchDocs();
</script>

</body>
</html>
