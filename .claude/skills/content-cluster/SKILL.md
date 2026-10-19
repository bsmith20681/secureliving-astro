---
name: content-cluster
description: |
  Plan and write a SecureLiving content cluster: one top-level (pillar) page plus 1-10
  supporting pages that all link back to it. Use when the user asks to build a content
  cluster, topic cluster, silo, pillar page with supporting articles, or a group of related
  articles around one main keyword. Also use when the user gives a top-level keyword and
  supporting keywords and wants a diagram of the planned cluster and its links.
metadata:
  version: 1.0.0
---

# Content Cluster

A content cluster is one **top-level page** (`pageType: topLevel`) that targets a broad main
keyword, plus **1-10 supporting pages** (`pageType: supporting`) that each target a narrower
keyword under that topic. The top-level page covers the topic broadly and links out to every
supporting page. Each supporting page goes deep on one subtopic and links back to the
top-level page. Together they show Google the site covers the topic completely.

Every article in the cluster is written with the **blog-writer** skill. Read
`.claude/skills/blog-writer/SKILL.md` before writing anything; its writing style, research
steps, and humanizing rules apply to every page. This skill adds the planning and linking.

## Steps

### 1. Gather inputs

Ask the user for anything they haven't given:

- **Cluster topic and main keyword** for the top-level page (e.g. "vivint review", "best home
  security systems").
- **Supporting keywords**, if they already have them. If not, you'll propose them in step 2.
- **How many supporting pages** (1-10). If they don't say, propose a number based on how many
  distinct subtopics the keyword research supports. Never pad the cluster to hit a number.
- **Source and competitor material**, as described in blog-writer steps 3-4. The
  `knowledge-base/youtube-transcripts/` folder is the default source.

### 2. Check what already exists

Read the frontmatter of every file in `src/content/articles/`. For each one note its slug,
title, `pageType`, and `company`.

- If an existing **top-level** page already covers the main keyword, use it as the cluster's
  top-level page instead of writing a new one. Tell the user, and plan only the supporting
  pages plus edits to add links to the existing page.
- If an existing article already covers a proposed supporting keyword, reuse it as a member of
  the cluster (add the links) rather than writing a duplicate. Flag any existing article that
  would compete with a new page for the same keyword.
- To see current silos, you can run the internal-link-map build script (step 6) before
  planning.

### 3. Plan the cluster

Don't run keyword research tools (Ahrefs or others) for this. Work from the keywords the user
gives you. If they paste volume or difficulty numbers, include them; otherwise leave them out.

If you're proposing supporting topics, pick ones that:

- Have their own search intent the top-level page can't fully answer in a section (how-to,
  troubleshooting, "does X work without Y", cost, cancellation, comparisons, alternatives).
- Don't overlap with each other. One keyword per page; group close variations onto the same
  page as secondary keywords.
- Lead naturally to the money pages (reviews, comparisons, deals) so the cluster still earns
  affiliate commissions.

Present the plan as a table and **wait for the user to approve or edit it** before writing:

| Page | Slug | Main keyword | Secondary keywords | Intent / angle | New or existing |
|---|---|---|---|---|---|
| Top-level | `vivint-review` | vivint review | ... | ... | existing |
| Supporting 1 | `does-vivint-work-without-wifi` | ... | ... | ... | existing |
| Supporting 2 | `...` | ... | ... | ... | new |

Below the table, list the planned links (which page links to which, and the anchor text).

### 3b. Publish the cluster plan diagram

Draw the plan as an Artifact so the user can see the cluster and how its pages link before
anything is written. Run this after every plan, and on its own whenever the user gives you a
top-level keyword and supporting keywords and asks to see the cluster (skip straight here if
they don't want articles written).

1. **Write the plan file** to `.claude/skills/content-cluster/plans/<top-level-slug>.json`
   (create the folder if needed) so the writing steps and later runs reuse it:

   ```json
   {
     "name": "Vivint",
     "topLevel": { "keyword": "vivint review", "slug": "vivint-review",
                   "secondary": ["is vivint worth it"],
                   "intent": "Commercial: should I buy Vivint" },
     "supporting": [
       { "keyword": "vivint cancellation fee", "secondary": ["cancel vivint"],
         "intent": "How to cancel and what it costs" }
     ],
     "links": [
       { "from": "vivint-cancellation-fee", "to": "vivint-review", "anchor": "our full Vivint review" }
     ]
   }
   ```

   Only `keyword` is required on each page. `slug` defaults to the keyword in kebab case; set
   it to an existing article's slug to reuse that article. `volume` and `kd` are optional;
   add them only when the user gives you the numbers, and the page hides them otherwise. `links` holds the sibling links and any anchor text you've chosen; the
   script adds the top-level to supporting links (both directions) on its own.

2. **Build the page** from the project root:

   ```bash
   node .claude/skills/content-cluster/plan.mjs --plan <plan.json> --out <scratchpad>/cluster-plan.html
   ```

   The script checks `src/content/articles` and marks each page as new or existing, each link
   as planned or already live, and prints warnings: the supporting count outside 1-10,
   duplicate slugs or keywords, and an existing article whose `pageType` doesn't match its
   planned role.

3. **Publish** the HTML with the Artifact tool, `icon: "network"`. When you update the plan
   for the same cluster, republish the same file path so the link stays the same. Relay the
   script's warnings to the user with the link.

### 4. Write the top-level page first

Follow blog-writer steps 3-7 for the main keyword. Then:

- Frontmatter: `pageType: topLevel`, plus the usual fields from the schema in
  `src/content.config.ts` (title, subtitle, metaDescription, category, pubDate, updatedDate,
  author, image, company when it's about one brand).
- Give each supporting page a short section (an H2 or H3) that summarizes the subtopic in a
  paragraph or two and links to the supporting page for the full answer. Don't cover the
  subtopic so fully that the supporting page has nothing left to add.
- Save as `src/content/articles/<slug>.mdx`.

### 5. Write each supporting page

For each supporting page, follow blog-writer steps 3-7 for its keyword. Then:

- Frontmatter: `pageType: supporting`.
- Link to the top-level page at least once, early in the article (ideally in the first two
  sections), with descriptive anchor text that uses or varies the top-level main keyword.
  Don't use "click here" or the same anchor text on every supporting page.
- Link to 1-2 sibling supporting pages where it helps the reader. Don't link every page to
  every other page.
- Keep the article focused on its own keyword. Point readers to the top-level page for the
  broad topic instead of repeating it.

Write pages one at a time and save each one before starting the next, so a long cluster
doesn't lose work.

### 6. Link and verify

- If the cluster reuses existing articles, edit them to add the missing links (supporting page
  to top-level page, and top-level page to the supporting page). Change only the prose around
  the new link; leave the rest of the article as it is.
- Internal links use the form `[anchor text](/home-security-systems/<slug>/)`. Any other path
  is reported as broken.
- Run the internal-link-map build to confirm the silo:

  ```bash
  node .claude/skills/internal-link-map/build.mjs --out <scratchpad>/link-map.html
  ```

  Pass `--overrides .claude/skills/internal-link-map/silo-overrides.json` if that file exists.
  Every supporting page in the cluster should land in the top-level page's silo with no broken
  links. Fix anything it flags. If the user wants the diagram, publish it as described in the
  internal-link-map skill.
- Run `npm run build` to make sure the frontmatter passes the schema and
  the MDX compiles.

### 7. Report

Give the user a short summary: the final cluster table (page, slug, keyword, new or edited),
the links added, anything the link-map check flagged, and any keyword you dropped or merged
and why.
