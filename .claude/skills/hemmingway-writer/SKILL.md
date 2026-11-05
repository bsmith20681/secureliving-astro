---
name: hemmingway-writer
description: |
  Write a SecureLiving blog post with the Hemmingway model (hemmingway-1.5) writing the first draft
  and Claude doing the research, filling the gaps, and formatting. Claude gathers the POP content
  brief, video transcripts, competitor articles, and company data, sends them to the Hemmingway API,
  keeps Hemmingway's prose, writes whatever the draft is missing to satisfy the brief (length, title,
  FAQ, sections, POP terms), and turns it into a finished MDX article. Use when the user asks to write
  an article "with Hemmingway", "using the Hemmingway writer", or to have Hemmingway draft a post.
metadata:
  version: 1.4.0
---

# Hemmingway Writer

Hemmingway writes the first draft. You prepare everything it needs, send it, fill in whatever the draft is missing so the article satisfies the content brief, and format the result into an MDX article for the site. Hemmingway has no file or web access, so the prompt you build is all it will ever see.

Hemmingway reliably writes short. In testing it returned 1,400 to 1,700 words against a 3,150-word brief and skipped the title and the FAQ, even when they were listed as hard requirements. So gap-filling is the default: plan on writing roughly half the article yourself around Hemmingway's sections.

**Modes.** Gap-filling is on unless the user says otherwise:

- **Default (Hemmingway + Claude):** keep Hemmingway's prose and write the rest yourself until the article meets the brief.
- **Hemmingway only:** when the user asks for "Hemmingway only", "no gap filling", "don't add to it", or a straight comparison of Hemmingway's output, skip step 5 and format the draft as it is, with only the edits listed under "Allowed edits to Hemmingway's prose". Report what the brief still lacks instead of writing it.

The blog-writer skill (`.claude/skills/blog-writer/SKILL.md`) still governs the site's rules: headlines, POP brief handling, images, components, featured image, and the Chrome preview. Read it before starting. This skill replaces only its writing and humanizing steps (6 and 7).

## Setup

The API key lives in `.env` at the project root as `HEMMINGWAY_API_KEY=hemmingway_live_...`. Git already ignores `.env`. If the script reports that the key is missing, ask the user to add it. Never print the key, write it anywhere else, or put it in a prompt file.

## Workspace

Keep the working files in a `hemmingway/` folder inside the article's packet: `packets/<slug>/hemmingway/`, where `<slug>` is the packet's name (the main keyword in kebab case, for example `adt-alternatives`). See "Packets" in the blog-writer skill. The folder holds:

- `system.md`: the system prompt you send
- `user.md`: the user prompt you send
- `terms.json`: the POP ranges, for the term counter
- `draft.md`: Hemmingway's reply, saved by the script
- `draft.thinking.md`: its reasoning, saved by the script (useful for seeing why it made a choice)

If the folder already has a draft from an earlier run, don't overwrite it. Save the new one as `draft-2.md`, `draft-3.md`, and so on, using `--out`.

## Step 1: Gather the inputs

Follow blog-writer steps 1 to 5. Find the packet, tell the user which of its four pieces are there and which are missing, and read every file in it except the `hemmingway/` folder:

1. **Keyword and POP brief.** If the packet has a POP PDF (or the user uploads one), read it and take the keyword, target word count (the custom word count if the brief has one, otherwise POP's recommended count), section count, term ranges for the title, headings, and main content, page structure counts, related keywords, and related questions. Write the ranges to `terms.json` in this shape:

   ```json
   { "wordCount": 3152, "sections": 14,
     "title": { "adt": [1, 1] },
     "headings": { "adt alternatives": [1, 1] },
     "body": { "home security": [13, 20] } }
   ```

   The brief's secret key and content editor URL never go into `terms.json`, the prompts, or anywhere else in the repo. Without a brief, ask for the main and secondary keywords as blog-writer describes.

2. **Transcript and notes.** Use the packet's YouTube transcript and additional notes, plus anything the user uploads. Send the notes to Hemmingway in their own `## Ben's Notes` section after the transcripts, and say that where the notes and a transcript disagree, the notes win.
3. **Competitor articles.** Use the competitor `.md` files in the packet and any the user uploads. Tell Hemmingway never to link to or name them as sources.
4. **Company data.** Read the `.yaml` files in `src/content/companies/` for every brand the article covers.

## Step 2: Build the prompts

**`system.md`.** Copy `system-prompt.md` from this skill's folder unchanged. If the user gave you a writing sample or special instructions for this article, add them in a final section titled `## For this article`.

**`user.md`.** Build it from these sections, in this order. Paste source material in full. Hemmingway has a 150k-token context, and a typical article's inputs come to 30k–50k tokens.

```markdown
# Assignment

Write a [review / comparison / best-of / guide] article for the keyword "<main keyword>".

## Hard Requirements

These are not suggestions. Check each one before you finish.

1. Length: between <90% of target> and <110% of target> words. Reach it with detail from the transcripts, not filler.
2. Start with the title as an H1 line (`# ...`).
3. End with `## Frequently Asked Questions`, each question as an H3 followed by a two- to four-sentence answer.
4. Use about <N> sections (H2s and H3s combined). Each H3 section needs at least 120 words.
5. <N> tables, at least <N> lists, no dashes.

## Brief

- Put "<main keyword>" at the start of the title and in one heading.
- Use these terms in the body where they read naturally: <3 to 5 core terms, no ranges>. Readable writing comes first; leave a term out rather than force it.
- Include at least <N> comparison table(s), <N> lists, and an FAQ.
- Answer these questions in the FAQ: <related questions>. If the sources don't support an answer, leave the question out.
- Related keywords to work in where they fit: <related keywords>
- <Competitor brand names from the term list, e.g. Frontpoint>: Ben hasn't tested this, so mention it only to say it isn't ranked here.

## Suggested Outline

<Your outline: H2s and H3s with one line each on what goes there, based on the brief and what the competitor articles all cover. Hemmingway may reorder or merge sections if the article reads better.>

## Ben's Transcripts

### <file name> (primary source)
<full transcript>

### <file name>
<full transcript>

## Company Data

### <Brand>
<the yaml facts that matter: pricing, contract, equipment, cameras, automation, pros, cons, promo>

## Competitor Articles (structure and length only)

### <site name>, <word count> words
<full article>
```

**Keep the POP term list out of the prompt.** `terms.json` holds the full ranges, but Hemmingway sees only the main keyword and 3 to 5 core terms. When it got the full list of about 30 terms with ranges, it spent most of its reasoning working out how often to use each term, then returned 765 words against a 1,350-word brief. Step 6 brings the terms into range after the draft is in.

Pick the core terms from the brief's body terms. Choose multi-word topic phrases that name what the article covers and that Hemmingway might not use on its own (for example "professional monitoring", "security cameras", "smart home"). Skip single generic words like "home", "security", and "systems", which show up naturally, and skip the title and heading term lists. Don't send counts or ranges.

For the outline, use blog-writer's POP guidance: the brief's section count, its title and heading terms, one or more comparison tables, an FAQ, and no table of contents.

Show the user a one-line summary of what you're sending (keyword, sources, approximate size) before running the script. The first run of a session needs their go-ahead, since it spends credit.

## Step 3: Run Hemmingway

```bash
node tools/hemmingway/write.mjs \
  --system packets/<slug>/hemmingway/system.md \
  --user packets/<slug>/hemmingway/user.md \
  --out packets/<slug>/hemmingway/draft.md
```

Run it in the background and wait for it to finish. Thinking at `xhigh` can take several minutes. The script streams the reply, retries twice on a busy server or a 502, saves the draft, and prints the token count and cost.

- **Exit code 2** means the reply hit the 32,768-token output cap and is cut off. Rerun with `--effort medium`, which spends fewer tokens thinking.
- **402 `out_of_credit`** means the account needs more credit. Tell the user.
- **429 `allowance`** on a plan key means the plan's allowance is used up until `resets_at`. Tell the user.

Don't pass `--temperature`; the script never sets one, which is what Hemmingway recommends for prose.

## Step 4: Check the draft against the brief

Before formatting, list what the draft is missing compared with the brief: word count, title, section count, FAQ and its questions, tables, lists, any outline section it skipped or covered in a sentence or two, and the transcript details it left out (prices, installation, contract terms, camera specifics, who each system suits). That list is your work for step 5.

## Step 5: Fill the gaps

Skip this step in Hemmingway-only mode.

Write what the list from step 4 calls for, in this order of priority:

1. **Title,** if the draft has none, following the blog-writer Headlines rules and the brief's title ranges.
2. **FAQ,** covering the brief's related questions that the sources support, plus questions for the related keywords where they fit.
3. **Thin sections.** Expand them with paragraphs added after or between Hemmingway's, using the transcripts and company data: specifics it skipped, a worked example, who the system suits, the tradeoffs.
4. **Missing sections** from the outline or the brief's section count.
5. **Tables and lists** the brief requires.

Rules for the new material:

- Write in Ben's voice and match the draft's style, so the seams don't show. Follow the blog-writer Writing rules (no dashes, no not-X-but-Y contrasts, no one-line closers, and so on) for everything you write.
- Add paragraphs around Hemmingway's. Don't rewrite or replace its paragraphs to make room for yours.
- Every fact you add has to come from the transcripts or company data, the same as Hemmingway's.
- Aim for the brief's word count within about 10%, and stop there. Don't pad.

Keep a short list of what you wrote (which sections, which paragraphs) for the handover in step 7.

## Step 6: Format the article

Write the article to `src/content/articles/<file-name>.mdx`. The point of using Hemmingway is its prose, so keep its sentences. Change Hemmingway's wording only for the reasons in "Allowed edits to Hemmingway's prose" below.

1. **Frontmatter.** Same fields as other articles: `title` (from the H1, or the one you wrote in step 5; fix Hemmingway's only if it breaks the blog-writer Headlines rules or the brief's title ranges), `subtitle`, `metaDescription`, `category`, `pubDate`, `updatedDate`, `author: "ben-smith"`, `image`, `company`, `pageType`. Pick a featured image no other article uses, as blog-writer step 6 describes. Remove the H1 from the body, since the layout renders the title.
2. **Images.** Insert images from `src/assets/` with `<figure>`, `<Image>`, and a `<figcaption>`, the way existing articles do. Use only photos that match what the paragraph says.
3. **Components.** Add `CompanyCard` near the top for the recommended brands, `ProsCons` in each brand's section, `Admonition` for a real caveat, and convert the FAQ headings into the `FAQ` component. Never use ArticlePromoBox.
4. **Links.** Add internal links to existing articles where the text names them (reviews, comparisons, guides), using routes that exist. Use `<a href={companyData.website}>` for affiliate links, as existing articles do.
5. **Headings.** Title case every H2 and H3.
6. **POP check.** Run `node tools/hemmingway/pop-count.mjs <article.mdx> packets/<slug>/hemmingway/terms.json`. Bring terms into range with the smallest edits that work: swap a word for a brief term ("system" for "setup"), or add a term to a sentence that's already about that thing. Bold or italicize terms that deserve emphasis to reach the brief's counts. Rerun until the sections are in range or the remaining gaps would need forced sentences. Make these edits in your own paragraphs first, and touch Hemmingway's only when yours can't get a term into range. Hemmingway overuses "the [brand] system", "per month", and "month-to-month", so those are usually the terms you'll trim in its text. Hemmingway never saw most of the brief's terms (step 2), so expect more of them to start out of range than in a draft written against the full list. In Hemmingway-only mode, every one of these edits goes into its text, so stick to word swaps and short additions.
7. **Parentheses.** The `pop-count.mjs` output ends with a parenthetical count and a target of about one for every 300 words. If it says HIGH, cut the extras as "Allowed edits to Hemmingway's prose" describes. Do this in Hemmingway-only mode too, and rerun the counter to confirm.
8. **Fact check.** Compare every price, number, date, promotion, coupon code, and product claim, in Hemmingway's text and yours, with the transcripts and company data. Remove anything unsupported, or rewrite the sentence so it says only what the source does.

### Allowed edits to Hemmingway's prose

- Removing or correcting an unsupported fact (step 6, item 8)
- Small edits to reach POP ranges (step 6)
- Replacing any em dash or en dash with a period, comma, or colon (not parentheses)
- Cutting parentheticals down to about one for every 300 words: turn the aside into its own sentence, work it into the sentence with a comma, or delete it if it adds nothing. Keep short ones that only hold an abbreviation, a unit, or a model name
- Changing words in all caps for emphasis (ONLY, DON'T) to italics
- Removing leftover video phrases ("in this video", "link in the description")
- Fixing a typo or a sentence that no longer reads after another edit

Don't run the blog-writer humanize pass on Hemmingway's text, and don't restyle sentences you merely would have written differently.

## Step 7: Review and hand over

Open the article in Chrome as blog-writer step 8 describes. Then tell the user:

- The file path and preview URL
- Word count and section count against the brief, and which POP terms are still out of range
- How the article splits between Hemmingway and you: Hemmingway's word count, and what you wrote (step 5)
- What you removed or changed in Hemmingway's prose, and why
- Any related question or brief item left out because the sources didn't support it
- The token count and cost the script reported
