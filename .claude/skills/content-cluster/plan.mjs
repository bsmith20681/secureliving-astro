// Builds the Content Cluster Plan page from a plan JSON file.
// Usage: node plan.mjs --plan <plan.json> --out <file.html> [--articles <dir>]
//   plan JSON: see "Plan file" in SKILL.md.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
if (!args.plan || !args.out) { console.error("Usage: node plan.mjs --plan <plan.json> --out <file.html>"); process.exit(1); }
const plan = JSON.parse(readFileSync(args.plan, "utf8"));
const articlesDir = args.articles || "src/content/articles";
const SECTION = "home-security-systems";
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Existing articles: pageType and the in-body links they already have.
const LINK_RE = /(?:\]\(|href=["'])(?:https?:\/\/(?:www\.)?secureliving\.com)?\/([a-z0-9-]+)\/([a-z0-9-]+)\/?(?:#[^)"'\s]*)?(?=[)"'\s])/g;
const existing = {};
if (existsSync(articlesDir)) for (const f of readdirSync(articlesDir).filter(f => /\.mdx?$/.test(f))) {
  const raw = readFileSync(join(articlesDir, f), "utf8").replace(/\r\n/g, "\n");
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  const body = fm ? raw.slice(fm[0].length) : raw;
  existing[f.replace(/\.mdx?$/, "")] = {
    pageType: fm && (fm[1].match(/^pageType:\s*["']?(\w+)/m) || [])[1],
    title: fm && ((fm[1].match(/^title:\s*["']?(.+?)["']?$/m) || [])[1]),
    links: new Set([...body.matchAll(LINK_RE)].filter(m => m[1] === SECTION).map(m => m[2])),
  };
}

const page = (p, role) => {
  const slug = p.slug || slugify(p.keyword);
  const ex = existing[slug];
  return { slug, role, keyword: p.keyword, secondary: p.secondary || [], volume: p.volume ?? null, kd: p.kd ?? null,
    intent: p.intent || "", exists: !!ex, title: ex?.title || null, currentType: ex?.pageType || null };
};
const pillar = page(plan.topLevel, "topLevel");
const supporting = (plan.supporting || []).map(p => page(p, "supporting"));
const pages = [pillar, ...supporting];
const inCluster = new Set(pages.map(p => p.slug));

// Links: the plan's own list, plus the hub links every cluster needs (top <-> each supporting page).
const links = [];
const add = (s, t, anchor) => {
  if (s === t || !inCluster.has(s) || !inCluster.has(t)) return;
  const found = links.find(l => l.s === s && l.t === t);
  if (found) { if (anchor && !found.anchor) found.anchor = anchor; return; }
  links.push({ s, t, anchor: anchor || null });
};
(plan.links || []).forEach(l => add(l.from, l.to, l.anchor));
supporting.forEach(p => { add(p.slug, pillar.slug); add(pillar.slug, p.slug); });
// Links between cluster pages that already exist in the articles but aren't in the plan.
pages.forEach(p => existing[p.slug]?.links.forEach(t => add(p.slug, t)));
links.forEach(l => l.live = !!existing[l.s]?.links.has(l.t));

// Order siblings so linked pages sit next to each other, then split into rows above/below the top-level page.
const linked = (x, y) => links.some(l => (l.s === x && l.t === y) || (l.s === y && l.t === x));
const left = supporting.map(p => p.slug), order = [];
while (left.length) {
  const last = order[order.length - 1];
  const i = last ? Math.max(0, left.findIndex(s => linked(last, s))) : 0;
  order.push(left.splice(i, 1)[0]);
}
const split = order.length <= 4 ? order.length : Math.ceil(order.length / 2);

const warnings = [];
if (supporting.length < 1 || supporting.length > 10) warnings.push(`${supporting.length} supporting pages; a cluster needs 1-10.`);
const dupes = pages.map(p => p.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (dupes.length) warnings.push(`Duplicate slugs: ${[...new Set(dupes)].join(", ")}.`);
pages.filter(p => p.exists && p.currentType && p.currentType !== p.role)
  .forEach(p => warnings.push(`${p.slug} exists as pageType: ${p.currentType} but is planned as ${p.role}.`));
const kws = pages.map(p => p.keyword.toLowerCase());
kws.forEach((k, i) => { if (kws.indexOf(k) !== i) warnings.push(`Keyword "${k}" is targeted by more than one page.`); });

const data = {
  name: plan.name || pillar.keyword, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  pages, links, pillar: pillar.slug, top: order.slice(0, split), bottom: order.slice(split), warnings,
};
const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "plan-template.html"), "utf8");
const pageTitle = `${data.name} Cluster Plan`.replace(/[<&]/g, c => (c === "<" ? "&lt;" : "&amp;"));
writeFileSync(args.out, template.replace("<title>Content Cluster Plan</title>", `<title>${pageTitle}</title>`).replace("/*__DATA__*/", JSON.stringify(data)));

console.log(JSON.stringify({
  out: args.out, topLevel: `${pillar.slug} (${pillar.exists ? "existing" : "new"})`,
  supporting: supporting.map(p => `${p.slug} (${p.exists ? "existing" : "new"})`),
  links: links.length, alreadyLive: links.filter(l => l.live).length, warnings,
}, null, 2));
