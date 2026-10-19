// Injected into every page during `astro dev` by integration.mjs.
const API = '/_live-edit/block';
const MOVE_API = '/_live-edit/move';
const STORAGE_KEY = 'live-edit-on';

const style = document.createElement('style');
style.textContent = `
  .le-toggle { position: fixed; right: 16px; bottom: 16px; z-index: 99999; padding: 10px 16px;
    border: 0; border-radius: 999px; background: #1d4ed8; color: #fff; font: 600 14px system-ui, sans-serif;
    box-shadow: 0 4px 14px rgba(0,0,0,.25); cursor: pointer; }
  body.le-on .le-toggle { background: #15803d; }
  body.le-on [data-src]:hover { outline: 2px dashed #1d4ed8; outline-offset: 3px; cursor: text; }
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
const hasEditable = document.querySelector('[data-src]') !== null;

let enabled = false;
try {
  enabled = sessionStorage.getItem(STORAGE_KEY) === '1';
} catch {}

const toggle = document.createElement('button');
toggle.className = 'le-toggle';
if (hasEditable) document.body.append(toggle);

function setEnabled(value) {
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
  const src = el.dataset.src;
  const res = await fetch(`${API}?src=${encodeURIComponent(src)}`);
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
    const put = await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src, original: text, text: textarea.value }),
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
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
    if (e.key === 'Escape') close();
  });
  box.querySelector('.le-save').addEventListener('click', save);
  box.querySelector('.le-cancel').addEventListener('click', close);
}

document.addEventListener(
  'click',
  (e) => {
    if (!enabled || e.target.closest('.le-box, .le-toggle, .le-handle')) return;
    const el = e.target.closest('[data-src]');
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
if (blocks.length) document.body.append(handle, dropLine);

document.addEventListener('mousemove', (e) => {
  if (!enabled || dragging || e.target.closest('.le-handle, .le-box')) return;
  const block = blocks.find((b) => b.els.some((el) => el.contains(e.target)));
  const rect = block && rectOf(block);
  if (!rect) return;
  hovered = block;
  handle.style.top = `${rect.top + scrollY}px`;
  handle.style.left = `${Math.max(4, rect.left + scrollX - 30)}px`;
  handle.classList.add('le-show');
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

// Double-click edits a block even when edit mode is off.
document.addEventListener('dblclick', (e) => {
  if (enabled || e.target.closest('.le-box, .le-toggle')) return;
  const el = e.target.closest('[data-src]');
  if (!el) return;
  e.preventDefault();
  window.getSelection()?.removeAllRanges();
  openEditor(el);
});
