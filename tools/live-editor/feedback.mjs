// Reads and updates feedback/comments.jsonl, the comments saved from the live
// editor's comment mode. Used by the learn-feedback skill.
//
// Usage:
//   node tools/live-editor/feedback.mjs list [--all] [--kind like|dislike|fix] [--file <article.mdx>]
//   node tools/live-editor/feedback.mjs close <id> [<id> ...] --status applied|rule|rejected [--note "..."]
//   node tools/live-editor/feedback.mjs stats
//
// Statuses: open (new), applied (fixed in the article), rule (turned into a
// skill rule; the note says which skill and rule), rejected (Ben declined it).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'feedback', 'comments.jsonl');
const STATUSES = ['applied', 'rule', 'rejected'];

const load = () =>
  existsSync(FILE)
    ? readFileSync(FILE, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
    : [];
const save = (all) => writeFileSync(FILE, all.map((c) => JSON.stringify(c) + '\n').join(''), 'utf8');

const args = process.argv.slice(2);
const cmd = args.shift();
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const [, value] = args.splice(i, 2);
  return value ?? true;
};

if (cmd === 'list') {
  const all = flag('all') !== undefined;
  const kind = flag('kind');
  const file = flag('file')?.replace(/\\/g, '/');
  const rows = load().filter(
    (c) => (all || c.status === 'open') && (!kind || c.kind === kind) && (!file || c.file.endsWith(file)),
  );
  if (!rows.length) console.log(all ? 'No comments.' : 'No open comments.');
  for (const c of rows) {
    console.log(`\n[${c.id}] ${c.kind.toUpperCase()}  ${c.status}  ${c.createdAt.slice(0, 10)}  ${c.file}${c.field ? ` (${c.field})` : ''}`);
    console.log(`  Comment: ${c.comment}`);
    const quote = c.quote.replace(/\s+/g, ' ').trim();
    console.log(`  On: "${quote.length > 400 ? quote.slice(0, 400) + '…' : quote}"`);
    if (c.note) console.log(`  Note: ${c.note}`);
  }
} else if (cmd === 'close') {
  const status = flag('status');
  const note = flag('note');
  if (!STATUSES.includes(status) || !args.length) {
    console.error(`Usage: close <id> [<id> ...] --status ${STATUSES.join('|')} [--note "..."]`);
    process.exit(1);
  }
  const all = load();
  const missing = args.filter((id) => !all.some((c) => c.id === id));
  if (missing.length) {
    console.error(`Not found: ${missing.join(', ')}`);
    process.exit(1);
  }
  const now = new Date().toISOString();
  for (const c of all) {
    if (!args.includes(c.id)) continue;
    c.status = status;
    c.processedAt = now;
    if (typeof note === 'string') c.note = note;
  }
  save(all);
  console.log(`Marked ${args.length} comment(s) ${status}.`);
} else if (cmd === 'stats') {
  const all = load();
  const count = (pred) => all.filter(pred).length;
  console.log(`Total: ${all.length}  Open: ${count((c) => c.status === 'open')}`);
  for (const k of ['like', 'dislike', 'fix']) {
    console.log(`  ${k}: ${count((c) => c.kind === k)} (${count((c) => c.kind === k && c.status === 'open')} open)`);
  }
} else {
  console.error('Usage: node tools/live-editor/feedback.mjs list|close|stats  (see the top of this file)');
  process.exit(1);
}
