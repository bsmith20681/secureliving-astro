// Fetches a web page, pulls out the main article with Readability, and writes it as markdown.
// Usage: node fetch-article.mjs <url> <output.md> [html-file]
// Pass html-file to convert a page saved from a browser instead of fetching the url.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const [url, outPath, htmlFile] = process.argv.slice(2);
if (!url || !outPath) {
  console.error('Usage: node fetch-article.mjs <url> <output.md> [html-file]');
  process.exit(1);
}

let html;
if (htmlFile) {
  html = await readFile(htmlFile, 'utf8');
} else {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    console.error(`FETCH_FAILED ${res.status} ${res.statusText}`);
    process.exit(2);
  }
  html = await res.text();
}

const { document } = parseHTML(html);

// Lazy-loaded images keep the real URL in a data attribute.
for (const img of document.querySelectorAll('img')) {
  const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
  if (lazy) img.setAttribute('src', lazy);
}

// Make links and images absolute so they still work from the markdown file.
for (const [selector, attr] of [['a[href]', 'href'], ['img[src]', 'src']]) {
  for (const el of document.querySelectorAll(selector)) {
    try {
      el.setAttribute(attr, new URL(el.getAttribute(attr), url).href);
    } catch {}
  }
}

const meta = (name) =>
  document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute('content') || '';
const headTitle = document.querySelector('title')?.textContent.trim() || '';
const metaDescription = meta('description') || meta('og:description');
const published = meta('article:published_time') || meta('date');
const modified = meta('article:modified_time') || meta('og:updated_time');

const article = new Readability(document).parse();
if (!article || !article.content) {
  console.error('NO_ARTICLE Readability could not find article content on this page.');
  process.exit(3);
}

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
turndown.use(gfm);
const body = turndown.turndown(article.content).replace(/\n{3,}/g, '\n\n').trim();

// Readability often drops the H1, so add it back from the article title.
const h1 = article.title || headTitle;
const markdown = /^# /m.test(body) ? body : `# ${h1}\n\n${body}`;

const plain = markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
const wordCount = (plain.match(/[A-Za-z0-9'’-]+/g) || []).length;
const count = (re) => (markdown.match(re) || []).length;

const stats = {
  wordCount,
  // Headings can sit indented inside list items, and tables without a header row stay as HTML.
  h2: count(/^\s*## /gm),
  h3: count(/^\s*### /gm),
  images: count(/!\[[^\]]*\]\([^)]*\)/g),
  links: count(/(?<!!)\[[^\]]*\]\([^)]*\)/g),
  tables: count(/^\s*\|(?: *:?-+:? *\|)+ *$/gm) + count(/<table/g),
};

const esc = (s) => JSON.stringify(s || '');
const frontmatter = [
  '---',
  `url: ${esc(url)}`,
  `site: ${esc(article.siteName || new URL(url).hostname.replace(/^www\./, ''))}`,
  `seoTitle: ${esc(headTitle)}`,
  `h1: ${esc(h1)}`,
  `metaDescription: ${esc(metaDescription)}`,
  `author: ${esc(article.byline)}`,
  `published: ${esc(published)}`,
  `modified: ${esc(modified)}`,
  `fetched: ${esc(new Date().toISOString().slice(0, 10))}`,
  `wordCount: ${stats.wordCount}`,
  `h2Count: ${stats.h2}`,
  `h3Count: ${stats.h3}`,
  `imageCount: ${stats.images}`,
  `linkCount: ${stats.links}`,
  `tableCount: ${stats.tables}`,
  '---',
].join('\n');

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${frontmatter}\n\n${markdown}\n`, 'utf8');
console.log(JSON.stringify({ outPath, title: h1, ...stats }));
