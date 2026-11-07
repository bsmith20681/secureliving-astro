// Injected into every page during `astro dev` by integration.mjs.
const API = '/_live-edit/block';
const MOVE_API = '/_live-edit/move';
const FIELD_API = '/_live-edit/field';
const DELETE_API = '/_live-edit/delete';
const UNDO_API = '/_live-edit/undo';
// Body blocks carry data-src; the title and subtitle carry data-field.
const EDITABLE = '[data-src], [data-field]';
const STORAGE_KEY = 'live-edit-on';

const style = document.createElement('style');
style.textContent = `
  .le-toggle { position: fixed; right: 16px; bottom: 16px; z-index: 99999; padding: 10px 16px;
    border: 0; border-radius: 999px; background: #1d4ed8; color: #fff; font: 600 14px system-ui, sans-serif;
    box-shadow: 0 4px 14px rgba(0,0,0,.25); cursor: pointer; }
  body.le-on .le-toggle { background: #15803d; }
  body.le-on [data-src]:hover, body.le-on [data-field]:hover { outline: 2px dashed #1d4ed8; outline-offset: 3px; cursor: text; }
  body.le-on [data-src]:has([data-src]:hover) { outline: none; }
  .le-box { list-style: none; }
  .le-box textarea { display: block; width: 100%; padding: 0; margin: 0; border: 0; outline: 0; background: none;
    resize: none; overflow: hidden; }
  .le-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; font: 13px system-ui, sans-serif; color: #475569; }
  /* The site's global button rule forces white text with !important. */
  .le-box .le-row button { padding: 6px 14px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;
    color: #1e293b !important; font: inherit; text-transform: none; box-shadow: none; cursor: pointer; }
  .le-box .le-row button:hover { background: #f1f5f9; border-color: #94a3b8; }
  .le-box .le-row button.le-save { background: #1d4ed8; border-color: #1d4ed8; color: #fff !important; }
  .le-box .le-row button.le-save:hover { background: #1e40af; border-color: #1e40af; }
  .le-row .le-msg { margin-left: auto; }
  .le-row .le-err { color: #b91c1c; }
  .le-handle { position: absolute; z-index: 99998; display: none; width: 22px; height: 28px; align-items: center;
    justify-content: center; border-radius: 4px; background: #1d4ed8; color: #fff; font: 16px/1 system-ui, sans-serif;
    cursor: grab; user-select: none; touch-action: none; }
  body.le-on .le-handle.le-show { display: flex; }
  .le-trash { position: absolute; z-index: 99998; display: none; width: 22px; height: 24px; padding: 0;
    align-items: center; justify-content: center; border: 0; border-radius: 4px; background: #fff;
    color: #b91c1c !important; box-shadow: 0 0 0 1px #fca5a5; cursor: pointer; }
  .le-trash:hover { background: #b91c1c; color: #fff !important; box-shadow: none; }
  .le-trash svg { width: 14px; height: 14px; }
  body.le-on .le-trash.le-show { display: flex; }
  .le-toast { position: fixed; left: 50%; bottom: 24px; z-index: 99999; transform: translateX(-50%); padding: 10px 16px;
    border-radius: 8px; background: #0f172a; color: #fff; font: 14px system-ui, sans-serif;
    box-shadow: 0 4px 14px rgba(0,0,0,.25); pointer-events: none; }
  .le-toast.le-err { background: #b91c1c; }
  .le-doomed { outline: 2px solid #b91c1c !important; outline-offset: 3px; background: rgba(185,28,28,.06); }
  body.le-grabbing, body.le-grabbing * { cursor: grabbing !important; user-select: none; }
  .le-lifted { opacity: .35; }
  .le-drop { position: fixed; z-index: 99998; display: none; height: 4px; margin-top: -2px; border-radius: 2px;
    background: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,.18); pointer-events: none; }
  .le-drop::before, .le-drop::after { content: ''; position: absolute; top: -4px; width: 12px; height: 12px;
    border-radius: 50%; background: #1d4ed8; }
  .le-drop::before { left: -6px; }
  .le-drop::after { right: -6px; }
`;
document.head.append(style);

// Only article content is tagged, so pages without tags get no editor.
const hasEditable = document.querySelector(EDITABLE) !== null;

let enabled = false;
try {
  enabled = sessionStorage.getItem(STORAGE_KEY) === '1';
} catch {}

const toggle = document.createElement('button');
toggle.className = 'le-toggle';
if (hasEditable) document.body.append(toggle);

function setEnabled(value) {
  // Edit and comment mode are exclusive. (setCommenting is hoisted.)
  if (value && document.body.classList.contains('le-comment-on')) setCommenting(false);
  enabled = value;
  document.body.classList.toggle('le-on', value);
  toggle.textContent = value ? '✓ Done editing' : '✎ Edit page';
  try {
    sessionStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {}
}
setEnabled(enabled);
toggle.addEventListener('click', () => setEnabled(!enabled));

function fitHeight(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight + 4}px`;
}

async function openEditor(el) {
  const { src, field, file } = el.dataset;
  const res = await fetch(
    field
      ? `${FIELD_API}?file=${encodeURIComponent(file)}&field=${encodeURIComponent(field)}`
      : `${API}?src=${encodeURIComponent(src)}`,
  );
  const { text, error } = await res.json();
  if (!res.ok) return alert(error);

  const box = document.createElement(el.tagName === 'LI' ? 'li' : 'div');
  box.className = 'le-box';
  box.innerHTML = `
    <textarea spellcheck="true"></textarea>
    <div class="le-row">
      <button class="le-save">Save</button>
      <button class="le-cancel">Cancel</button>
      <span>Ctrl+Enter to save · Esc to cancel</span>
      <span class="le-msg"></span>
    </div>`;
  const textarea = box.querySelector('textarea');
  const msg = box.querySelector('.le-msg');
  textarea.value = text;

  // Match the text being edited so the box reads like the page.
  const css = getComputedStyle(el);
  for (const prop of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'color', 'lineHeight', 'letterSpacing', 'textTransform', 'marginTop', 'marginBottom']) {
    (prop.startsWith('margin') ? box : textarea).style[prop] = css[prop];
  }

  el.style.display = 'none';
  el.after(box);
  fitHeight(textarea);
  textarea.focus();

  const close = () => {
    box.remove();
    el.style.display = '';
  };

  const save = async () => {
    if (textarea.value === text) return close();
    msg.className = 'le-msg';
    msg.textContent = 'Saving…';
    const put = await fetch(field ? FIELD_API : API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        field ? { file, field, original: text, text: textarea.value } : { src, original: text, text: textarea.value },
      ),
    });
    const result = await put.json();
    if (!put.ok) {
      msg.className = 'le-msg le-err';
      msg.textContent = result.error;
      return;
    }
    // Astro reloads the page when the content file changes; this is a fallback.
    msg.textContent = 'Saved. Reloading…';
    setTimeout(() => location.reload(), 1500);
  };

  textarea.addEventListener('input', () => fitHeight(textarea));
  textarea.addEventListener('keydown', (e) => {
    // A title or subtitle is one line, so plain Enter saves it.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || field)) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') close();
  });
  box.querySelector('.le-save').addEventListener('click', save);
  box.querySelector('.le-cancel').addEventListener('click', close);
}

document.addEventListener(
  'click',
  (e) => {
    if (!enabled || e.target.closest('.le-box, .le-toggle, .le-handle, .le-trash')) return;
    const el = e.target.closest(EDITABLE);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    openEditor(el);
  },
  true,
);

// --- Drag to reorder ---------------------------------------------------------
// Each top-level block is the run of elements between its <template data-block>
// marker and the next marker, so figures and components move as one piece.
function readBlocks() {
  return [...document.querySelectorAll('template[data-block]')].map((marker) => {
    const els = [];
    for (let n = marker.nextElementSibling; n && !n.matches('template[data-block], template[data-block-end]'); n = n.nextElementSibling) {
      els.push(n);
    }
    return { src: marker.dataset.block, marker, els };
  });
}

function rectOf(block) {
  const rects = block.els.map((el) => el.getBoundingClientRect()).filter((r) => r.width || r.height);
  if (!rects.length) return null;
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  return { top, bottom, left, width: right - left, height: bottom - top };
}

let blocks = readBlocks();
let hovered = null;
let dragging = null;
let drop = null;

const handle = document.createElement('div');
handle.className = 'le-handle';
handle.textContent = '⠿';
handle.title = 'Drag to move this block';
const dropLine = document.createElement('div');
dropLine.className = 'le-drop';
const trash = document.createElement('button');
trash.className = 'le-trash';
trash.title = 'Delete this block';
trash.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 5v6m4-6v6"/></svg>`;
if (blocks.length) document.body.append(handle, trash, dropLine);

document.addEventListener('mousemove', (e) => {
  if (!enabled || dragging || e.target.closest('.le-handle, .le-trash, .le-box')) return;
  const block = blocks.find((b) => b.els.some((el) => el.contains(e.target)));
  const rect = block && rectOf(block);
  if (!rect) return;
  hovered = block;
  const left = `${Math.max(4, rect.left + scrollX - 30)}px`;
  handle.style.top = `${rect.top + scrollY}px`;
  handle.style.left = left;
  trash.style.top = `${rect.top + scrollY + 32}px`;
  trash.style.left = left;
  handle.classList.add('le-show');
  trash.classList.add('le-show');
});

// Outline the block in red while the pointer is on its trash button.
const markDoomed = (on) => hovered?.els.forEach((el) => el.classList.toggle('le-doomed', on));
trash.addEventListener('mouseenter', () => markDoomed(true));
trash.addEventListener('mouseleave', () => markDoomed(false));

trash.addEventListener('click', async () => {
  if (!hovered) return;
  const doomed = hovered;
  const preview = doomed.els.map((el) => el.textContent.trim()).join(' ').replace(/\s+/g, ' ').slice(0, 120);
  if (!confirm(`Delete this block?\n\n${preview || '(image or component)'}`)) return markDoomed(false);
  markDoomed(false);
  trash.classList.remove('le-show');
  handle.classList.remove('le-show');
  doomed.els.forEach((el) => (el.style.display = 'none'));

  const res = await fetch(DELETE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src: doomed.src }),
  });
  if (!res.ok) alert((await res.json()).error);
  // Astro reloads the page when the content file changes; this is a fallback.
  setTimeout(() => location.reload(), res.ok ? 1500 : 0);
});

// Where the dragged block would land for a pointer at clientY, or null if it
// would stay where it is. `y` is the middle of the gap it would drop into.
function dropFor(clientY) {
  const visible = blocks.filter((b) => b === dragging || rectOf(b));
  const from = visible.indexOf(dragging);
  let prevBottom = null;
  for (let i = 0; i < visible.length; i++) {
    if (visible[i] === dragging) continue;
    const rect = rectOf(visible[i]);
    if (clientY < rect.top + rect.height / 2) {
      if (i === from + 1) return null;
      const y = prevBottom == null ? rect.top - 8 : (prevBottom + rect.top) / 2;
      return { block: visible[i], position: 'before', y };
    }
    prevBottom = rect.bottom;
  }
  const last = visible.at(-1);
  if (last === dragging) return null;
  return { block: last, position: 'after', y: rectOf(last).bottom + 8 };
}

// Draws the drop line across the full article column at the landing spot.
let lastY = 0;
function showDrop(clientY) {
  lastY = clientY;
  drop = dropFor(clientY);
  dropLine.style.display = drop ? 'block' : 'none';
  if (!drop) return;
  const column = dragging.marker.parentElement.getBoundingClientRect();
  dropLine.style.top = `${drop.y}px`;
  dropLine.style.left = `${column.left}px`;
  dropLine.style.width = `${column.width}px`;
}

addEventListener('scroll', () => {
  if (dragging) showDrop(lastY);
});

handle.addEventListener('pointerdown', (e) => {
  if (!hovered) return;
  e.preventDefault();
  handle.setPointerCapture(e.pointerId);
  blocks = readBlocks();
  dragging = blocks.find((b) => b.src === hovered.src);
  dragging.els.forEach((el) => el.classList.add('le-lifted'));
  trash.classList.remove('le-show');
  document.body.classList.add('le-grabbing');
});

handle.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  if (e.clientY < 60) scrollBy(0, -20);
  else if (e.clientY > innerHeight - 60) scrollBy(0, 20);
  handle.style.top = `${e.clientY + scrollY - 14}px`;
  showDrop(e.clientY);
});

handle.addEventListener('pointerup', async () => {
  if (!dragging) return;
  const moved = dragging;
  const target = drop;
  dragging = null;
  drop = null;
  moved.els.forEach((el) => el.classList.remove('le-lifted'));
  document.body.classList.remove('le-grabbing');
  dropLine.style.display = 'none';
  handle.classList.remove('le-show');
  trash.classList.remove('le-show');
  if (!target) return;

  // Move it on the page right away; the reload after the save confirms it.
  const nodes = [moved.marker, ...moved.els];
  if (target.position === 'before') target.block.marker.before(...nodes);
  else target.block.els.at(-1).after(...nodes);

  const res = await fetch(MOVE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src: moved.src, target: target.block.src, position: target.position }),
  });
  if (!res.ok) alert((await res.json()).error);
  // Astro reloads the page when the content file changes; this is a fallback.
  setTimeout(() => location.reload(), res.ok ? 1500 : 0);
});

// --- Undo --------------------------------------------------------------------
// Ctrl+Z in edit mode undoes the latest change to this page's file. Inside an
// open textbox it is left to the browser, so it undoes typing as usual.
function toast(text, isError) {
  document.querySelector('.le-toast')?.remove();
  const el = document.createElement('div');
  el.className = `le-toast${isError ? ' le-err' : ''}`;
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 2500);
}

const pageFile = (() => {
  const tagged = document.querySelector('[data-src], [data-field][data-file]');
  if (!tagged) return null;
  return tagged.dataset.file ?? tagged.dataset.src.replace(/:\d+:\d+:[0-9a-f]+$/, '');
})();

let undoing = false;
document.addEventListener('keydown', async (e) => {
  if (!enabled || !pageFile || undoing) return;
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return;
  if (e.target.closest('textarea, input, select, [contenteditable]')) return;
  e.preventDefault();
  undoing = true;
  const res = await fetch(UNDO_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: pageFile }),
  });
  const result = await res.json();
  if (!res.ok) {
    undoing = false;
    return toast(result.error, true);
  }
  toast(`Undone${result.remaining ? ` · ${result.remaining} more available` : ''}. Reloading…`);
  // Astro reloads the page when the content file changes; this is a fallback.
  setTimeout(() => location.reload(), 1500);
});

// Double-click edits a block even when edit mode is off.
document.addEventListener('dblclick', (e) => {
  if (enabled || commenting || e.target.closest('.le-box, .le-toggle, .le-ctoggle')) return;
  const el = e.target.closest(EDITABLE);
  if (!el) return;
  e.preventDefault();
  window.getSelection()?.removeAllRanges();
  openEditor(el);
});

// --- Comments ----------------------------------------------------------------
// Comment mode: click a block to leave a like, dislike, or fix-this-article
// note. Comments go to feedback/comments.jsonl; the article is not changed.
// Blocks that already have open comments are tinted amber in comment mode.
const COMMENT_API = '/_live-edit/comment';
const COMMENT_KEY = 'live-comment-on';
const KIND_LABEL = { like: '👍 Like', dislike: '👎 Dislike', fix: '🔧 Fix this article' };

const commentStyle = document.createElement('style');
commentStyle.textContent = `
  .le-ctoggle { position: fixed; right: 16px; bottom: 64px; z-index: 99999; padding: 10px 16px;
    border: 0; border-radius: 999px; background: #b45309; color: #fff !important; font: 600 14px system-ui, sans-serif;
    box-shadow: 0 4px 14px rgba(0,0,0,.25); cursor: pointer; text-transform: none; }
  body.le-comment-on .le-ctoggle { background: #15803d; }
  body.le-comment-on [data-src]:hover, body.le-comment-on [data-field]:hover,
  body.le-comment-on .le-cblock:hover { outline: 2px dashed #d97706; outline-offset: 3px; cursor: pointer; }
  body.le-comment-on [data-src]:has([data-src]:hover) { outline: none; }
  body.le-comment-on .le-has-comment { background: rgba(245,158,11,.14); box-shadow: -6px 0 0 #f59e0b; }
  .le-cbox { margin: 12px 0; padding: 12px; border: 1px solid #f59e0b; border-radius: 8px; background: #fffbeb;
    font: 14px/1.5 system-ui, sans-serif; color: #1e293b; text-align: left; }
  .le-cbox textarea { display: block; width: 100%; min-height: 72px; margin-top: 8px; padding: 8px; border: 1px solid #cbd5e1;
    border-radius: 6px; background: #fff; color: #1e293b; font: 14px/1.5 system-ui, sans-serif; resize: vertical; overflow: auto; }
  .le-cbox .le-row { flex-wrap: wrap; }
  .le-cbox .le-row button.le-kind-on { background: #f59e0b; border-color: #d97706; color: #fff !important; }
  .le-citem { display: flex; gap: 8px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid #fde68a; }
  .le-citem span { flex: 1; }
  .le-cbox .le-citem button { padding: 2px 8px; border: 1px solid #fca5a5; border-radius: 6px; background: #fff;
    color: #b91c1c !important; font: 12px system-ui, sans-serif; text-transform: none; box-shadow: none; cursor: pointer; }
`;
document.head.append(commentStyle);

let commenting = false;
try {
  commenting = sessionStorage.getItem(COMMENT_KEY) === '1';
} catch {}

const cToggle = document.createElement('button');
cToggle.className = 'le-ctoggle';
if (hasEditable && pageFile) document.body.append(cToggle);

// Element -> its open comments, rebuilt by loadComments().
let commentsByEl = new Map();
let commentCount = 0;
let unplaced = 0;

function updateCToggle() {
  const n = commentCount ? ` (${commentCount}${unplaced ? `, ${unplaced} not found` : ''})` : '';
  cToggle.textContent = commenting ? `✓ Done commenting${n}` : `💬 Comment${n}`;
}

function setCommenting(value) {
  if (value && enabled) setEnabled(false);
  commenting = value;
  document.body.classList.toggle('le-comment-on', value);
  try {
    sessionStorage.setItem(COMMENT_KEY, value ? '1' : '0');
  } catch {}
  updateCToggle();
}
cToggle.addEventListener('click', () => setCommenting(!commenting));

const rangeOf = (src) => {
  const m = /:(\d+):(\d+):[0-9a-f]+$/.exec(src ?? '');
  return m ? [Number(m[1]), Number(m[2])] : null;
};

// Commentable targets: tagged text blocks, the title/subtitle, and whole
// top-level blocks (figures, components) that have no tagged text inside.
function blockAnchor(block) {
  return block.els.find((el) => el.getBoundingClientRect().height) ?? block.els[0];
}
for (const block of readBlocks()) {
  if (block.els.length && !block.els.some((el) => el.matches('[data-src]') || el.querySelector('[data-src]'))) {
    block.els.forEach((el) => el.classList.add('le-cblock'));
    const anchor = blockAnchor(block);
    if (anchor) anchor.dataset.cblock = block.src;
  }
}

async function loadComments() {
  document.querySelectorAll('.le-has-comment').forEach((el) => el.classList.remove('le-has-comment'));
  commentsByEl = new Map();
  const res = await fetch(`${COMMENT_API}?file=${encodeURIComponent(pageFile)}`);
  if (!res.ok) return;
  const { comments } = await res.json();
  const tagged = [...document.querySelectorAll('[data-src], [data-cblock]')].map((el) => ({
    el,
    range: rangeOf(el.dataset.src ?? el.dataset.cblock),
  }));
  commentCount = comments.length;
  unplaced = 0;
  for (const c of comments) {
    let el = null;
    if (c.field) el = document.querySelector(`[data-field="${c.field}"]`);
    else if (c.start >= 0) {
      // The smallest tagged element that contains the quoted text.
      let best = null;
      for (const t of tagged) {
        if (!t.range || t.range[0] > c.start || t.range[1] < c.end) continue;
        if (!best || t.range[1] - t.range[0] < best.range[1] - best.range[0]) best = t;
      }
      el = best?.el ?? null;
    }
    if (!el) {
      unplaced++;
      continue;
    }
    el.classList.add('le-has-comment');
    if (!commentsByEl.has(el)) commentsByEl.set(el, []);
    commentsByEl.get(el).push(c);
  }
  updateCToggle();
}

function openCommentBox(el) {
  document.querySelector('.le-cbox')?.remove();
  const box = document.createElement(el.tagName === 'LI' ? 'li' : 'div');
  box.className = 'le-box le-cbox';

  const list = document.createElement('div');
  for (const c of commentsByEl.get(el) ?? []) {
    const item = document.createElement('div');
    item.className = 'le-citem';
    const text = document.createElement('span');
    text.textContent = `${KIND_LABEL[c.kind]}: ${c.comment}`;
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      const res = await fetch(COMMENT_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id }),
      });
      if (!res.ok) return toast((await res.json()).error, true);
      item.remove();
      await loadComments();
    });
    item.append(text, del);
    list.append(item);
  }

  const kinds = document.createElement('div');
  kinds.className = 'le-row';
  let kind = null;
  for (const [key, label] of Object.entries(KIND_LABEL)) {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', () => {
      kind = key;
      kinds.querySelectorAll('button').forEach((x) => x.classList.toggle('le-kind-on', x === b));
      textarea.focus();
    });
    kinds.append(b);
  }

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'What do you like or dislike about this, and why?';
  const row = document.createElement('div');
  row.className = 'le-row';
  row.innerHTML = `<button class="le-save">Save comment</button><button class="le-cancel">Close</button>
    <span>Ctrl+Enter to save · Esc to close</span><span class="le-msg"></span>`;
  const msg = row.querySelector('.le-msg');

  box.append(list, kinds, textarea, row);
  el.after(box);
  textarea.focus();

  const close = () => box.remove();
  const save = async () => {
    msg.className = 'le-msg le-err';
    if (!kind) return (msg.textContent = 'Pick like, dislike, or fix first.');
    if (!textarea.value.trim()) return (msg.textContent = 'Write a comment first.');
    msg.className = 'le-msg';
    msg.textContent = 'Saving…';
    const { src, field, file, cblock } = el.dataset;
    const res = await fetch(COMMENT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src: src ?? cblock, field, file, kind, comment: textarea.value, page: location.pathname }),
    });
    const result = await res.json();
    if (!res.ok) {
      msg.className = 'le-msg le-err';
      msg.textContent = result.error;
      return;
    }
    close();
    toast('Comment saved.');
    await loadComments();
  };
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') close();
  });
  row.querySelector('.le-save').addEventListener('click', save);
  row.querySelector('.le-cancel').addEventListener('click', close);
}

document.addEventListener(
  'click',
  (e) => {
    if (!commenting || e.target.closest('.le-box, .le-toggle, .le-ctoggle, .le-handle, .le-trash')) return;
    let el = e.target.closest(EDITABLE);
    if (!el) {
      const part = e.target.closest('.le-cblock');
      if (!part) return;
      const block = readBlocks().find((b) => b.els.includes(part));
      el = block && block.els.find((x) => x.dataset.cblock);
      if (!el) return;
    }
    e.preventDefault();
    e.stopPropagation();
    openCommentBox(el);
  },
  true,
);

if (hasEditable && pageFile) {
  setCommenting(commenting);
  loadComments();
}
