// Dev-only Astro integration: edit articles directly on the rendered page.
//
// A remark plugin tags each paragraph, heading, list item, blockquote and
// table with its exact character range in the source .mdx file. A small
// client script adds an "Edit page" toggle; clicking a tagged block opens its
// raw Markdown in a textbox, and saving replaces only that range on disk.
// Nothing else in the file is touched, so there is no reformatting.
//
// Every top-level block (including figures and components) is also preceded
// by a hidden <template data-block> marker. The client groups the elements
// between markers so a whole block can be dragged; moving cuts its source
// text and pastes it before or after another block.
//
// Each tag carries a hash of the whole file as it was rendered; a change is
// refused if the file has changed since, because the offsets would be stale.
//
// Loaded from astro.config.mjs only during `astro dev`.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'src', 'content');
const TAGGED = new Set(['paragraph', 'heading', 'listItem', 'blockquote', 'table']);
const UNMOVABLE = new Set(['mdxjsEsm', 'yaml', 'toml']);
const API = '/_live-edit/block';
const MOVE_API = '/_live-edit/move';

const hashOf = (text) => createHash('sha1').update(text).digest('hex').slice(0, 12);

// A hidden element the client uses to find where each top-level block starts.
function marker(attr, value, isMdx) {
  if (isMdx) {
    return {
      type: 'mdxJsxFlowElement',
      name: 'template',
      attributes: [{ type: 'mdxJsxAttribute', name: attr, value }],
      children: [],
    };
  }
  return { type: 'html', value: `<template ${attr}="${value}"></template>` };
}

function remarkSourceRanges() {
  return (tree, file) => {
    if (!file.path || !path.resolve(file.path).startsWith(CONTENT_DIR)) return;
    const rel = path.relative(ROOT, file.path).split(path.sep).join('/');
    const version = hashOf(readFileSync(file.path, 'utf8'));
    const ref = (pos) => `${rel}:${pos.start.offset}:${pos.end.offset}:${version}`;
    const hasRange = (pos) => pos?.start.offset != null && pos?.end.offset != null;

    const walk = (node) => {
      if (TAGGED.has(node.type) && hasRange(node.position)) {
        node.data ??= {};
        node.data.hProperties = { ...node.data.hProperties, 'data-src': ref(node.position) };
      }
      node.children?.forEach(walk);
    };
    walk(tree);

    const isMdx = file.path.endsWith('.mdx');
    const children = [];
    for (const node of tree.children) {
      if (!UNMOVABLE.has(node.type) && hasRange(node.position)) {
        children.push(marker('data-block', ref(node.position), isMdx));
      }
      children.push(node);
    }
    children.push(marker('data-block-end', version, isMdx));
    tree.children = children;
  };
}

// "src/content/articles/x.mdx:120:340:ab12cd34ef56" -> { file, start, end, version },
// or null if it points anywhere outside src/content.
function parseSrc(src) {
  const match = /^(.+\.mdx?):(\d+):(\d+):([0-9a-f]{12})$/.exec(src ?? '');
  if (!match) return null;
  const file = path.resolve(ROOT, match[1]);
  if (!file.startsWith(CONTENT_DIR + path.sep)) return null;
  return { file, start: Number(match[2]), end: Number(match[3]), version: match[4] };
}

async function readJson(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  return JSON.parse(data);
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

const STALE = 'The file changed since this page loaded. Reload and try again.';
const eolOf = (source) => (source.includes('\r\n') ? '\r\n' : '\n');

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET') {
    const target = parseSrc(url.searchParams.get('src'));
    if (!target) return send(res, 400, { error: 'Invalid source reference' });
    const source = await fs.readFile(target.file, 'utf8');
    if (hashOf(source) !== target.version) return send(res, 409, { error: STALE });
    return send(res, 200, { text: source.slice(target.start, target.end) });
  }

  if (req.method === 'PUT') {
    const { src, original, text } = await readJson(req);
    const target = parseSrc(src);
    if (!target || typeof text !== 'string') return send(res, 400, { error: 'Invalid request' });
    const source = await fs.readFile(target.file, 'utf8');
    if (hashOf(source) !== target.version || source.slice(target.start, target.end) !== original) {
      return send(res, 409, { error: STALE });
    }
    // Browsers normalize textarea newlines to \n; keep the file's own style.
    const replacement = text.replace(/\r?\n/g, eolOf(source));
    await fs.writeFile(target.file, source.slice(0, target.start) + replacement + source.slice(target.end), 'utf8');
    return send(res, 200, { ok: true });
  }

  send(res, 405, { error: 'Method not allowed' });
}

// Move one top-level block before or after another in the same file.
async function handleMove(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const { src, target: targetSrc, position } = await readJson(req);
  const block = parseSrc(src);
  const target = parseSrc(targetSrc);
  if (!block || !target || block.file !== target.file || !['before', 'after'].includes(position)) {
    return send(res, 400, { error: 'Invalid request' });
  }
  const source = await fs.readFile(block.file, 'utf8');
  if (hashOf(source) !== block.version || block.version !== target.version) {
    return send(res, 409, { error: STALE });
  }

  const text = source.slice(block.start, block.end);
  const gap = eolOf(source).repeat(2);

  // Cut the block plus the blank lines after it, or before it if it is last.
  let cutStart = block.start;
  let cutEnd = block.end + /^\s*/.exec(source.slice(block.end))[0].length;
  if (cutEnd === source.length) {
    cutEnd = block.end;
    cutStart = block.start - /\s*$/.exec(source.slice(0, block.start))[0].length;
  }

  const at = position === 'before' ? target.start : target.end;
  const insert = position === 'before' ? text + gap : gap + text;
  if (at > cutStart && at < cutEnd) return send(res, 400, { error: 'Cannot move a block into itself' });

  // Apply the later edit first so the earlier offset stays valid.
  const cut = (s) => s.slice(0, cutStart) + s.slice(cutEnd);
  const paste = (s) => s.slice(0, at) + insert + s.slice(at);
  const updated = at >= cutEnd ? cut(paste(source)) : paste(cut(source));
  await fs.writeFile(block.file, updated, 'utf8');
  return send(res, 200, { ok: true });
}

const route = (handler) => (req, res) => {
  handler(req, res).catch((err) => send(res, 500, { error: String(err?.message ?? err) }));
};

export default function liveEditor() {
  return {
    name: 'live-editor',
    hooks: {
      'astro:config:setup': ({ command, updateConfig, injectScript }) => {
        if (command !== 'dev') return;
        updateConfig({ markdown: { remarkPlugins: [remarkSourceRanges] } });
        injectScript('page', readFileSync(new URL('./client.js', import.meta.url), 'utf8'));
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(API, route(handle));
        server.middlewares.use(MOVE_API, route(handleMove));
      },
    },
  };
}
