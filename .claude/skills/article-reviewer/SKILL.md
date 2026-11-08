---
name: article-reviewer
description: |
  Review a SecureLiving article in src/content/articles against a 100-point rubric (search
  intent, accuracy, SEO coverage, human voice, affiliate pitch, experience and trust,
  readability, formatting), write a scored report with quoted evidence and must-fix items,
  and optionally apply the fixes and re-score. Use when the user asks to review, grade,
  score, audit, critique, or give feedback on an article or draft, or to "review and fix"
  one before publishing.
metadata:
  version: 1.2.0
---

# Article Reviewer

You review SecureLiving articles the way a strict editor would before publishing. SecureLiving.com earns affiliate commissions on home security systems, so a good article answers the searcher's question, gets every fact right, ranks for its keyword, sounds like Ben wrote it, and makes a convincing case for the right system for the right reader.

The review has two modes:

- **Review** (default): score the article and write a report. Don't change the article.
- **Review and fix**: when the user says "fix", "apply", "implement the feedback", or "review and fix", do the review, apply the fixes, then score it again.

## Step 1: Gather the inputs

1. **Article.** Find the `.mdx` file in `src/content/articles/`. If the user didn't name one, use the most recently modified article and say which one you picked.
2. **Packet.** Take the article's main keyword, turn it into a slug, and look for `packets/<keyword-slug>/` (see blog-writer's "Packets" section for what a packet holds). Read `searchers-intent.md`, the POP brief PDF, the YouTube transcript, and the notes. Skim the competitor articles for what subtopics they cover. Skip `hemmingway/` except for `terms.json`.
3. **Terms.** If `packets/<slug>/hemmingway/terms.json` exists, use it. Otherwise, if there's a POP brief, write the brief's ranges to `packets/<slug>/reviews/terms.json` in the same shape (see the comment at the top of `tools/hemmingway/pop-count.mjs`). Never copy the brief's secret key or content editor URL anywhere.
4. **Facts.** Read the `.yaml` file in `src/content/companies/` for every brand the article names, and skim the other articles that cover the same brands. The yaml files are the source of truth for prices, contracts, fees, and equipment.
5. **Writing rules.** Read `.claude/skills/blog-writer/SKILL.md`. Its Headlines rules, POP brief rules, link rule, "Ben's Preferences", and AI patterns (§1 to §29) are the standard this review enforces. Breaking one of Ben's Preferences costs points in the component it belongs to, the same as breaking a rule written into the rubric.
6. **Ben's comments.** Run `node tools/live-editor/feedback.mjs list --file <article file name>`. Open `fix` comments on this article are Ben's direct requests: list each one in the report under "Must fix" with its comment ID, and in fix mode close it afterwards with `feedback.mjs close <id> --status applied`. Leave open likes and dislikes for the learn-feedback skill, but use them as extra evidence when scoring.

If there is no packet, say so and review without it: score SEO coverage against the article's own keyword and the length of similar articles, and mark Accuracy facts that only the transcript could confirm as "unverified" instead of wrong.

## Step 2: Run the checks

Run both scripts from the project root:

```
node .claude/skills/article-reviewer/check-article.mjs <article.mdx>
node tools/hemmingway/pop-count.mjs <article.mdx> <terms.json>
```

The first checks formatting, the title, headings, links, AI-word and dash hits, long sentences and paragraphs, and first-person voice. The second counts the POP terms, word count, sections, bold, italics, tables, and lists against the brief.

Treat script output as leads, not verdicts. Confirm each hit in context before it costs points: "quietly" in a quote is fine, and a 40-word sentence can read well. Every `MUST` line from the lint script that you confirm goes on the must-fix list.

## Step 3: Score the rubric

Read the whole article once as a searcher would, then score each component. Pick the level whose description fits best, then pick a score inside its range. For every point you take off, quote the passage (with its line number) and say what's wrong. A deduction without evidence doesn't count.

### 1. Search intent and answer (15)

Does the article resolve why the searcher is here, fast? Score it against the packet's `searchers-intent.md` and blog-writer's "Writing For The Searcher's Intent" section. List each reason or worry in the intent file, and for each one, quote where the article answers it or note that it doesn't. Without an intent file, infer the intent from the keyword and the brief's related questions, and say in the report that you did.

| Level | Points | Description |
| --- | --- | --- |
| Excellent | 13-15 | Every reason in the intent file gets a clear, supported answer. The opening speaks to the reader's situation and gives the short answer for it (the pick, the price, the yes or no). Recommendations are tied to the reason they solve, in second person. Title, H1, and subtitle match the intent (review, comparison, best-of, how-to). No sections spent on background this reader already knows. |
| Good | 9-12 | Answers the main reason, but one secondary reason is thin or missing, or the answer takes a few paragraphs to arrive, or one section drifts off-topic. |
| Needs work | 5-8 | Covers the topic without speaking to the reader's situation (a generic roundup), misses a main reason, or buries the answer past the halfway point. |
| Failing | 0-4 | Doesn't answer the query, addresses a different searcher than the intent file describes, or targets a different keyword than the packet. |

### 2. Accuracy (15)

Is every fact right and supported?

| Level | Points | Description |
| --- | --- | --- |
| Excellent | 13-15 | Every price, fee, contract term, and equipment claim matches the company yaml or the transcript. Claims match what other SecureLiving articles say. No invented tests, numbers, or credentials. |
| Good | 9-12 | One minor slip, such as a rounded price or a vague equipment detail, that doesn't change a buying decision. |
| Needs work | 5-8 | A wrong fact a reader might act on, or several unsupported claims. |
| Failing | 0-4 | Multiple wrong prices or contract terms, or claims that contradict the yaml. |

Check every number. List each fact you couldn't verify from any source in the report under "Unverified".

### 3. SEO coverage (15)

Does it meet the POP brief?

| Level | Points | Description |
| --- | --- | --- |
| Excellent | 13-15 | Word count within 10% of the target. Section count in range. Title, headings, and body term totals in range, with no term stuffed. Has an FAQ that answers the brief's related questions, at least one comparison table, and the recommended lists. |
| Good | 9-12 | One section total or a handful of terms out of range, or the word count is 10-20% off. |
| Needs work | 5-8 | Several section totals out of range, missing FAQ or table, or word count more than 20% off. |
| Failing | 0-4 | Ignores the brief, or the main keyword is missing from the title or headings. |

Don't take points for terms that could only fit by forcing them in; blog-writer puts readable writing ahead of the score. Don't deduct for POP's link and image ranges (blog-writer explains why they're unrealistic).

Internal links: blog-writer leaves them out of first drafts on purpose, so don't deduct for missing ones. Note in the report whether a `supporting` article links to its top-level page, and flag broken internal links (those are must-fix).

### 4. Human voice (15)

Does it read like Ben wrote it?

| Level | Points | Description |
| --- | --- | --- |
| Excellent | 13-15 | No confirmed §1 to §5 patterns, no dashes. Opinions, reactions, and asides that sound like the transcript. Sentence length varies. |
| Good | 9-12 | One or two strong-pattern sightings, or a few weak ones clustered in one passage. Voice is present but flat in places. |
| Needs work | 5-8 | Repeated contrasts, closers, triads, or stock AI words across several sections. Reads like a neutral roundup. |
| Failing | 0-4 | Reads as unedited AI output throughout. |

Dashes in body text and in the subtitle or metaDescription are must-fix (§8).

### 5. Affiliate pitch (10)

Will the right reader click through and buy?

| Level | Points | Description |
| --- | --- | --- |
| Excellent | 9-10 | Clear recommendation, earned by specific reasons (price, feature, contract, who it suits). Says which kind of buyer each system fits. Affiliate links sit where the reader decides. No empty hype. |
| Good | 6-8 | Recommendation is clear but the reasons are generic, or a CTA is missing at a natural decision point. |
| Needs work | 3-5 | Hedges so much there's no real pick, or pushes one brand at everyone. |
| Failing | 0-2 | No recommendation or no affiliate links. |

### 6. Experience and trust (10)

Does it show first-hand testing?

| Level | Points | Description |
| --- | --- | --- |
| Excellent | 9-10 | Specific details only someone who used the system knows (install time, an app quirk, what the alerts were like). Names real downsides. Photos are Ben's own. Title claims match the body. |
| Good | 6-8 | Some first-hand detail, but long stretches read like spec sheets. |
| Needs work | 3-5 | Mostly generic. Few or no downsides. |
| Failing | 0-2 | No sign of hands-on use, or the title claims testing the body never shows. |

### 7. Readability and structure (10)

Can a skimmer find their answer?

| Level | Points | Description |
| --- | --- | --- |
| Excellent | 9-10 | Short paragraphs, descriptive headings, logical order (answer, then options, then details, then FAQ). Tables and lists where they help. Smooth transitions. |
| Good | 6-8 | A few long paragraphs or sentences, or one section out of order. |
| Needs work | 3-5 | Walls of text, vague headings, or repeated content across sections. |
| Failing | 0-2 | Hard to follow; no clear structure. |

### 8. Formatting and build (10)

Will it build and render correctly?

| Level | Points | Description |
| --- | --- | --- |
| Excellent | 9-10 | No lint `MUST` items. Frontmatter complete. Title follows the Headlines rules. Headings in title case. Images have alt text and captions. Components used correctly, no ArticlePromoBox, no table of contents. |
| Good | 6-8 | Minor issues: a heading not in title case, a missing caption, metaDescription out of length. |
| Needs work | 3-5 | Several minor issues, or a reused featured image. |
| Failing | 0-2 | Any build-breaking error. |

### Must-fix items

These block publishing regardless of the total score:

- A wrong price, fee, contract term, or equipment claim.
- An invented claim: a test, number, time span, or credential no source supports (especially in the title).
- Anything the lint script tags `MUST` that you confirm: build errors, missing frontmatter, bad imports, ArticlePromoBox, a table of contents, dashes, a year in parentheses or followed by a colon in the title, broken internal links.
- A link to, citation of, or copied sentence from a competitor article.
- The POP brief's secret key or content editor URL anywhere in the repo.

**Verdict:** "Ready to publish" at 85+ with no must-fix items; "Revise" at 70-84 or with any must-fix item; "Rewrite" below 70.

## Step 4: Write the report

Save it to `packets/<slug>/reviews/<article-file-name>-review-N.md`, using the next free N so earlier reviews are kept. Use this shape:

```markdown
# Review: <article title>

Article: src/content/articles/<file>.mdx · Reviewed <date> · Verdict: <verdict>

| Component | Score | Max |
| --- | --- | --- |
| Search intent and answer | 12 | 15 |
| ... | | |
| **Total** | **81** | **100** |

## Searcher's intent
Each reason from searchers-intent.md, and the line that answers it (or "not answered").

## Must fix
1. Line 42: "$19.99/month" but cove.yaml lists $17.99. Change to $17.99.

## Should fix
Ranked by points recoverable. Each item: component, line, quoted passage, the problem, and the concrete fix.

## POP terms out of range
term, count, target range, suggested change (or "leave: would be forced").

## Unverified
Facts no source confirms, so Ben can check them.

## What works
Two or three specific strengths, so the fix pass doesn't edit them away.
```

Then give the user the total, the verdict, the must-fix items, and the top three should-fix items in chat, plus the report path.

## Step 5: Fix (review-and-fix mode only)

1. **Fix in order:** must-fix items first, then should-fix items by points recoverable.
2. **Follow blog-writer.** Every edit obeys its writing rules and its "SecureLiving articles" section: keep the pitch, the recommendations, and the affiliate links. Don't add a fact, price, or claim that no source supports. If a fix needs a fact you don't have, leave it and list it under "Needs Ben".
3. **Stay in scope.** Don't add internal links (a later pass does that). Don't rewrite passages the report lists under "What works". Change frontmatter only for a must-fix item or a title, subtitle, or metaDescription problem.
4. **Re-check.** Run both scripts again and fix anything new.
5. **Re-score** with the same rubric and add a section to the same report:

   ```markdown
   ## After fixes
   | Component | Before | After |
   ...
   Changed: <short list of what you changed>
   Not fixed: <items left and why>
   Needs Ben: <facts or decisions only Ben can supply>
   ```

6. **Open it.** Open the article on the dev server as blog-writer's step 8 describes.

## Keep the reviewer independent

A model scoring its own writing grades too generously. If you wrote or edited this article earlier in this conversation, run Steps 1 to 4 in a fresh subagent (Agent tool, general-purpose) and give it only the article path, the packet path, and this skill's path. Do the fix pass yourself from its report, then have a fresh subagent do the re-score.
