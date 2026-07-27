import {
  QUALITIES,
  extractVideoId,
  thumbnailUrl,
  cleanVideoTitle,
  isPlaceholder,
} from './common.js';
import { downloadThumbnail } from './download.js';

const els = {
  preview: document.getElementById('preview'),
  previewEmpty: document.getElementById('previewEmpty'),
  title: document.getElementById('title'),
  videoId: document.getElementById('videoId'),
  urlInput: document.getElementById('urlInput'),
  formatSeg: document.getElementById('formatSeg'),
  saveAs: document.getElementById('saveAs'),
  best: document.getElementById('best'),
  list: document.getElementById('list'),
  status: document.getElementById('status'),
};

const state = {
  videoId: null,
  title: '',
  format: 'jpg',
  saveAs: false,
  // quality キー -> true(利用可) / false(この動画には無い) / null(確認中)
  available: {},
};

// ---------------------------------------------------------------- 起動

init();

async function init() {
  await loadSettings();

  const tab = await activeTab();
  const idFromTab = extractVideoId(tab?.url);

  if (idFromTab) {
    setVideo(idFromTab, cleanVideoTitle(tab.title));
  } else {
    setStatus('YouTube の動画ページを開くか、下に URL を貼り付けてください');
    els.urlInput.focus();
  }

  bindEvents();
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function loadSettings() {
  const stored = await chrome.storage.local.get({ format: 'jpg', saveAs: false });
  state.format = stored.format === 'webp' ? 'webp' : 'jpg';
  state.saveAs = Boolean(stored.saveAs);

  els.saveAs.checked = state.saveAs;
  for (const button of els.formatSeg.querySelectorAll('button')) {
    button.classList.toggle('on', button.dataset.format === state.format);
  }
}

function bindEvents() {
  els.formatSeg.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    state.format = button.dataset.format;
    chrome.storage.local.set({ format: state.format });
    for (const other of els.formatSeg.querySelectorAll('button')) {
      other.classList.toggle('on', other === button);
    }
    if (state.videoId) refreshAvailability();
  });

  els.saveAs.addEventListener('change', () => {
    state.saveAs = els.saveAs.checked;
    chrome.storage.local.set({ saveAs: state.saveAs });
  });

  els.urlInput.addEventListener('input', () => {
    const id = extractVideoId(els.urlInput.value);
    if (!id || id === state.videoId) return;
    // 貼り付けた動画にはタイトルが無いので、ファイル名は ID だけになる。
    setVideo(id, '');
    setStatus('');
  });

  els.best.addEventListener('click', () => {
    const best = QUALITIES.find((q) => state.available[q.key] === true);
    if (best) download(best.key);
  });
}

// ---------------------------------------------------------------- 表示

function setVideo(videoId, title) {
  state.videoId = videoId;
  state.title = title;

  els.title.textContent = title || '(タイトルなし)';
  els.videoId.textContent = videoId;

  els.preview.hidden = false;
  els.previewEmpty.hidden = true;
  // hqdefault はどの動画にも必ず存在するのでプレビューに使う。
  els.preview.src = thumbnailUrl(videoId, 'hqdefault', 'jpg');

  renderList();
  refreshAvailability();
}

function renderList() {
  els.list.replaceChildren();

  for (const quality of QUALITIES) {
    const row = document.createElement('li');
    row.className = 'row';
    row.dataset.quality = quality.key;

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = quality.label;

    const size = document.createElement('span');
    size.className = 'size';
    size.textContent = quality.size;

    const badge = document.createElement('span');
    badge.className = 'badge';

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'URL';
    copyButton.title = '画像の URL をコピー';
    copyButton.addEventListener('click', () => copyUrl(quality.key));

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.dataset.role = 'save';
    saveButton.textContent = '保存';
    saveButton.addEventListener('click', () => download(quality.key));

    row.append(label, size, badge, copyButton, saveButton);
    els.list.append(row);
  }
}

function paintRow(qualityKey) {
  const row = els.list.querySelector(`[data-quality="${qualityKey}"]`);
  if (!row) return;

  const status = state.available[qualityKey];
  const badge = row.querySelector('.badge');
  const saveButton = row.querySelector('[data-role="save"]');

  row.classList.toggle('off', status === false);
  saveButton.disabled = status === false;

  if (status === null) {
    badge.className = 'badge checking';
    badge.textContent = '確認中';
  } else if (status === true) {
    badge.className = 'badge ok';
    badge.textContent = '利用可';
  } else {
    badge.className = 'badge missing';
    badge.textContent = 'この動画には無し';
  }
}

function paintBestButton() {
  const best = QUALITIES.find((q) => state.available[q.key] === true);
  els.best.disabled = !best;
  els.best.textContent = best ? `最高画質を保存（${best.label} ・ ${best.size}）` : '最高画質を保存';
}

function setStatus(message, kind = '') {
  els.status.textContent = message;
  els.status.className = `status ${kind}`.trim();
}

// ---------------------------------------------------------------- 存在確認

function refreshAvailability() {
  const videoId = state.videoId;
  const format = state.format;

  for (const quality of QUALITIES) {
    // hq / mq / default は常に存在するので問い合わせ不要。
    state.available[quality.key] = quality.key === 'maxresdefault' || quality.key === 'sddefault'
      ? null
      : true;
    paintRow(quality.key);
  }
  paintBestButton();

  for (const quality of QUALITIES) {
    if (state.available[quality.key] !== null) continue;

    probe(thumbnailUrl(videoId, quality.key, format)).then((width) => {
      // 確認中に動画や形式が切り替わっていたら、その結果は捨てる。
      if (state.videoId !== videoId || state.format !== format) return;
      state.available[quality.key] = width !== null && !isPlaceholder(quality.key, width);
      paintRow(quality.key);
      paintBestButton();
    });
  }
}

/** 画像を読み込めたら実際の幅を、ダメなら null を返す。 */
function probe(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

// ---------------------------------------------------------------- 保存・コピー

async function download(qualityKey) {
  if (!state.videoId) return;

  try {
    const filename = await downloadThumbnail({
      videoId: state.videoId,
      quality: qualityKey,
      format: state.format,
      title: state.title,
      saveAs: state.saveAs,
    });
    setStatus(`保存しました: ${filename}`, 'done');
  } catch (error) {
    setStatus(`保存に失敗しました: ${error.message}`, 'error');
  }
}

async function copyUrl(qualityKey) {
  if (!state.videoId) return;

  const url = thumbnailUrl(state.videoId, qualityKey, state.format);
  try {
    await navigator.clipboard.writeText(url);
    setStatus('URL をコピーしました', 'done');
  } catch {
    setStatus('URL のコピーに失敗しました', 'error');
  }
}
