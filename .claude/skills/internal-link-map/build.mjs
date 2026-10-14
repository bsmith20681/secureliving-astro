// Builds the Internal Link Map page from src/content/articles.
// Usage: node build.mjs --out <file.html> [--articles <dir>] [--overrides <file.json>]
//   overrides JSON: { "supporting-slug": "top-level-slug" | null }  (null = leave unassigned)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
if (!args.out) { console.error("Missing --out <file.html>"); process.exit(1); }
const articlesDir = args.articles || "src/content/articles";
const overrides = args.overrides ? JSON.parse(readFileSync(args.overrides, "utf8")) : {};
const SECTION = "home-security-systems";

const files = readdirSync(articlesDir).filter(f => f.endsWith(".mdx") || f.endsWith(".md"));
const articles = files.map(f => {
  const raw = readFileSync(join(articlesDir, f), "utf8").replace(/\r\n/g, "\n");
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  const pageType = fm && (fm[1].match(/^pageType:\s*["']?(\w+)/m) || [])[1];
  return { slug: f.replace(/\.mdx?$/, ""), pageType: pageType || "missing", body: fm ? raw.slice(fm[0].length) : raw };
});
const slugs = new Set(articles.map(a => a.slug));

// In-body links: markdown ](url) and href="url", relative or absolute to secureliving.com.
const LINK_RE = /(?:\]\(|href=["'])(?:https?:\/\/(?:www\.)?secureliving\.com)?\/([a-z0-9-]+)\/([a-z0-9-]+)\/?(?:#[^)"'\s]*)?(?=[)"'\s])/g;
const links = [], unknownTargets = [];
for (const a of articles) {
  const seen = new Set();
  for (const [, section, target] of a.body.matchAll(LINK_RE)) {
    if (target === a.slug) continue;
    if (!slugs.has(target)) { if (section === SECTION) unknownTargets.push(`${a.slug} -> /${section}/${target}`); continue; }
    if (seen.has(target)) continue;
    seen.add(target);
    links.push({ s: a.slug, t: target, broken: section !== SECTION });
  }
}

// Silos: each topLevel page; a supporting page joins the top-level page it links to most (ties/none = unassigned).
const tops = articles.filter(a => a.pageType === "topLevel").map(a => a.slug);
const members = Object.fromEntries(tops.map(t => [t, []]));
const unclustered = [];
for (const a of articles.filter(a => a.pageType !== "topLevel")) {
  let pillar;
  if (a.slug in overrides) pillar = overrides[a.slug];
  else {
    const counts = {};
    links.filter(l => l.s === a.slug && tops.includes(l.t)).forEach(l => counts[l.t] = (counts[l.t] || 0) + 1);
    const ranked = Object.entries(counts).sort((x, y) => y[1] - x[1]);
    pillar = ranked.length && (ranked.length === 1 || ranked[0][1] > ranked[1][1]) ? ranked[0][0] : null;
  }
  if (pillar && members[pillar]) members[pillar].push(a.slug); else unclustered.push(a.slug);
}

// Order siblings so linked pages sit next to each other, then split into rows above/below the top-level page.
const linked = (x, y) => links.some(l => (l.s === x && l.t === y) || (l.s === y && l.t === x));
function order(list) {
  const left = [...list].sort(), out = [];
  while (left.length) {
    const last = out[out.length - 1];
    const i = last ? Math.max(0, left.findIndex(s => linked(last, s))) : 0;
    out.push(left.splice(i, 1)[0]);
  }
  return out;
}
const clusters = tops.map(pillar => {
  const list = order(members[pillar]);
  const split = list.length <= 4 ? list.length : Math.ceil(list.length / 2);
  return { pillar, top: list.slice(0, split), bottom: list.slice(split) };
}).sort((a, b) => (b.top.length + b.bottom.length) - (a.top.length + a.bottom.length) || a.pillar.localeCompare(b.pillar));

const data = {
  scanDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  articleCount: articles.length, links, clusters, unclustered,
};
const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "template.html"), "utf8");
writeFileSync(args.out, template.replace("/*__DATA__*/", JSON.stringify(data)));

// Summary for Claude to relay.
const missing = articles.filter(a => a.pageType === "missing").map(a => a.slug);
console.log(JSON.stringify({
  out: args.out, articles: articles.length, links: links.length, topLevel: tops.length,
  silos: clusters.map(c => `${c.pillar}: ${c.top.length + c.bottom.length} supporting`),
  unassigned: unclustered, brokenLinks: links.filter(l => l.broken).map(l => `${l.s} -> ${l.t}`),
  linksToUnknownArticles: unknownTargets, missingPageType: missing,
}, null, 2));
