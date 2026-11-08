// Dev-only Astro integration: a review board at /_reviews/ that shows every
// version of an article side by side in iframes.
//
// Versions are grouped by file name: `adt-alternatives.mdx` is v1, and
// `adt-alternatives-v2.mdx`, `-v3.mdx`, ... are the later versions. Only
// articles with at least two versions are listed. Pick one with the dropdown or
// `/_reviews/?slug=adt-alternatives`.
//
// The page is served straight from the dev server's middleware, so it is never
// part of the production build. Each iframe loads the normal article page, so
// the live editor works inside it.
//
// Loaded from astro.config.mjs only during `astro dev`.
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ARTICLES = path.join(ROOT, 'src', 'content', 'articles');
const ROUTE = '/_reviews';

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Reads one frontmatter value as plain text, or '' if it's missing.
function field(source, name) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  const line = fm && new RegExp(`^${name}:[ \\t]*(.*?)[ \\t]*\\r?$`, 'm').exec(fm[1]);
  if (!line) return '';
  const raw = line[1];
  if (/^".*"$/.test(raw)) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw.slice(1, -1);
    }
  }
  if (/^'.*'$/.test(raw)) return raw.slice(1, -1).replace(/''/g, "'");
  return raw;
}

// { base: [{ id, version, title, url }, ...] } for every article with 2+ versions.
async function families() {
  const files = (await fs.readdir(ARTICLES)).filter((f) => /\.mdx?$/.test(f));
  const groups = new Map();
  for (const file of files) {
    const id = file.replace(/\.mdx?$/, '');
    const match = /^(.*)-v(\d+)$/.exec(id);
    const base = match ? match[1] : id;
    const version = match ? Number(match[2]) : 1;
    const source = await fs.readFile(path.join(ARTICLES, file), 'utf8');
    const category = field(source, 'category') || 'Home Security Systems';
    const url = `/${category.toLowerCase().replace(/\s+/g, '-')}/${id}/`;
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push({ id, version, title: field(source, 'title'), url });
  }
  const result = {};
  for (const [base, list] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    if (list.length < 2) continue;
    result[base] = list.sort((a, b) => a.version - b.version);
  }
  return result;
}

function render(all, slug) {
  const slugs = Object.keys(all);
  const current = all[slug] ? slug : slugs[0];
  const versions = current ? all[current] : [];

  const options = slugs
    .map((s) => `<option value="${escapeHtml(s)}"${s === current ? ' selected' : ''}>${escapeHtml(s)} (${all[s].length})</option>`)
    .join('');

  const columns = versions
    .map(
      (v) => `
    <section class="col">
      <header class="bar">
        <span class="tag">v${v.version}</span>
        <span class="title" title="${escapeHtml(v.title)}">${escapeHtml(v.title || v.id)}</span>
        <button type="button" class="btn" data-reload title="Reload this version">&#x21bb;</button>
        <a class="btn" href="${escapeHtml(v.url)}" target="_blank" rel="noopener" title="Open full size">&#x2197;</a>
      </header>
      <iframe src="${escapeHtml(v.url)}" title="v${v.version}: ${escapeHtml(v.id)}"></iframe>
    </section>`,
    )
    .join('');

  const empty = `<p class="empty">No articles with more than one version yet. Versions are named like
    <code>my-article.mdx</code>, <code>my-article-v2.mdx</code>, <code>my-article-v3.mdx</code>.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Review Board${current ? ` · ${escapeHtml(current)}` : ''}</title>
<style>
  :root { --bg: #f1f5f9; --panel: #ffffff; --text: #0f172a; --muted: #64748b; --line: #e2e8f0; --accent: #1d4ed8; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0b1120; --panel: #111827; --text: #e5e7eb; --muted: #94a3b8; --line: #1f2937; --accent: #60a5fa; }
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body { display: flex; flex-direction: column; background: var(--bg); color: var(--text); font: 14px/1.4 system-ui, sans-serif; }
  .top { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: var(--panel); border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .top h1 { font-size: 15px; margin: 0; }
  .top select, .top button { font: inherit; color: var(--text); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 4px 8px; }
  .top button[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); }
  .top .spacer { flex: 1; }
  .top .hint { color: var(--muted); }
  .board { flex: 1; min-height: 0; display: grid; gap: 6px; padding: 6px; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); }
  .board.grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); }
  .col { display: flex; flex-direction: column; min-width: 0; min-height: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .bar { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-bottom: 1px solid var(--line); }
  .tag { font-weight: 700; color: var(--accent); }
  .title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--text); text-decoration: none; cursor: pointer; font: inherit; }
  iframe { flex: 1; width: 100%; border: 0; background: #fff; }
  .empty { padding: 24px; }
</style>
</head>
<body>
  <div class="top">
    <h1>Review Board</h1>
    <select id="slug" aria-label="Article">${options}</select>
    <button type="button" id="layout" aria-pressed="false" title="Switch between side-by-side columns and a 2 by 2 grid">2&times;2 grid</button>
    <span class="spacer"></span>
    <span class="hint">Dev only &middot; the live editor works in each frame</span>
  </div>
  <main class="board" id="board" style="--n:${Math.max(versions.length, 1)}">${versions.length ? columns : empty}</main>
<script>
  const select = document.getElementById('slug');
  select?.addEventListener('change', () => {
    location.search = '?slug=' + encodeURIComponent(select.value);
  });

  const board = document.getElementById('board');
  const layout = document.getElementById('layout');
  const KEY = 'review-board-layout';
  function setGrid(on) {
    board.classList.toggle('grid', on);
    layout.setAttribute('aria-pressed', String(on));
    try { localStorage.setItem(KEY, on ? 'grid' : 'columns'); } catch {}
  }
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  setGrid(saved === 'grid');
  layout.addEventListener('click', () => setGrid(!board.classList.contains('grid')));

  document.querySelectorAll('[data-reload]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const frame = btn.closest('.col').querySelector('iframe');
      frame.contentWindow.location.reload();
    });
  });
</script>
</body>
</html>`;
}

export default function reviewBoard() {
  return {
    name: 'review-board',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url, 'http://localhost');
          if (url.pathname !== ROUTE && url.pathname !== `${ROUTE}/`) return next();
          try {
            const html = render(await families(), url.searchParams.get('slug'));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(String(err?.stack ?? err));
          }
        });
      },
    },
  };
}
