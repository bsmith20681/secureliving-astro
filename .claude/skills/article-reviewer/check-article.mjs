// Mechanical checks for a SecureLiving article, used by the article-reviewer skill.
// Everything here is a fact a script can verify; judgment calls are left to the reviewer.
//
// Usage:
//   node .claude/skills/article-reviewer/check-article.mjs <src/content/articles/file.mdx>
//
// Output: one section per rubric component, each line tagged
//   MUST  - blocks publishing (build breaks, banned by the writing rules)
//   WARN  - likely a problem, reviewer decides
//   INFO  - context for the reviewer

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const articlePath = process.argv[2];
if (!articlePath) {
  console.error('Usage: node .claude/skills/article-reviewer/check-article.mjs <article.mdx>');
  process.exit(1);
}

const root = process.cwd();
const articleAbs = path.resolve(articlePath);
const articleDir = path.dirname(articleAbs);
const articlesDir = path.join(root, 'src/content/articles');
const src = readFileSync(articleAbs, 'utf8').replace(/\r\n/g, '\n');

const out = {};
const add = (section, level, msg) => (out[section] ??= []).push(`${level.padEnd(4)}  ${msg}`);

// ---------- split frontmatter / body ----------
const fmMatch = src.match(/^---\n([\s\S]*?)\n---\n/);
const fmText = fmMatch?.[1] ?? '';
const body = fmMatch ? src.slice(fmMatch[0].length) : src;
const bodyStartLine = fmMatch ? fmMatch[0].split('\n').length - 1 : 0;

const fm = {};
for (const line of fmText.split('\n')) {
  const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
  if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}

// Body lines with real line numbers, code blocks masked out.
const lines = body.split('\n');
let inCode = false;
const prose = lines.map((l, i) => {
  if (/^\s*```/.test(l)) { inCode = !inCode; return { n: i + 1 + bodyStartLine, t: '' }; }
  if (inCode || /^import /.test(l)) return { n: i + 1 + bodyStartLine, t: '' };
  return { n: i + 1 + bodyStartLine, t: l.replace(/`[^`]*`/g, '') };
});

// Visible text of a line: drop tags, JSX expressions, link targets.
const visible = (s) =>
  s.replace(/<[^<>]*>/g, ' ').replace(/\{[^{}]*\}/g, ' ').replace(/\]\([^)]*\)/g, ']').replace(/https?:\/\/\S+/g, ' ');

// ---------- Formatting ----------
const F = 'Formatting';
for (const key of ['title', 'subtitle', 'category', 'pubDate', 'pageType']) {
  if (!fm[key]) add(F, 'MUST', `frontmatter is missing required field "${key}"`);
}
if (fm.pageType && !['topLevel', 'supporting'].includes(fm.pageType))
  add(F, 'MUST', `pageType "${fm.pageType}" must be topLevel or supporting`);

const categories = new Set();
const featuredBy = {};
for (const f of readdirSync(articlesDir).filter((f) => f.endsWith('.mdx'))) {
  const other = readFileSync(path.join(articlesDir, f), 'utf8');
  const cat = other.match(/^category:\s*["']?(.*?)["']?\s*$/m)?.[1];
  if (cat && path.join(articlesDir, f) !== articleAbs) categories.add(cat);
  const img = other.match(/^image:\s*["']?(.*?)["']?\s*$/m)?.[1];
  if (img && path.join(articlesDir, f) !== articleAbs) (featuredBy[img] ??= []).push(f);
}
if (fm.category && categories.size && !categories.has(fm.category))
  add(F, 'WARN', `category "${fm.category}" is not used by any other article (${[...categories].join(', ')})`);

if (fm.image) {
  if (!existsSync(path.resolve(articleDir, fm.image))) add(F, 'MUST', `featured image not found: ${fm.image}`);
  if (featuredBy[fm.image]) add(F, 'WARN', `featured image is also the featured image of ${featuredBy[fm.image].join(', ')}`);
} else add(F, 'WARN', 'no featured image (image field)');

if (fm.company && !existsSync(path.join(root, 'src/content/companies', `${fm.company}.yaml`)))
  add(F, 'MUST', `company "${fm.company}" has no src/content/companies/${fm.company}.yaml`);

const authorsFile = path.join(root, 'src/content/authors/authors.json');
if (fm.author && existsSync(authorsFile)) {
  const authors = JSON.parse(readFileSync(authorsFile, 'utf8'));
  const ids = (Array.isArray(authors) ? authors : Object.values(authors)).map((a) => a.id);
  if (!ids.includes(fm.author)) add(F, 'MUST', `author "${fm.author}" is not in authors.json`);
}

const imports = [...body.matchAll(/^import\s+(?:\{?\s*([\w\s,]+?)\s*\}?)\s+from\s+["'](.+?)["'];?/gm)];
const bodyNoImports = body.replace(/^import .*$/gm, '');
for (const [, names, from] of imports) {
  if (from.startsWith('.') && !existsSync(path.resolve(articleDir, from)))
    add(F, 'MUST', `import path does not exist: ${from}`);
  for (const name of names.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (!new RegExp(`\\b${name}\\b`).test(bodyNoImports)) add(F, 'WARN', `imported but never used: ${name}`);
  }
}
if (/ArticlePromoBox/.test(body)) add(F, 'MUST', 'ArticlePromoBox is in the body (the layout adds it already)');

for (const { n, t } of prose) {
  if (/<Image\b/.test(t) && !/alt=["{][^"}]+/.test(t)) add(F, 'WARN', `line ${n}: <Image> without alt text`);
  if (/^#{1}\s/.test(t)) add(F, 'WARN', `line ${n}: H1 in body (the layout renders the title as H1)`);
  if (/on this page|table of contents/i.test(t) && /^#{2,3}\s/.test(t)) add(F, 'MUST', `line ${n}: table of contents section`);
}
const figures = (body.match(/<figure>/g) ?? []).length;
const captions = (body.match(/<figcaption>/g) ?? []).length;
if (figures !== captions) add(F, 'WARN', `${figures} figures but ${captions} figcaptions`);

const openTags = [...body.matchAll(/<([A-Z]\w*|figure|figcaption|div|table)\b[^>]*?(?<!\/)>/g)].map((m) => m[1]);
const closeTags = [...body.matchAll(/<\/([A-Z]\w*|figure|figcaption|div|table)>/g)].map((m) => m[1]);
for (const tag of new Set(openTags)) {
  const o = openTags.filter((t) => t === tag).length;
  const c = closeTags.filter((t) => t === tag).length;
  if (o !== c) add(F, 'MUST', `<${tag}> opened ${o} times, closed ${c} times`);
}

// ---------- SEO structure ----------
const S = 'SEO structure';
const title = fm.title ?? '';
add(S, 'INFO', `title: "${title}" (${title.length} chars)`);
if (title.length > 60) add(S, 'WARN', `title is ${title.length} chars; Google cuts off around 60`);
if (/\(\s*20\d\d\s*\)|20\d\d\s*:/.test(title)) add(S, 'MUST', 'year in parentheses or followed by a colon in the title');
const md = fm.metaDescription ?? '';
if (!md) add(S, 'WARN', 'no metaDescription');
else if (md.length < 120 || md.length > 160) add(S, 'WARN', `metaDescription is ${md.length} chars (aim for 120-160)`);

const headings = prose.filter((p) => /^#{2,3}\s/.test(p.t));
const h2 = headings.filter((h) => /^##\s/.test(h.t)).length;
add(S, 'INFO', `H2: ${h2}, H3: ${headings.length - h2}`);
for (const { n, t } of headings) {
  const text = t.replace(/^#+\s*/, '');
  const lower = text.split(/\s+/).filter((w) => /^[a-z]/.test(w) && w !== 'vs' && w !== 'vs.');
  if (lower.length) add(S, 'WARN', `line ${n}: heading not in title case (${lower.join(', ')}): ${text}`);
}
if (!/<FAQ\b/.test(body)) add(S, 'WARN', 'no FAQ component');
const tables = (body.match(/^\|\s*:?-{3}/gm) ?? []).length;
if (!tables) add(S, 'WARN', 'no comparison table');

const hrefs = [...body.matchAll(/href=(?:"([^"]*)"|\{([^}]*)\})/g)].map((m) => m[1] ?? m[2]);
const mdLinks = [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
const allLinks = [...hrefs, ...mdLinks];
const affiliate = allLinks.filter((l) => /CompanyData\.website/.test(l));
const internal = allLinks.filter((l) => /^\/|secureliving\.com/.test(l));
const external = allLinks.filter((l) => /^https?:/.test(l) && !/secureliving\.com/.test(l));
add(S, 'INFO', `links: ${affiliate.length} affiliate, ${internal.length} internal, ${external.length} other external`);
for (const l of external) add(S, 'WARN', `external non-affiliate link: ${l}`);
for (const l of internal) {
  const slug = l.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean).pop();
  if (slug && !existsSync(path.join(articlesDir, `${slug}.mdx`))) add(S, 'MUST', `internal link to a missing article: ${l}`);
}

// ---------- Human voice ----------
const V = 'Human voice';
const aiWords = ['additionally', 'align with', 'bolstered', 'crucial', 'deep dive', 'delve', 'enduring', 'enhance', 'garner',
  'highlights?', 'highlighting', 'interplay', 'intricate', 'intricacies', 'landscape', 'meticulous(?:ly)?', 'pivotal', 'quietly',
  'showcas(?:e|es|ing)', 'tapestry', 'testament', 'underscor(?:e|es|ing)', 'vibrant', 'seamless(?:ly)?', 'game[- ]changer',
  'stunning', 'breathtaking', 'renowned', 'groundbreaking', 'nestled', 'boasts?', 'serves as', 'stands as', 'diverse array',
  'peace of mind', 'in today\'s', 'when it comes to', 'it\'s worth noting', 'it is important to note'];
const phrases = [
  ["\\bnot (?:just|only|merely)\\b", '§1 not just/only X but Y'],
  ["\\b(?:isn't|is not|aren't|it's not) (?:about |just )?[^.]{1,40}[,;] (?:it's|they're|it is)\\b", '§1 it\'s not X, it\'s Y'],
  ["\\b(?:let's|let us) (?:dive|explore|break|take a look|look at)", '§4 staged run-up'],
  ["here's (?:the thing|what you need to know|the deal|the kicker|the catch)", '§4 staged run-up'],
  ["^(?:honestly|look|real talk|the thing is)[?,.]", '§4 staged candor'],
  ["\\b(?:to be clear|don't get me wrong|i'm not saying)\\b", '§5 arguing with no one'],
  ["\\b(?:the real (?:question|win|kicker)|at its core|what really matters)\\b", '§3 saying that sounds deep'],
  ["\\b(?:that's the (?:real )?(?:win|point|difference)|let that sink in|read that again)\\b", '§2 one-line closer'],
  ["\\b(?:the future looks bright|exciting times)\\b", '§13 send-off'],
  ["\\b(?:i hope this helps|great question|let me know if)\\b", '§22 chatbot residue'],
];
const hits = {};
let dashCount = 0, curly = 0;
for (const { n, t } of prose) {
  if (!t.trim()) continue;
  const v = visible(t);
  for (const w of aiWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(v)) (hits[`AI word "${w.replace(/\(.*$|\\/g, '')}"`] ??= []).push(n);
  }
  for (const [re, label] of phrases) if (new RegExp(re, 'im').test(v)) (hits[label] ??= []).push(n);
  const d = (v.match(/[—–]| -- /g) ?? []).length;
  if (d) { dashCount += d; (hits['§8 em/en dash'] ??= []).push(n); }
  curly += (v.match(/[“”‘’]/g) ?? []).length;
}
for (const key of ['subtitle', 'metaDescription']) {
  if (/[—–]/.test(fm[key] ?? '')) add(V, 'MUST', `em/en dash in frontmatter ${key}`);
}

// Patterns Ben disliked, added by the learn-feedback skill.
const learnedFile = new URL('./learned-patterns.json', import.meta.url);
if (existsSync(learnedFile)) {
  for (const { pattern, label, level = 'WARN', source } of JSON.parse(readFileSync(learnedFile, 'utf8'))) {
    const re = new RegExp(pattern, 'i');
    const ns = prose.filter(({ t }) => t.trim() && re.test(visible(t))).map(({ n }) => n);
    if (ns.length) add(V, level === 'MUST' ? 'MUST' : 'WARN', `learned: ${label}${source ? ` [${source}]` : ''}: lines ${ns.join(', ')}`);
  }
}
if (dashCount) add(V, 'MUST', `${dashCount} em/en dashes in body text (lines ${hits['§8 em/en dash'].join(', ')})`);
delete hits['§8 em/en dash'];
for (const [label, ns] of Object.entries(hits)) add(V, 'WARN', `${label}: lines ${ns.join(', ')}`);
if (curly) add(V, 'WARN', `${curly} curly quotes`);

// Bold labels on list items (§19)
const boldLabels = prose.filter((p) => /^\s*(?:-|\*|\d+\.)\s+\*\*[^*]+:?\*\*:?/.test(p.t));
if (boldLabels.length >= 3) add(V, 'WARN', `§19 ${boldLabels.length} list items start with a bold label (lines ${boldLabels.map((p) => p.n).join(', ')})`);

// One-sentence paragraphs that follow a paragraph (possible §2 closers)
const paras = [];
let cur = null;
for (const p of prose) {
  const plain = p.t.trim();
  const isText = plain && !/^(#|<|\||-|\*\s|\d+\.|\{|import)/.test(plain);
  if (isText) { if (!cur) cur = { start: p.n, text: '' }; cur.text += ' ' + visible(plain); }
  else if (cur) { paras.push(cur); cur = null; }
}
if (cur) paras.push(cur);

// ---------- Readability ----------
const R = 'Readability';
const sentenceSplit = (s) => s.split(/(?<=[.!?])\s+(?=[A-Z"$0-9])/).filter((x) => x.trim());
const allSentences = [];
for (const p of paras) {
  const words = p.text.trim().split(/\s+/).length;
  if (words > 90) add(R, 'WARN', `line ${p.start}: paragraph is ${words} words`);
  for (const s of sentenceSplit(p.text.trim())) {
    const w = s.split(/\s+/).length;
    allSentences.push(w);
    if (w > 38) add(R, 'WARN', `line ${p.start}: ${w}-word sentence: "${s.slice(0, 70)}..."`);
  }
}
const closers = paras.filter((p, i) => i > 0 && sentenceSplit(p.text.trim()).length === 1 && p.text.trim().split(/\s+/).length < 12);
if (closers.length) add(V, 'INFO', `short one-sentence paragraphs (check for §2 closers): lines ${closers.map((p) => p.start).join(', ')}`);

if (allSentences.length) {
  const avg = allSentences.reduce((a, b) => a + b, 0) / allSentences.length;
  const sd = Math.sqrt(allSentences.reduce((a, b) => a + (b - avg) ** 2, 0) / allSentences.length);
  add(R, 'INFO', `${allSentences.length} sentences, average ${avg.toFixed(1)} words, std dev ${sd.toFixed(1)}`);
  if (sd < 5) add(V, 'WARN', `sentence lengths are uniform (std dev ${sd.toFixed(1)}); rhythm may read as machine-made`);
}
const wordCount = paras.reduce((a, p) => a + p.text.trim().split(/\s+/).length, 0);
add(R, 'INFO', `${paras.length} prose paragraphs, ${wordCount} words of running prose`);

// ---------- Experience & trust ----------
const E = 'Experience & trust';
const firstPerson = paras.reduce((a, p) => a + (p.text.match(/\b(?:I|I'm|I've|my|me)\b/g) ?? []).length, 0);
add(E, 'INFO', `${firstPerson} first-person words in prose`);
if (firstPerson < 5) add(E, 'WARN', 'almost no first-person voice; little sign of hands-on testing');
if (/tested|hands-on|i tried|i used/i.test(title) && firstPerson < 10)
  add(E, 'WARN', 'title claims hands-on testing but the body has little first-person detail');

// ---------- print ----------
const order = [F, S, V, R, E];
for (const s of order) {
  console.log(`\n== ${s}`);
  for (const l of out[s] ?? ['OK    nothing found']) console.log(l);
}
const must = order.flatMap((s) => out[s] ?? []).filter((l) => l.startsWith('MUST')).length;
console.log(`\nMUST items: ${must}`);
