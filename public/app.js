/* Quick PDF Tools - shared script for the homepage and all tool pages.
   File location: public/app.js */

const $ = (id) => document.getElementById(id);
const IS_TOOL_PAGE = Boolean(window.INITIAL_TOOL);
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const PDFLIB_URL = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* ---------- Tools that work ---------- */
const toolConfig = {
  jpgpdf: {
    title: 'JPG to PDF', mini: '▧', icon: '▧', path: '/jpg-to-pdf',
    desc: 'Convert one or more images into a single PDF document.',
    accept: 'image/jpeg,image/png,image/webp', multiple: true,
    drop: 'Drag & drop your images here',
    sub: 'JPG, PNG, or WEBP · Select multiple images at once',
    button: 'Convert to PDF →', options: ['pageSize']
  },
  pdfjpg: {
    title: 'PDF to JPG', mini: '▤', icon: '▤', path: '/pdf-to-jpg',
    desc: 'Convert each PDF page into a JPG image you can preview and download.',
    accept: 'application/pdf,.pdf', multiple: true,
    drop: 'Drag & drop your PDF files here',
    sub: 'PDF files only · Each page becomes a JPG image',
    button: 'Convert to JPG →', options: []
  },
  merge: {
    title: 'Merge PDF', mini: '＋', icon: '＋', path: '/merge-pdf',
    desc: 'Combine multiple PDF documents into one file.',
    accept: 'application/pdf,.pdf', multiple: true,
    drop: 'Drag & drop PDF files here',
    sub: 'PDF files only · Select at least two documents',
    button: 'Merge PDFs →', options: []
  },
  compress: {
    title: 'Compress PDF', mini: '⇩', icon: '⇩', path: '/compress-pdf',
    desc: 'Reduce file size by turning each page into an optimized image.',
    accept: 'application/pdf,.pdf', multiple: false,
    drop: 'Choose a PDF to compress',
    sub: 'PDF files only · Text in the result cannot be selected',
    button: 'Compress PDF →', options: []
  },
  split: {
    title: 'Split PDF', mini: '✂', icon: '✂', path: '/split-pdf',
    desc: 'Save page ranges as separate PDF files. Example: 1-3,4-6 makes two files.',
    accept: 'application/pdf,.pdf', multiple: false,
    drop: 'Choose a PDF to split',
    sub: 'PDF files only · Enter page ranges below',
    button: 'Split PDF →', options: ['range'], placeholder: '1-3,4-6'
  },
  rotate: {
    title: 'Rotate PDF', mini: '⟳', icon: '⟳', path: null,
    desc: 'Rotate all pages of a PDF by 90 degrees.',
    accept: 'application/pdf,.pdf', multiple: false,
    drop: 'Choose a PDF to rotate', sub: 'PDF files only',
    button: 'Rotate PDF →', options: []
  },
  organize: {
    title: 'Organize Pages', mini: '▦', icon: '▦', path: null,
    desc: 'Create a PDF with pages in the order you type, for example 3,1,2.',
    accept: 'application/pdf,.pdf', multiple: false,
    drop: 'Choose a PDF', sub: 'PDF files only · Enter pages in the order you want',
    button: 'Organize Pages →', options: ['range'], placeholder: '3,1,2'
  },
  delete: {
    title: 'Delete PDF Pages', mini: '⌫', icon: '⌫', path: null,
    desc: 'Remove the page numbers or ranges you enter.',
    accept: 'application/pdf,.pdf', multiple: false,
    drop: 'Choose a PDF', sub: 'PDF files only · Enter pages to remove below',
    button: 'Delete Pages →', options: ['range'], placeholder: '2,5-7'
  },
  extract: {
    title: 'Extract PDF Pages', mini: '⇱', icon: '⇱', path: null,
    desc: 'Keep only the page numbers or ranges you enter.',
    accept: 'application/pdf,.pdf', multiple: false,
    drop: 'Choose a PDF', sub: 'PDF files only · Enter pages to keep below',
    button: 'Extract Pages →', options: ['range'], placeholder: '1,3-5'
  },
  watermark: {
    title: 'Add Watermark', mini: '◈', icon: '◈', path: null,
    desc: 'Stamp text across every page of a PDF.',
    accept: 'application/pdf,.pdf', multiple: false,
    drop: 'Choose a PDF', sub: 'PDF files only · Enter watermark text below',
    button: 'Add Watermark →', options: ['watermark']
  },
  numbers: {
    title: 'Page Numbers', mini: '№', icon: '№', path: null,
    desc: 'Add page numbers to the bottom of each PDF page.',
    accept: 'application/pdf,.pdf', multiple: false,
    drop: 'Choose a PDF', sub: 'PDF files only',
    button: 'Add Page Numbers →', options: []
  }
};

/* Homepage tool cards */
const toolData = [
  { name: 'Merge PDF', desc: 'Combine multiple PDFs', icon: '▤', color: 'red', key: 'merge' },
  { name: 'Split PDF', desc: 'Save page ranges as new PDFs', icon: '✂', color: 'orange', key: 'split' },
  { name: 'Compress PDF', desc: 'Reduce file size', icon: '⇩', color: 'green', key: 'compress' },
  { name: 'PDF to JPG', desc: 'Convert PDF pages to images', icon: '▧', color: 'purple', key: 'pdfjpg' },
  { name: 'JPG to PDF', desc: 'Convert images to PDF', icon: '▧', color: 'orange', key: 'jpgpdf' },
  { name: 'Rotate PDF', desc: 'Rotate PDF pages', icon: '⟳', color: 'cyan', key: 'rotate' },
  { name: 'Organize Pages', desc: 'Reorder PDF pages', icon: '▦', color: 'purple', key: 'organize' },
  { name: 'Delete PDF Pages', desc: 'Remove unwanted pages', icon: '⌫', color: 'pink', key: 'delete' },
  { name: 'Extract PDF Pages', desc: 'Save selected pages', icon: '⇱', color: 'blue', key: 'extract' },
  { name: 'Add Watermark', desc: 'Watermark your PDF', icon: '◈', color: 'purple', key: 'watermark' },
  { name: 'Page Numbers', desc: 'Number your pages', icon: '№', color: 'blue', key: 'numbers' }
];

/* ---------- State ---------- */
let activeTool = 'jpgpdf';
let selectedFiles = [];
let outputFiles = [];
let outputUrls = [];
let thumbUrls = [];
let libsPromise = null;
let toastTimer = null;

/* ---------- Small helpers ---------- */
function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}
function setDisplay(id, visible) {
  const el = $(id);
  if (el) el.style.display = visible ? '' : 'none';
}
function setStatus(text) {
  setText('engineStatus', text);
}
function setProgress(p) {
  const wrap = $('progressWrap');
  const bar = $('progressBar');
  if (wrap) wrap.style.display = 'block';
  if (bar) bar.style.width = p + '%';
}
function resetProgress() {
  const wrap = $('progressWrap');
  const bar = $('progressBar');
  if (wrap) wrap.style.display = 'none';
  if (bar) bar.style.width = '0%';
}
function toast(msg) {
  const el = $('toast');
  if (!el) { console.log(msg); return; }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function formatSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function currentPath() {
  return window.location.pathname.replace(/\/$/, '') || '/';
}
function keyForPath(path) {
  return Object.keys(toolConfig).find((k) => toolConfig[k].path === path);
}
function badgeFor(f) {
  return f.name.toLowerCase().endsWith('.pdf') ? 'PDF' : (f.name.split('.').pop() || 'FILE').toUpperCase();
}

/* ---------- Loading the PDF libraries (only when needed) ---------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('A required library could not load. Check your internet connection and try again.'));
    document.head.appendChild(s);
  });
}
function loadLibs() {
  if (!libsPromise) {
    libsPromise = (async () => {
      if (!window.PDFLib) await loadScript(PDFLIB_URL);
      if (!window.pdfjsLib) await loadScript(PDFJS_URL);
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    })().catch((err) => {
      libsPromise = null;
      throw err;
    });
  }
  return libsPromise;
}

/* ---------- Building the sidebar and settings (same on every page) ---------- */
function buildSidebar() {
  const sidebar = document.querySelector('.tool-sidebar');
  if (!sidebar) return;
  sidebar.querySelectorAll('.tool-choice').forEach((b) => b.remove());
  ['jpgpdf', 'pdfjpg', 'merge', 'compress', 'split'].forEach((key) => {
    const c = toolConfig[key];
    const btn = document.createElement('button');
    btn.className = 'tool-choice';
    btn.dataset.tool = key;
    const mini = document.createElement('span');
    mini.className = 'mini';
    mini.textContent = c.mini;
    btn.appendChild(mini);
    btn.appendChild(document.createTextNode(' ' + c.title));
    btn.addEventListener('click', () => openTool(key, false));
    sidebar.appendChild(btn);
  });
}
function buildSettings() {
  let box = $('settings');
  if (!box) {
    box = document.createElement('div');
    box.id = 'settings';
    const row = document.querySelector('.process-row');
    if (row) row.parentNode.insertBefore(box, row);
  }
  box.className = 'settings';
  box.innerHTML = `
    <label id="pageSizeLabel">PDF page size
      <select id="pageSize">
        <option value="fit">Fit to image</option>
        <option value="a4">A4 page</option>
        <option value="letter">Letter page</option>
      </select>
    </label>
    <label id="rangeLabel">Pages (e.g. 1,3-5)
      <input type="text" id="pageRange" placeholder="1,3-5" style="width:140px">
    </label>
    <label id="watermarkLabel">Watermark text
      <input type="text" id="watermarkText" placeholder="CONFIDENTIAL" style="width:160px">
    </label>`;
}

/* ---------- Choosing a tool ---------- */
function selectTool(key, updateUrl, shouldScroll) {
  const c = toolConfig[key];
  if (!c) return;
  activeTool = key;
  document.querySelectorAll('.tool-choice').forEach((b) => b.classList.toggle('active', b.dataset.tool === key));
  setText('activeTitle', c.title);
  setText('activeDesc', c.desc);
  setText('activeIcon', c.icon);
  setText('dropTitle', c.drop);
  setText('dropSub', c.sub);
  const pb = $('processBtn');
  if (pb) pb.textContent = c.button;
  const fi = $('fileInput');
  if (fi) {
    fi.accept = c.accept;
    fi.multiple = c.multiple;
    fi.value = '';
  }
  const showPageSize = c.options.includes('pageSize');
  const showRange = c.options.includes('range');
  const showWatermark = c.options.includes('watermark');
  const box = $('settings');
  if (box) box.style.display = (showPageSize || showRange || showWatermark) ? 'flex' : 'none';
  setDisplay('pageSizeLabel', showPageSize);
  setDisplay('rangeLabel', showRange);
  setDisplay('watermarkLabel', showWatermark);
  const pr = $('pageRange');
  if (pr) {
    pr.value = '';
    pr.placeholder = c.placeholder || '1,3-5';
  }
  const wt = $('watermarkText');
  if (wt) wt.value = '';
  selectedFiles = [];
  clearOutputs();
  renderFiles();
  setStatus('Ready to use');
  if (updateUrl && c.path) {
    try { history.pushState({ tool: key }, '', c.path); } catch (e) {}
  }
  if (shouldScroll && $('workspace')) {
    $('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
function openTool(key, shouldScroll) {
  const c = toolConfig[key];
  if (!c) return;
  // On a tool page, a tool that has its own page opens that page
  if (IS_TOOL_PAGE && c.path && currentPath() !== c.path) {
    window.location.href = c.path;
    return;
  }
  selectTool(key, !IS_TOOL_PAGE, shouldScroll);
}
function toolCardClick(e, key) {
  if (e) e.preventDefault();
  if (toolConfig[key]) openTool(key, true);
  else toast('This tool is not available yet.');
}

/* ---------- Homepage cards and search ---------- */
function card(t) {
  const c = toolConfig[t.key];
  const href = c && c.path ? c.path : '#workspace';
  return `<a href="${href}" class="tool-card" onclick="toolCardClick(event, '${t.key}')"><div class="tool-icon ${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p></a>`;
}
function showAllTools(e) {
  if (e) e.preventDefault();
  const sec = $('all-tools');
  if (!sec || !$('allGrid')) return;
  sec.hidden = false;
  $('allGrid').innerHTML = toolData.map(card).join('');
  sec.scrollIntoView({ behavior: 'smooth' });
}
function searchTools() {
  const input = $('toolSearch');
  const sec = $('all-tools');
  if (!input || !sec || !$('allGrid')) return;
  const q = input.value.trim().toLowerCase();
  sec.hidden = false;
  const found = toolData.filter((t) => (t.name + ' ' + t.desc).toLowerCase().includes(q));
  $('allGrid').innerHTML = found.map(card).join('') || '<p style="grid-column:1/-1;text-align:center;padding:20px;color:var(--muted)">No matching tools found.</p>';
  sec.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- Files ---------- */
function isAcceptedFile(f) {
  const name = f.name.toLowerCase();
  if (activeTool === 'jpgpdf') return f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/.test(name);
  return f.type === 'application/pdf' || name.endsWith('.pdf');
}
function addFiles(files) {
  if (!files || !files.length) return;
  const cfg = toolConfig[activeTool];
  let emptyCount = 0;
  let bigCount = 0;
  let wrongCount = 0;
  const valid = files.filter((f) => {
    if (f.size === 0) { emptyCount++; return false; }
    if (f.size > MAX_FILE_SIZE) { bigCount++; return false; }
    if (!isAcceptedFile(f)) { wrongCount++; return false; }
    return true;
  });
  if (emptyCount) toast('Empty (0 KB) files cannot be processed.');
  else if (bigCount) toast('A file is larger than the 100 MB limit.');
  else if (wrongCount) toast('Some files were skipped because they are the wrong type for this tool.');
  if (!valid.length) { updateProcessButton(); return; }
  selectedFiles = cfg.multiple ? [...selectedFiles, ...valid] : valid.slice(0, 1);
  renderFiles();
  clearOutputs();
  setStatus(selectedFiles.length + ' file(s) selected');
  updateProcessButton();
}
function revokeThumbUrls() {
  thumbUrls.forEach((u) => URL.revokeObjectURL(u));
  thumbUrls = [];
}
function renderFiles() {
  revokeThumbUrls();
  setText('fileCountBanner', selectedFiles.length ? `${selectedFiles.length} File(s) Selected` : '');
  updateProcessButton();
  const list = $('fileList');
  if (!list) return;
  const isImageTool = activeTool === 'jpgpdf';
  list.innerHTML = selectedFiles.map((f, i) => {
    const isImg = isImageTool && (f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name));
    let thumb = `<span class="file-badge">${escapeHtml(badgeFor(f))}</span>`;
    if (isImg) {
      const url = URL.createObjectURL(f);
      thumbUrls.push(url);
      thumb = `<img src="${url}" alt="preview" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:1px solid var(--line);">`;
    }
    const reorder = isImageTool && selectedFiles.length > 1
      ? `<div style="display:flex;gap:4px;"><button class="secondary" style="padding:4px 8px;font-size:12px;" onclick="moveFile(${i}, -1)" title="Move up">↑</button><button class="secondary" style="padding:4px 8px;font-size:12px;" onclick="moveFile(${i}, 1)" title="Move down">↓</button></div>`
      : '';
    return `<div class="file-row" style="align-items:center;gap:12px;">${thumb}<div class="file-meta"><strong title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</strong><small>${formatSize(f.size)}${isImg ? ' · Page ' + (i + 1) : ''}</small></div>${reorder}<button class="remove" aria-label="Remove file" onclick="removeFile(${i})">×</button></div>`;
  }).join('');
}
function moveFile(index, dir) {
  const n = index + dir;
  if (n < 0 || n >= selectedFiles.length) return;
  [selectedFiles[index], selectedFiles[n]] = [selectedFiles[n], selectedFiles[index]];
  renderFiles();
  clearOutputs();
}
function removeFile(i) {
  selectedFiles.splice(i, 1);
  renderFiles();
  clearOutputs();
  setStatus(selectedFiles.length ? selectedFiles.length + ' file(s) selected' : 'Ready to use');
}
function clearFiles() {
  selectedFiles = [];
  const fi = $('fileInput');
  if (fi) fi.value = '';
  renderFiles();
  clearOutputs();
}
function updateProcessButton() {
  const b = $('processBtn');
  if (b) b.disabled = selectedFiles.length === 0;
}
function clearOutputs() {
  outputFiles = [];
  outputUrls.forEach((u) => URL.revokeObjectURL(u));
  outputUrls = [];
  const r = $('result');
  if (r) r.style.display = 'none';
  const g = $('previewGrid');
  if (g) g.innerHTML = '';
}

/* ---------- Processing ---------- */
async function processFiles() {
  if (!selectedFiles.length) { toast('Please select file(s) first.'); return; }
  clearOutputs();
  setProgress(5);
  setStatus('Processing…');
  const pb = $('processBtn');
  if (pb) pb.disabled = true;
  try {
    await loadLibs();
    switch (activeTool) {
      case 'jpgpdf': await imagesToPdf(); break;
      case 'pdfjpg': await pdfToImages(); break;
      case 'merge': await mergePdfs(); break;
      case 'compress': await compressPdf(); break;
      case 'split': await splitPdf(); break;
      case 'rotate': await rotatePdf(); break;
      case 'organize': await pageOperation('organize'); break;
      case 'delete': await pageOperation('delete'); break;
      case 'extract': await pageOperation('extract'); break;
      case 'watermark': await watermarkPdf(); break;
      case 'numbers': await numberPdf(); break;
      default: throw new Error('This tool is not available.');
    }
    setProgress(100);
    showResult();
    addHistoryRecord(toolConfig[activeTool].title, selectedFiles.map((f) => f.name).join(', '));
    toast('Processing finished successfully!');
  } catch (err) {
    console.error(err);
    toast(err.message || 'Could not process files. Please check the file format.');
    setStatus('Needs attention');
  } finally {
    updateProcessButton();
  }
}
function showResult() {
  const r = $('result');
  if (r) r.style.display = 'block';
  setText('resultTitle', '✓ Conversion complete');
  setText('resultSub', outputFiles.length + ' result file(s) ready. Preview below and download when ready.');
  setStatus('Completed');
  renderPreviews();
}

async function loadPdf(file) {
  try {
    return await PDFLib.PDFDocument.load(await file.arrayBuffer());
  } catch (e) {
    throw new Error(`"${file.name}" is password-protected, damaged, or not a valid PDF.`);
  }
}
async function openPdfJs(file) {
  try {
    return await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  } catch (e) {
    throw new Error(`"${file.name}" is password-protected, damaged, or not a valid PDF.`);
  }
}
async function savePdf(doc, name) {
  const bytes = await doc.save();
  outputFiles = [{ name, blob: new Blob([bytes], { type: 'application/pdf' }), type: 'pdf' }];
}

async function embedViaCanvas(pdf, file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close();
  const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return pdf.embedPng(await png.arrayBuffer());
}
async function imagesToPdf() {
  const pdf = await PDFLib.PDFDocument.create();
  const size = $('pageSize') ? $('pageSize').value : 'fit';
  for (let i = 0; i < selectedFiles.length; i++) {
    const f = selectedFiles[i];
    const bytes = await f.arrayBuffer();
    let img;
    try {
      const isJpg = /jpe?g/i.test(f.type) || /\.jpe?g$/i.test(f.name);
      const isPng = f.type === 'image/png' || /\.png$/i.test(f.name);
      if (isJpg) img = await pdf.embedJpg(bytes);
      else if (isPng) img = await pdf.embedPng(bytes);
      else img = await embedViaCanvas(pdf, f);
    } catch (err) {
      throw new Error(`Could not read the image "${f.name}". It may be damaged or unsupported.`);
    }
    const w = img.width;
    const h = img.height;
    if (size === 'a4' || size === 'letter') {
      const pageW = size === 'a4' ? 595.28 : 612;
      const pageH = size === 'a4' ? 841.89 : 792;
      const scale = Math.min(pageW / w, pageH / h);
      const dw = w * scale;
      const dh = h * scale;
      const page = pdf.addPage([pageW, pageH]);
      page.drawImage(img, { x: (pageW - dw) / 2, y: (pageH - dh) / 2, width: dw, height: dh });
    } else {
      const page = pdf.addPage([w, h]);
      page.drawImage(img, { x: 0, y: 0, width: w, height: h });
    }
    setProgress(10 + Math.round(((i + 1) / selectedFiles.length) * 80));
  }
  const bytes = await pdf.save();
  outputFiles = [{ name: 'quick-pdf-converted.pdf', blob: new Blob([bytes], { type: 'application/pdf' }), type: 'pdf' }];
}
async function pdfToImages() {
  outputFiles = [];
  for (let fi = 0; fi < selectedFiles.length; fi++) {
    const f = selectedFiles[fi];
    const doc = await openPdfJs(f);
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      outputFiles.push({
        name: `${f.name.replace(/\.pdf$/i, '')}-page-${p}.jpg`,
        blob,
        type: 'image',
        preview: canvas.toDataURL('image/jpeg', 0.8)
      });
      setProgress(10 + Math.round(((fi + p / doc.numPages) / selectedFiles.length) * 80));
    }
  }
}
async function mergePdfs() {
  if (selectedFiles.length < 2) throw new Error('Select at least two PDF files to merge.');
  const merged = await PDFLib.PDFDocument.create();
  for (let i = 0; i < selectedFiles.length; i++) {
    const src = await loadPdf(selectedFiles[i]);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    setProgress(10 + Math.round(((i + 1) / selectedFiles.length) * 80));
  }
  await savePdf(merged, 'merged-document.pdf');
}
async function compressPdf() {
  const source = await openPdfJs(selectedFiles[0]);
  const out = await PDFLib.PDFDocument.create();
  for (let i = 1; i <= source.numPages; i++) {
    const page = await source.getPage(i);
    const viewport = page.getViewport({ scale: 1.25 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
    const img = await out.embedJpg(await blob.arrayBuffer());
    const pdfPage = out.addPage([img.width, img.height]);
    pdfPage.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    setProgress(10 + Math.round((i / source.numPages) * 80));
  }
  await savePdf(out, 'compressed-optimized.pdf');
}
function parseOnePart(part, total) {
  const bits = part.trim().split('-').map((x) => Number(x.trim()));
  if (bits.length > 2 || bits.some((n) => !Number.isInteger(n) || n < 1 || n > total)) {
    throw new Error(`Invalid page "${part.trim()}". Valid pages are 1 to ${total}.`);
  }
  const from = bits[0];
  const to = bits.length === 2 ? bits[1] : from;
  if (to < from) throw new Error('In a range, the first page must be smaller than the last page.');
  const list = [];
  for (let n = from; n <= to; n++) list.push(n - 1);
  return list;
}
function parsePages(text, total, keepOrder) {
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) throw new Error(`Enter page numbers or ranges, e.g. 1,3-5. Valid pages are 1 to ${total}.`);
  let list = [];
  parts.forEach((p) => { list = list.concat(parseOnePart(p, total)); });
  if (!keepOrder) list = [...new Set(list)].sort((a, b) => a - b);
  return list;
}
async function pageOperation(mode) {
  const src = await loadPdf(selectedFiles[0]);
  const total = src.getPageCount();
  let indexes = parsePages($('pageRange').value, total, mode === 'organize');
  if (mode === 'delete') {
    indexes = Array.from({ length: total }, (_, i) => i).filter((i) => !indexes.includes(i));
  }
  if (!indexes.length) throw new Error('The result would be an empty PDF. Change the page numbers.');
  const out = await PDFLib.PDFDocument.create();
  const pages = await out.copyPages(src, indexes);
  pages.forEach((p) => out.addPage(p));
  const names = { extract: 'extracted-pages.pdf', delete: 'pages-removed.pdf', organize: 'organized-pages.pdf' };
  await savePdf(out, names[mode]);
}
async function splitPdf() {
  const src = await loadPdf(selectedFiles[0]);
  const total = src.getPageCount();
  const parts = $('pageRange').value.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) throw new Error('Enter page ranges, e.g. 1-3,4-6.');
  outputFiles = [];
  for (let i = 0; i < parts.length; i++) {
    const indexes = parsePages(parts[i], total, true);
    const out = await PDFLib.PDFDocument.create();
    const pages = await out.copyPages(src, indexes);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    outputFiles.push({
      name: `split-${i + 1}-${parts[i].replace(/\s+/g, '')}.pdf`,
      blob: new Blob([bytes], { type: 'application/pdf' }),
      type: 'pdf'
    });
    setProgress(10 + Math.round(((i + 1) / parts.length) * 80));
  }
}
async function rotatePdf() {
  const doc = await loadPdf(selectedFiles[0]);
  doc.getPages().forEach((p) => p.setRotation(PDFLib.degrees((p.getRotation().angle + 90) % 360)));
  await savePdf(doc, 'rotated.pdf');
}
async function watermarkPdf() {
  const text = $('watermarkText').value.trim();
  if (!text) throw new Error('Enter watermark text first.');
  const doc = await loadPdf(selectedFiles[0]);
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  try {
    doc.getPages().forEach((p) => {
      const { width, height } = p.getSize();
      p.drawText(text, {
        x: width * 0.12,
        y: height * 0.48,
        size: Math.max(18, Math.min(width, height) * 0.055),
        font,
        color: PDFLib.rgb(0.65, 0.65, 0.65),
        rotate: PDFLib.degrees(35),
        opacity: 0.35
      });
    });
  } catch (e) {
    throw new Error('Watermark text can use only English letters, numbers and simple symbols.');
  }
  await savePdf(doc, 'watermarked.pdf');
}
async function numberPdf() {
  const doc = await loadPdf(selectedFiles[0]);
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  doc.getPages().forEach((p, i) => {
    const { width } = p.getSize();
    p.drawText(String(i + 1), { x: width / 2 - 5, y: 18, size: 10, font, color: PDFLib.rgb(0.25, 0.25, 0.25) });
  });
  await savePdf(doc, 'numbered-pages.pdf');
}

/* ---------- Results and previews ---------- */
function drawPreviewFallback(canvas) {
  canvas.width = 500;
  canvas.height = 650;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 500, 650);
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('PDF', 185, 300);
  ctx.fillStyle = '#475569';
  ctx.font = '20px sans-serif';
  ctx.fillText('Preview unavailable', 130, 350);
}
async function renderPdfPreview(blob, canvas) {
  await loadLibs();
  const doc = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(500 / base.width, 650 / base.height) });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
}
function renderPreviews() {
  outputUrls.forEach((u) => URL.revokeObjectURL(u));
  outputUrls = [];
  const grid = $('previewGrid');
  if (!grid) return;
  grid.innerHTML = '';
  outputFiles.forEach((f) => {
    const url = URL.createObjectURL(f.blob);
    outputUrls.push(url);
    const item = document.createElement('div');
    item.className = 'preview-item';
    if (f.type === 'image') {
      const img = document.createElement('img');
      img.src = f.preview || url;
      img.alt = f.name;
      item.appendChild(img);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 650;
      item.appendChild(canvas);
      renderPdfPreview(f.blob, canvas).catch(() => drawPreviewFallback(canvas));
    }
    const name = document.createElement('div');
    name.className = 'preview-name';
    name.textContent = f.name;
    item.appendChild(name);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    a.textContent = 'Download';
    item.appendChild(a);
    grid.appendChild(item);
  });
}
function downloadAll() {
  if (!outputFiles.length) return;
  if (outputFiles.length === 1) {
    downloadBlob(outputFiles[0].blob, outputFiles[0].name);
    return;
  }
  outputFiles.forEach((f, i) => setTimeout(() => downloadBlob(f.blob, f.name), i * 250));
  toast('Download started for ' + outputFiles.length + ' files.');
}

/* ---------- History ---------- */
function readHistory() {
  try { return JSON.parse(localStorage.getItem('qpt_history') || '[]'); } catch (e) { return []; }
}
function writeHistory(list) {
  try { localStorage.setItem('qpt_history', JSON.stringify(list)); } catch (e) {}
}
function addHistoryRecord(tool, file) {
  const list = readHistory();
  list.unshift({ tool, file, date: new Date().toLocaleString(), status: 'Completed' });
  writeHistory(list.slice(0, 50));
}
function renderHistoryList() {
  const box = $('historyList');
  if (!box) return;
  const list = readHistory();
  if (!list.length) {
    box.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;font-size:13px;">No history yet.</p>';
    return;
  }
  box.innerHTML = list.map((item, i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card);"><div><strong style="font-size:13px;font-weight:700;">${escapeHtml(item.tool)}</strong><small style="color:var(--muted);font-size:11px;display:block;margin-top:2px;word-break:break-all;">${escapeHtml(item.file)}</small><span style="color:var(--muted);font-size:10px;display:block;margin-top:1px;">${escapeHtml(item.date)}</span></div><button class="remove" aria-label="Delete record" onclick="deleteHistoryItem(${i})">×</button></div>`).join('');
}
function deleteHistoryItem(i) {
  const list = readHistory();
  list.splice(i, 1);
  writeHistory(list);
  renderHistoryList();
  toast('History item deleted.');
}
function clearAllHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    try { localStorage.removeItem('qpt_history'); } catch (e) {}
    renderHistoryList();
    toast('All history cleared.');
  }
}

/* ---------- Modals ---------- */
function openModal(id, e) {
  if (e) e.preventDefault();
  const m = $(id);
  if (m) m.style.display = 'grid';
}
function closeModal(id) {
  const m = $(id);
  if (m) m.style.display = 'none';
}
function openHistory(e) {
  if (e) e.preventDefault();
  const nav = $('nav');
  if (nav) nav.classList.remove('open');
  renderHistoryList();
  openModal('historyModal');
}
function closeHistory() { closeModal('historyModal'); }
function openPrivacy(e) { openModal('privacyModal', e); }
function closePrivacy() { closeModal('privacyModal'); }
function openTerms(e) { openModal('termsModal', e); }
function closeTerms() { closeModal('termsModal'); }
function openDisclaimer(e) { openModal('disclaimerModal', e); }
function closeDisclaimer() { closeModal('disclaimerModal'); }

/* ---------- Theme, menu, service worker ---------- */
function setupTheme() {
  const btn = $('themeBtn');
  if (!btn) return;
  const apply = (dark) => {
    document.body.classList.toggle('dark', dark);
    btn.textContent = dark ? '☀' : '☾';
  };
  let saved = '0';
  try { saved = localStorage.getItem('qpt-dark') || '0'; } catch (e) {}
  apply(saved === '1');
  btn.onclick = () => {
    const dark = !document.body.classList.contains('dark');
    apply(dark);
    try { localStorage.setItem('qpt-dark', dark ? '1' : '0'); } catch (e) {}
  };
}
function setupMenu() {
  const b = $('menuBtn');
  if (b) b.onclick = () => { const n = $('nav'); if (n) n.classList.toggle('open'); };
}
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

/* ---------- Wiring the workspace buttons ---------- */
function wireWorkspace() {
  const fi = $('fileInput');
  const dz = $('dropZone');
  if ($('chooseBtn') && fi) $('chooseBtn').onclick = () => fi.click();
  if (fi) {
    fi.addEventListener('change', (e) => {
      const files = [...e.target.files];
      e.target.value = '';
      addFiles(files);
    });
  }
  if ($('clearBtn')) $('clearBtn').onclick = () => clearFiles();
  if ($('resetBtn')) {
    $('resetBtn').onclick = () => {
      clearFiles();
      resetProgress();
      setStatus('Ready to use');
    };
  }
  if ($('processBtn')) $('processBtn').onclick = processFiles;
  if ($('downloadAllBtn')) $('downloadAllBtn').onclick = downloadAll;
  if (dz) {
    ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
    dz.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));
  }
}

/* ---------- Start ---------- */
function init() {
  buildSidebar();
  buildSettings();
  const pop = $('popularGrid');
  if (pop) pop.innerHTML = toolData.slice(0, 10).map(card).join('');
  wireWorkspace();
  setupTheme();
  setupMenu();
  registerServiceWorker();
  const si = $('toolSearch');
  if (si) si.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchTools(); });
  window.addEventListener('popstate', () => {
    const k = keyForPath(currentPath());
    if (k) selectTool(k, false, false);
  });
  const start = IS_TOOL_PAGE ? window.INITIAL_TOOL : (keyForPath(currentPath()) || 'jpgpdf');
  selectTool(toolConfig[start] ? start : 'jpgpdf', false, false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
