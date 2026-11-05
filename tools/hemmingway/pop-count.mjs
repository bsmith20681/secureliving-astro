// Counts a POP content brief's terms in an article and flags any outside their range.
//
// Usage:
//   node tools/hemmingway/pop-count.mjs <article.mdx|draft.md> <terms.json>
//
// terms.json holds the brief's ranges for each section:
//   { "wordCount": 3152,
//     "title":    { "adt": [1, 1] },
//     "headings": { "adt alternatives": [1, 1] },
//     "body":     { "home security": [13, 20] } }

import { readFileSync } from 'node:fs';

const [articlePath, termsPath] = process.argv.slice(2);
if (!articlePath || !termsPath) {
  console.error('Usage: node tools/hemmingway/pop-count.mjs <article> <terms.json>');
  process.exit(1);
}

const src = readFileSync(articlePath, 'utf8');
const terms = JSON.parse(readFileSync(termsPath, 'utf8'));

let frontmatter = '';
let body = src;
const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
if (fm) {
  frontmatter = fm[1];
  body = src.slice(fm[0].length);
}

const title =
  frontmatter.match(/^title:\s*["']?(.*?)["']?\s*$/m)?.[1] ?? body.match(/^# (.*)$/m)?.[1] ?? '';
body = body.replace(/^import .*$/gm, '').replace(/^# .*$/m, '');

const headings = [...body.matchAll(/^#{2,3} (.*)$/gm)].map((m) => m[1]);

// Keeps visible text: figcaptions, FAQ questions and answers, table cells.
const stripMarkup = (s) =>
  s
    .replace(/<[^<>\n]*>|<FAQ|\/>|items=\{\[|\]\}|question:|answer:/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/[|#*_`[\]{}]/g, ' ');

const bodyText = stripMarkup(body.replace(/^#{2,3} .*$/gm, ''));
const allText = stripMarkup(body);

const count = (term, text) =>
  (text.match(new RegExp(`(?<![a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`, 'gi')) ?? []).length;

const words = allText.match(/[A-Za-z0-9$][A-Za-z0-9$'./%+-]*/g) ?? [];
console.log(`Words: ${words.length}${terms.wordCount ? ` (target ${terms.wordCount})` : ''}`);
console.log(`Title: ${title} (${title.length} chars)`);
console.log(`H2/H3 sections: ${headings.length}`);

const sections = { title, headings: headings.join('\n'), body: bodyText };
for (const [name, text] of Object.entries(sections)) {
  if (!terms[name]) continue;
  console.log(`\n== ${name}`);
  let total = 0;
  for (const [term, [lo, hi]] of Object.entries(terms[name])) {
    const c = count(term, text);
    total += c;
    const flag = c < lo ? '  LOW' : c > hi ? '  HIGH' : '';
    console.log(`${term.padEnd(28)} ${String(c).padStart(3)}  [${lo}-${hi}]${flag}`);
  }
  console.log(`section total: ${total}`);
}

console.log(`\nBold: ${(body.match(/\*\*[^*]+\*\*/g) ?? []).length}`);
console.log(`Italic: ${(body.match(/(?<!\*)\*[^*\n]+\*(?!\*)/g) ?? []).length}`);
console.log(`Tables: ${(body.match(/^\|\s*-{3}/gm) ?? []).length}`);
console.log(`List items: ${(body.match(/^(?:\d+\.|-) /gm) ?? []).length}`);
console.log(`Dashes (em/en): ${(body.match(/[—–]| -- /g) ?? []).length}`);

// Link targets are already stripped from allText, so this counts only prose asides.
const parens = (allText.match(/\([^()\n]*\)/g) ?? []).length;
const parensMax = Math.max(1, Math.round(words.length / 300));
console.log(`Parentheticals: ${parens} (aim for ${parensMax} or fewer)${parens > parensMax ? '  HIGH' : ''}`);
