---
name: internal-link-map
description: >
  Internal Link Map. Scans every article in src/content/articles, groups them into silos
  (one per `pageType: topLevel` article, with its `supporting` articles), and publishes an
  interactive diagram of the internal links as an Artifact, flagging broken links, empty silos,
  unassigned pages and supporting pages that don't link to their top-level page. Use when the
  user asks for the internal link map, link silos, internal linking audit, or to regenerate /
  refresh the link diagram.
---

# Internal Link Map

Builds a page showing each silo as a diagram: the top-level page in the middle, its supporting
pages as cards above (and below, when there are more than 4), and dashed arrows for every
in-body link. Each card shows its localhost and live secureliving.com URL, stacked.

## Steps

1. **Check frontmatter.** Every article needs `pageType: topLevel` or `pageType: supporting`
   (enforced by the schema in `src/content.config.ts`). The build output lists any article
   missing it under `missingPageType`; fix those first.

2. **Build the page.** From the project root, write to the scratchpad directory:

   ```bash
   node .claude/skills/internal-link-map/build.mjs --out <scratchpad>/link-map.html
   ```

   Optional: `--overrides <file.json>` to place supporting pages by hand, as
   `{ "supporting-slug": "top-level-slug" }` (or `null` to leave one unassigned). Use this when
   the user tells you which silo a page belongs in. Save the overrides file at
   `.claude/skills/internal-link-map/silo-overrides.json` so later runs keep the choice, and
   always pass it when that file exists.

3. **Publish.** Publish the HTML with the Artifact tool. If an Internal Link Map artifact already
   exists (check `action: "list"` for the title "Secure Living Link Map"), read it and publish
   to its `url` so the link stays the same. Otherwise publish new with `icon: "network"`.

4. **Report.** Relay the JSON summary the script prints: silo sizes, unassigned pages,
   broken links, links to articles that don't exist, and pages missing `pageType`.

## How it works

- **Links found:** markdown `](/section/slug/)` and `href="/section/slug"`, relative or absolute
  to secureliving.com. Only links to other articles count. A link whose path isn't
  `/home-security-systems/<slug>/` is marked broken (articles are only served there).
- **Silo assignment:** a supporting page joins the top-level page it links to most. Ties, or no
  link to any top-level page, leave it unassigned; the page suggests a likely silo for those.
- **Layout:** siblings that link to each other are placed side by side. Silos with no
  supporting pages are shown as a compact grid instead of full diagrams.
- **Files:** `build.mjs` (scan + data), `template.html` (the page; data is injected at
  `/*__DATA__*/`). Edit `template.html` for visual changes. The dev URL assumes Astro's default
  port 4321 (`LOCAL` in the template).
