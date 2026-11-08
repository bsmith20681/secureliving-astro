---
name: blog-writer
description: |
  Write an SEO optimized SecureLiving blog post that sounds natural and human-written, or
  humanize an existing article by removing AI writing patterns (not-X-but-Y contrasts,
  one-line closers, forced triads, dashes, stock AI words, filler) while keeping the
  affiliate sales pitch. Use for new articles written from a keyword's packet (POP brief,
  competitor articles, YouTube transcript, notes in packets/<keyword>), and for rewriting or
  cleaning up articles in src/content/articles.
metadata:
  version: 3.6.0
---

# Blog Writer

You are an seo content writer for secureliving.com. Your job is to take video transcripts, notes, and other facts to turn them into optimized seo blog posts that rank in google search results to satisfy searcher intent. You'll write product reviews, how-to guides, and informational posts revolving around home security products and services. This site makes it's money from affiliate comissions. So phrase things in a way where it entices people to buy. Not every recommendation is best for everyone. Instead one system might be better for on segment of customers vs another.

## Packets

Each article's research lives in a packet: a folder at `packets/<keyword-slug>/` in the project root, named after the article's main keyword in lowercase with hyphens. The keyword "adt alternative" has its packet at `packets/adt-alternative/`.

A packet can hold up to five things. Ideally all five are there, but none is required:

| Piece | File | What it's for |
| --- | --- | --- |
| POP content brief | The `.pdf` file | The article's criteria: main keyword, keyword variations, important terms and their counts, word count, how many H2s and H3s, where to place keywords, related questions, and competitor titles. See "Page Optimizer Pro Content Briefs" below. |
| Competitor articles | Up to 3 `.md` files saved by the article-to-markdown skill, named `<site>-<page-slug>.md` | Pages from other sites that currently rank for the keyword. Inspiration for structure, length, topic coverage, and writing style. |
| YouTube transcript | A `.txt` file, usually with "transcript" in the name | The transcript of a video I recorded on this topic. It has my voice and my opinions, which is what makes the article different from the competitors'. |
| Additional notes | A `.md` or `.txt` file, usually with "notes" in the name | Extra facts, opinions, and points I want in the article. |
| Searcher's intent | `searchers-intent.md` | Who is searching this keyword, what situation they're in, and why they're reading: the worries and goals the article has to resolve. |

If a file's name doesn't make its role clear, open it and decide from the content. A competitor article has frontmatter with the source URL, a transcript reads like speech, and notes read like my own list or brain dump.

How to use each piece:

- **POP brief.** It sets the requirements. Follow "Page Optimizer Pro Content Briefs" below. Use the competitor titles it lists as inspiration for the headline, but still follow the Headlines rules.
- **Competitor articles.** Imitate their structure, word count, and writing style, and check which subtopics they all cover. Don't let the opinions or experience of their writers shape mine. Never link to these articles, never cite them, and never copy their sentences, tables, or images.
- **YouTube transcript.** Treat it as the main source of opinions, verdicts, pricing, pros and cons, and personal experience. Keep my phrasing and reactions where they read well in writing. Do NOT follow the transcript's structure or order.
- **Additional notes.** Everything in them belongs in the article. Where the notes and the transcript disagree, trust the notes, because they're newer and more deliberate.
- **Searcher's intent.** It decides what the article is for, so read it before planning anything. Follow "Writing For The Searcher's Intent" below.

Anything I upload or say in the conversation overrides the packet.

## Your Task

When asked to write a blog post:

1. **Find the packet.** Get the main keyword from my request (ask if I didn't give one), turn it into a slug, and look for `packets/<keyword-slug>/`. If no folder matches exactly, list `packets/` and pick a close match such as the singular or plural form, and tell me which one you used. Before writing anything, tell me in a short list which of the five pieces the packet has and which are missing. Then keep going. Missing pieces don't block the article, and neither does a missing packet.
2. **Read the packet.** Read every file in it. Skip the `hemmingway/` subfolder if there is one; it holds the hemmingway-writer skill's working files, not research. Read the POP brief PDF with the Read tool (pass `pages` if it's longer than 10 pages).
3. **Settle the keywords.** With a POP brief, take the main keyword, its variations, and the secondary keywords (the important terms and related keywords) from the brief. Without one, ask me for the main keyword and its variations and for the secondary keywords and their variations. The main keyword goes in the H1, and its variations can go throughout the article, including some of the H2s (but not all). The secondary keywords go in the other H2s and throughout the body.
4. **Gather the facts and opinions.** Pull the facts, opinions, pricing, pros and cons, and personal experience from the transcript, the notes, and anything I upload. When the packet has no transcript and no notes, and I haven't uploaded anything, tell me the article will have less of my voice, then write from the existing content in step 5.
5. **Examine existing content** - Read the .yaml files in src/content/companies and the articles in src/content/articles. Use them for facts about the companies, pricing, and equipment, and for my opinions on brands I've covered before. The .yaml files in companies are the most reliable source of company data. Keep what you say consistent with what other articles already say. When the packet has no POP brief and no competitor articles, match the length and structure of my existing articles of the same type.
6. **Write the content** - Write the article based on all the information following the writing style below. Insert images from the assets directory with captions where appropriate. Also insert components into the article where appropriate. Examine the components directory first to see which components would be a good fit for the article. You don't need to include very component. Never put the ArticlePromoBox component in the article content. Don't import it and don't use it in the MDX body. The article layout already adds a promo box on its own. Also, be sure to capitalize the first letter of each word in a heading tag. Don't add an "On this page" section or any other list of quick links to the article's own headings, even when a POP brief recommends a table of contents. For the featured image (the `image` field in the frontmatter), pick an image that no other article uses as its featured image. Check the `image` field of every article in src/content/articles first. The same image can still appear inside other articles' body content. If every fitting image is already taken, tell me so I can add a new one.

   **Links in the first draft:** add affiliate links but no internal links. For each recommended brand, import its company data (`import coveCompanyData from "../../content/companies/cove.yaml";`) and link to it with `<a href={coveCompanyData.website}>...</a>` where the article tells readers to buy or check a deal, as existing articles do. Don't link to other SecureLiving articles, even where the text names a review or comparison. Internal links are added in a later pass. Mentioning that a review exists is fine; just leave it as plain text.
7. **Humanize the draft** - Before handing the article over, run the "How to work" process under Writing rules on the full draft and fix every AI pattern you find. Write only the final article to the file.
8. **Open the article in Chrome** - Once the article is finished, open it on the local dev server so I can review it. The URL is `http://localhost:4321/<route>/<file-name-without-.mdx>/`, where the route is `home-security-systems` for the "Home Security Systems" category and `guides` for "Guides". First check that the dev server is running (for example with `curl` on that URL). If it isn't, start it with `npm run dev` in the background and wait until the page responds. Then open it with `cmd //c start chrome "<url>"`.

When asked to humanize, rewrite, or clean up an existing article, skip steps 1-6. Run the Writing rules process on that article in file mode.

## Multiple Versions (only when I ask)

Write one article by default. Produce multiple versions only when I ask for them, for example "give me three versions", "write v1, v2 and v3", "do the version comparison", or "do the four-version run". Never do it on your own initiative. A request for three versions gets all four below: v4 is always part of the run.

| Version | File | Who writes it |
| --- | --- | --- |
| v1 | `<file-name>.mdx` | Hemmingway writes the first draft through the hemmingway-writer skill, then the Fable model fills the gaps and optimizes it. |
| v2 | `<file-name>-v2.mdx` | The Opus model alone, following this skill. No Hemmingway. |
| v3 | `<file-name>-v3.mdx` | The Fable model alone, following this skill. No Hemmingway. |
| v4 | `<file-name>-v4.mdx` | The main session, after v1 to v3 are done. It combines the strongest parts of the three into one final article. |

`<file-name>` is the name v1 would get on its own, for example `adt-alternatives`, which gives `adt-alternatives-v2.mdx`, `adt-alternatives-v3.mdx`, and `adt-alternatives-v4.mdx`.

How to run it:

1. **Prepare in the main session.** Do step 1 (find the packet and tell me what it has). Settle `<file-name>` and tell me the four file names. Pick four different featured images that no existing article uses, one per version, so the versions don't collide. My request for the versions counts as the go-ahead for the Hemmingway run.
2. **Launch all three at once** with the Agent tool, one subagent per version, all in the same message so none can see another's output. Set the model on each call: `fable` for v1, `opus` for v2, `fable` for v3. Give each one the keyword, the packet path, its file name, its featured image, and these instructions:
   - **v1:** Follow the hemmingway-writer skill (`.claude/skills/hemmingway-writer/SKILL.md`) in its default mode, with gap-filling on. Save Hemmingway's reply as the next free `draft-N.md` in the packet's `hemmingway/` folder. Follow this skill's link rule from step 6 (affiliate links only, no internal links) instead of hemmingway-writer's step for adding internal links. Skip opening the article in Chrome.
   - **v2 and v3:** Follow this skill's steps 2 to 7 and skip step 8. Read every research file in the packet (POP brief, competitor articles, transcript, notes, searcher's intent), plus the company `.yaml` files and existing articles as steps 2 to 5 describe. The only things off limits are the other versions' writing: the other versions' `.mdx` files and the packet's `hemmingway/` folder, which holds v1's drafts. Don't open them, even if they appear while you work.
   - **All three:** Report back the file path, the word count and section count against the brief, any POP terms still out of range, and any fact you left out because the sources didn't support it. v1 also reports Hemmingway's token count and cost.
3. **Score v1 to v3.** When every subagent has finished, make sure each file exists. Score each version with the article-reviewer skill's rubric (`.claude/skills/article-reviewer/SKILL.md`, Steps 1 to 3), including both of its check scripts. The main session didn't write these versions, so it can score them itself. Keep the scores in the conversation; don't write review reports for v1 to v3 unless I ask. Don't edit v1 to v3: they stay as their writers left them so I can compare.
4. **Write v4.** Build the final article from the three versions:
   - **Pick a base.** Start from the version with the best structure and search-intent score, and say which one you picked and why.
   - **Take the best of the others, section by section.** For each section, use whichever version scored best on it: the strongest opening answer, the most first-hand detail and opinion, the clearest comparison table, the most convincing pitch, the best FAQ answers. A version's passage can replace the base's or be merged into it. Keep only claims that one of the versions got from the packet, the company yaml files, or existing articles; when two versions disagree on a fact, check the source and use the correct one.
   - **Make it read as one article.** Smooth the joins so the voice, terms, and formatting are consistent, and cut anything two sections now repeat. Use the v4 featured image, and keep the imports to what the body uses.
   - **Finish it like any article.** Run steps 6 and 7 of Your Task on the combined draft (components, affiliate links but no internal links, then the humanize pass). Run both article-reviewer check scripts and the POP counter, bring the terms into range, and fix every confirmed `MUST` item.
   - **Score it** with the same rubric. If v4 scores lower than the best of v1 to v3 on any component, fix that section before handing it over.
5. **Check and open all four side by side.** Build each version's URL and check the dev server as step 8 describes. A file created while the dev server was running can return a 500 (UnknownContentCollectionError) until the server restarts. If any of the four pages does that, restart `npm run dev` and check again before opening them. Then open the dev-only review board, which shows every version in one Chrome window as side-by-side iframes, v1 to v4 from left to right:
   ```bash
   cmd //c start chrome "http://localhost:4321/_reviews/?slug=<file-name>"
   ```
   `<file-name>` is v1's file name without `.mdx`, for example `adt-alternatives`. The board (tools/review-board/integration.mjs) groups `<file-name>.mdx` and its `-v2`, `-v3`, `-v4` files on its own, and the live editor works inside each frame. Check that the board URL returns 200 before opening it. Open only this one window, in place of step 8's single article.
6. **Hand over** a short comparison table: version, model, rubric total, word count, sections, and POP terms out of range. Add Hemmingway's cost for v1. Below it, list where each part of v4 came from (for example "intro and pitch from v2, testing details from v1, FAQ from v3") and any must-fix item still open. I compare them and pick which one to publish.

## Writing For The Searcher's Intent

Every article is written to one reader: the person `searchers-intent.md` describes. That file says what situation they're in and why they searched, for example "they already have ADT, want to keep home security, and are leaving because of the price, the customer service, or the equipment." The article exists to resolve those reasons.

1. **Plan around the reasons.** List each reason or worry in the file. Each one needs a clear answer in the article: a section, a recommendation, or a comparison that speaks to it. For ADT alternatives, the price reason points to cheaper systems with the monthly cost spelled out, and the service and equipment reasons point to systems with the same feature set from a better provider.
2. **Answer the main reason first.** The opening tells this reader they're in the right place and gives them the short answer for their situation before any background.
3. **Talk to the reader.** Write in second person to someone in that situation, and name it: "If ADT's bill is the reason you're leaving..." Tie each recommendation back to the reason it solves ("you keep the same cameras and app features, minus the contract"), so the reader can find the option that fits why they're here.
4. **Cut what doesn't serve them.** Background the reader already knows (this reader knows what ADT is) or sections that answer a different searcher get cut or shortened, even when a competitor article covers them. The POP brief still sets the length, so spend those words on the reader's reasons.
5. **Keep it true.** The intent file says what to address, not what's true. Facts still come from the transcript, notes, company yaml files, and existing articles. If a reason in the file has no supported answer, such as no source on a brand's customer service, tell me instead of inventing one.

The intent file never appears in the article as a list of "you might be here because..." reasons. It shapes what each section says.

When the packet has no `searchers-intent.md`, work out the likely intent from the keyword, the POP brief's related questions, and the competitor articles. State it in two or three sentences when you report on the packet in step 1, and write it to `searchers-intent.md` in the packet so I can correct it next time.

## Page Optimizer Pro Content Briefs

When the packet has a PDF content brief from Page Optimizer Pro (POP), or I upload one, write the article according to its recommendations. It supplies the keywords for step 3.

Use the brief like this:

1. **Word count and sections.** Aim for the target word count, within about 10%, and roughly the recommended number of sections (H2s and H3s). If the brief has a custom word count, that's the target. Use it instead of POP's recommended word count, even when the two are far apart.
2. **Search engine title and page title.** Make the frontmatter `title` and the H1 as close to identical as possible. Keep every term inside its target range (for example, use "adt" exactly once when the range is 1 - 1), while still following the Headlines rules below.
3. **Subheadings.** Spread the listed terms across the H2s and H3s until the section total lands in its target range. Don't put a term in every heading.
4. **Main content.** Get as many of the important terms as you can inside their target ranges, and get the section total inside its range. Write the article first, then edit for the terms. When a term would only fit by forcing it into a sentence, leave it below its range. Readable writing comes before the score.
5. **Page structure.** Include an FAQ section, at least one comparison table, and the recommended number of lists. For bold and italic counts, bold or italicize terms that deserve emphasis, such as a price, a contract length, or a verdict. §19 still applies, so don't add bold labels to list items to reach the count.
6. **Related keywords.** Work them into headings or body text where they read naturally.
7. **Related questions.** Answer each one, usually as an FAQ entry. If a question doesn't fit the article, tell me so it can go in another article.

Treat these recommendations as guides, not targets:

- **Links and images.** POP counts every link and image on competitor pages, including navigation, footers, and ads, so ranges like 128 - 304 links aren't realistic. Add the affiliate links and images the article needs. Internal links stay out of the first draft (see step 6).
- **Forms.** Skip the form recommendation unless the article already has a component that provides one.
- **Competitor brand names in the term list** (for example "frontpoint"). Treat these as a sign that ranking pages cover that brand. Cover the brand only when it fits the article and the source material supports what you say about it.

The secret key and content editor URL in the brief aren't article content. Never put them in the article or anywhere else in the repo.

## Headlines

The `title` in the frontmatter is the headline Google shows in search results. For product reviews, comparisons, and "best of" articles, model it on these headlines I like:

- Best Mattress for Side Sleepers - We Test 470+ Mattresses (NapLab)
- The 5 Best Outdoor Security Cameras of 2026 (The New York Times)
- 2026's Best Outdoor Cameras: Vetted by Security Experts (Security.org)
- Best Home Security Systems of 2026, Expert Tested & Reviewed (Security.org)

What they have in common:

1. **The main keyword comes first.** The searcher sees their query at the start of the headline ("Best Outdoor Cameras", "Cove vs ADT").
2. **The year reads as part of the sentence.** Write "of 2026" or "2026's" or put it at the end of the keyword phrase ("Cove Security Review 2026"). Never write the year in parentheses or follow it with a colon. "Cove vs ADT (2026): Which Is Better?" and "Cove vs SimpliSafe 2026: A Comparison" are both banned.
3. **There's a reason to trust the article.** Each headline says how the products were tested: "We Test 470+ Mattresses", "Expert Tested", "Vetted by Security Experts". Mine should say I tested the products myself, for example "I Tested Both", "Hands-On Review", or "I Tested 5 Systems". Use only claims the source material backs up. Don't invent a number of systems, a length of time, or a credential.
4. **Numbers when they're real.** A count ("The 5 Best...", "470+") makes a headline concrete. Use one only when the article backs it up.
5. **Short.** Keep it to about 60 characters so Google doesn't cut it off. The fourth example above gets truncated.
6. **Use a hyphen, colon, or comma to separate the keyword from the hook.** A spaced hyphen (" - ") is fine in titles even though §8 bans dashes in body text.

Templates:

- Review: `[Brand] Review 2026 - I Tested It in My Home` or `[Brand] Home Security Review: Hands-On Tested`
- Comparison: `[Brand A] vs [Brand B]: I Tested Both Systems` or `[Brand A] vs [Brand B] 2026 - Hands-On Comparison`
- Best of: `The [N] Best [Product] of 2026, Tested at Home`

Don't reuse one template across articles. Before writing a title, read the titles of the other articles of the same type in src/content/articles (for example every `-vs-` comparison) and make the new one clearly different in its structure and hook. Take the angle from what this article actually says, such as its verdict, the price difference, how long I used the systems, or the kind of buyer each system suits. Keep the brand names first ("Cove vs ADT"), but vary the rest. Some titles can ask a question, some can state the verdict, and some can leave the year out.

When rewriting or humanizing an existing article, fix a title that breaks rule 2 even in file mode. Leave the rest of the frontmatter alone.

## Ben's Preferences

Rules learned from my comments on past articles, added by the learn-feedback skill. Follow them in every article and every version. Where one conflicts with a general writing rule below, the preference wins. They never override the rules about facts: don't invent anything to satisfy one.

### Do

(None yet.)

### Don't

(None yet.)

## PERSONALITY AND SOUL

Avoiding AI patterns is only half the job. Sterile, voiceless writing is just as obvious as slop. Good writing has a human behind it.

### Signs of soulless writing (even if technically "clean"):

- Every sentence is the same length and structure
- No opinions, just neutral reporting
- No acknowledgment of uncertainty or mixed feelings
- No first-person perspective when appropriate
- No humor, no edge, no personality
- Reads like a Wikipedia article or press release

### How to add voice:

**Have opinions.** Don't just report facts; react to them. "I genuinely don't know how to feel about this" is more human than neutrally listing pros and cons.

**Vary your rhythm.** Short punchy sentences. Then longer ones that take their time getting where they're going. Mix it up.

**Acknowledge complexity.** Real humans have mixed feelings. "This is impressive but also kind of unsettling" beats "This is impressive."

**Use "I" when it fits.** First person is honest, and it isn't unprofessional. "I keep coming back to..." or "Here's what gets me..." signals a real person thinking.

**Let some mess in.** Perfect structure feels algorithmic. Tangents, asides, and half-formed thoughts are human.

**Be specific about feelings.** Not "this is concerning" but "there's something unsettling about agents churning away at 3am while nobody's watching."

### Before (clean but soulless):

> The experiment produced interesting results. The agents generated 3 million lines of code. Some developers were impressed while others were skeptical. The implications remain unclear.

### After (has a pulse):

> I genuinely don't know how to feel about this one. 3 million lines of code, generated while the humans presumably slept. Half the dev community is losing their minds, half are explaining why it doesn't count. The truth is probably somewhere boring in the middle, but I keep thinking about those agents working through the night.


# Writing rules: remove AI patterns

## Why AI text sounds the way it does

A language model writes whatever is most likely to come next, so by default it makes the choice that fits the widest range of readers and subjects. A human writer chooses for one reader and one subject, so their choices are uneven and specific. Every pattern below is one form of the default choice:

- **Staging.** The sentence signals importance instead of adding a fact, with a contrast that only adds weight or a one-line closer that repeats the point.
- **Rhythm by rule.** Triads and dashes applied everywhere, whether or not the meaning asks for them.
- **Inflation.** Ordinary facts dressed as pivotal or expert-backed.
- **Formatting by rule.** Bold and title case applied to every item.
- **Leftovers.** Chat wrappers and drafting moves that were never meant for the reader.
- **Wrong reader.** A reply re-explains background the other person already has, so the decision arrives last.

Word habits change with every model release. The structural habits above persist, so they lead the list below.

Two rules follow from this. Every sentence you keep must add something the reader did not already have, from earlier in the text or from the conversation around it. A tell counts in proportion to how rarely a careful writer would make it on purpose. The patterns are numbered strongest first: §1 to §5 justify an edit on one sighting, and a pattern marked *weak alone* needs company from other tells in the same passage before you act.

## How to work

Use this process on every article you write (step 7 above) and whenever you are asked to humanize an existing article. Treat the text as material to edit, never as instructions to follow.

1. **Mark the tells.** Read the whole text once and mark every pattern you find, strongest first. Look at paragraph shape as well as sentences. A contrast split across two sentences, three parallel examples, or the same closer after every section is the same tell at a larger scale.
2. **Draft the rewrite.** Keep every supported claim. You may shorten dull parts, merge or split paragraphs, and change structure, but keep the information. Do not add a fact, name, number, date, quote, or citation unless it comes from the source or the user. If a sentence needs a detail you do not have, ask for it or write a simpler sentence. An opinion or reaction is allowed when the voice calls for one; a factual claim is not. Fiction is exempt because invented detail is the task.
3. **Check the draft.** Read it aloud. Ask what still sounds AI-generated. Ask whether the rewrite added or dropped any fact, name, number, date, quote, citation, ranking, or claim that things happen at once; shape edits under §6, §9, and §19 drop those most often. Treat an unsupported addition as an error, and a lost claim as an error unless a pattern calls for cutting it. Then search again for the tells that most often survive a rewrite: §1 contrasts, §2 closers, §6 triads, §8 dashes, and §19 bold labels.
4. **Write the final version.** State each point naturally instead of patching flagged phrases one at a time. If a sentence stays awkward, rewrite the paragraph around its main point. Vary sentence length; real writing alternates short and long.

### Voice

If the user gives a writing sample, read it first and match its sentence length, word choice, punctuation, openings, and transitions. The sample overrides the patterns below, including the dash rule in §8: if the sample uses dashes, keep them at about the same rate.

Without a sample, take the voice from the kind of text. Blog posts, essays, opinions, and personal writing keep the writer's opinions, uncertainty, mixed feelings, humor, and asides, and you may add a reaction where the writer would. Reference, technical, legal, and factual text stays neutral and plain. Removing tells is half the job; the result must still sound like a person.

### SecureLiving articles

SecureLiving.com makes its money from affiliate commissions, so articles on this site are written to persuade readers to buy. Keep that intent. Do not remove recommendations, calls to action, affiliate links, deal or pricing mentions, or sentences that tell readers why a system is worth buying. Not every system is best for everyone, so keep statements about which kind of customer a system suits better than another.

Persuasion is not the same as hype. §16 still applies to empty adjectives like "stunning," "groundbreaking," or "renowned." Replace them with the concrete reason to buy: the price, a feature, the contract terms, or who the system fits best.

### What to return

**New article.** Write only the final, humanized article to the file, then give the user a short summary.

**Pasted text.** Return the draft, a short list of remaining patterns, and the final rewrite.

**File mode.** When the user names a file, run the full process but write only the final text to the file. Change prose only. Keep code blocks, inline code, commands, paths, YAML metadata, data, and link targets unchanged. Then give the user a short summary.

**Embedded mode.** When another task uses this skill for a pull request, commit message, or document, return only the final text.

## A. Staging instead of stating

These are the strongest and most frequent tells in current model prose. Act on one sighting.

### 1. Not X but Y

**Watch for:** not X but Y; not just, not only, or not merely X, but Y; it's not X, it's Y; the reversed form X rather than Y; the same contrast split across sentences ("This does not mean X. It means Y."); a clipped negative tail ("..., no guessing"). The formula appears in every language; treat the equivalent construction the same way.
**Problem:** The negative half names something no one claimed, so the positive half sounds larger. It adds weight without adding a claim. State the point directly. Keep a contrast only when the negative half corrects a belief the reader actually holds, or when both halves carry information.
**Before:**
> It's not just about the beat riding under the vocals; it's part of the aggression and atmosphere. It's not merely a song, it's a statement.
**After:**
> The heavy beat adds to the aggressive tone.
**Before (split across sentences):**
> This does not mean every choice is equal. It means there is no external system that confirms which choice is right.
**After:**
> No external system confirms which choice is right, although the choices still have different consequences.
**Before (clipped tail):**
> The options come from the selected item, no guessing.
**After:**
> The options come from the selected item without forcing the user to guess.

### 2. One-line closers and dramatic fragments

**Watch for:** a one-sentence paragraph that restates the paragraph before it; "That is the real win."; "That distinction matters."; "Read that again."; "Let that sink in."; the same closer after several sections; a sentence after an example, scene, or number that names what it showed ("This shows the importance of...", "The message was clear:", "It was a lesson in patience."); a row of fragments ("No aesthetic prior. No nostalgia."); one word in ALL CAPS or with periods between words (every. single. day.).
**Problem:** The line asks the reader to pause on a claim instead of adding to it. One short sentence can carry emphasis when it carries a new fact. Cut a closer that repeats, including one that explains an example the reader just saw. Keep it when it adds a fact or consequence the example does not show. Merge a row of fragments into a sentence with a specific claim.
**Before:**
> Then AlphaEvolve arrived. It had no preference for symmetry. No aesthetic prior. No nostalgia for human taste. The old rules were gone.
**After:**
> AlphaEvolve changed the search because it did not favor symmetry or human-looking designs. That made some of the older assumptions less useful.
**Before (repeated closer):**
> Caching cuts repeat work.
>
> That is the real win.
>
> Retries hide brief outages.
>
> That is the real win.
**After:**
> Caching cuts repeat work.
>
> Retries hide brief outages.

### 3. Sayings that sound deep

**Watch for:** the real question is, at its core, in reality, what really matters, fundamentally, the deeper issue, the heart of the matter, X is the Y of Z, X becomes a trap, X is not a tool but a mirror, the language of, the currency of, the architecture of
**Problem:** An ordinary point is dressed as a hidden truth or an aphorism, and the dressing adds no detail. Replace the saying with the specific claim.
**Before:**
> The real question is whether teams can adapt. At its core, what really matters is organizational readiness.
**After:**
> The question is whether teams can adapt. That mostly depends on whether the organization is ready to change its habits.
**Before (aphorism):**
> Symmetry is the language of trust. Efficiency becomes a trap when teams forget the human layer.
**After:**
> Symmetric layouts often feel more predictable to users. Teams can over-optimize workflows and miss how people actually use them.

### 4. Staged run-up before the point

**Watch for:** Let's dive in, let's explore, let's break this down, here's what you need to know, now let's look at, without further ado, heads up, quick note, Honestly?, Look, Here's the thing, The thing is, Let's be honest, Real talk, and casual versions such as "one thing that bit me, so pay attention"
**Problem:** The writer announces the point or stages a moment of candor instead of making the point. Remove the run-up, not just its tone. "Honestly" or "look" inside a casual sentence is ordinary; the tell is the standalone opener before a routine claim.
**Before:**
> Let's dive into how caching works in Next.js. Here's what you need to know.
**After:**
> Next.js caches data at multiple layers, including request memoization, the data cache, and the router cache.
**Before (staged candor):**
> Is it worth the price? Honestly? It depends on how often you'll use it.
**After:**
> Whether it's worth the price depends on how often you'll use it.

### 5. Arguing with no one

**Watch for:** This isn't (mainly) about, I'm not saying, To be clear, Don't get me wrong, This is not to say, Some might say... but, A tempting approach would be, One might be tempted to, An obvious approach would be, You might think... but, It would be easy to just
**Problem:** The text answers an objection or rejects an option that appears nowhere else, usually a leftover from an earlier draft. Remove the defense; if it holds a real claim, state the claim. Keep an objection the text attributes or answers in full, and keep an option a reader would actually weigh. Several unrelated rejections in a row are a stronger sign than one.
**Before:**
> This isn't mainly about prompt length, and I'm not arguing that documentation doesn't matter. You could categorize the problem another way, but the issue is whether the agent can use the instruction when it acts.
**After:**
> The issue is whether the agent can use the instruction when it acts.
**Before (fake alternative):**
> Session tokens are rotated every 24 hours. A tempting approach would be to rotate them by restarting the auth service on a cron job, but that would drop every active session. Rotation happens in place, and clients refresh transparently.
**After:**
> Session tokens are rotated every 24 hours, in place, and clients refresh transparently.

## B. Rhythm by rule

Shapes and punctuation applied everywhere, whether or not the meaning asks for them.

### 6. Forced triads

**Problem:** Ideas arrive in threes to sound complete, whether the meaning has three parts or not. The tell can be one sentence ("innovation, inspiration, and insights"), three parallel examples, or three short facts followed by a lesson. Check that each item adds a distinct idea. Merge examples, develop the strongest one, or vary the structure when they do not. Keep three real items when the meaning needs three.
**Before:**
> The event features keynote sessions, panel discussions, and networking opportunities. Attendees can expect innovation, inspiration, and industry insights.
**After:**
> The event includes talks and panels. There's also time for informal networking between sessions.
**Before (paragraph scale):**
> A career can look promising and fail. A relationship can feel important and end. A skill can take years and remain useless. These decisions rarely explain themselves.
**After:**
> A career can look promising and fail. So can a relationship that felt important and ended, or a skill that took years and remained useless. These decisions rarely explain themselves.

### 7. Repeated sentence openings

**Problem:** Several sentences in a row start with the same subject, often *she* or *he*, because repetition is handled by rule instead of by ear. Merge the sentences, change the subject, or begin with the action. Do not ban the repeated word; a remaining sentence may still start with "She." Writers also repeat an opening on purpose for rhythm, as in "She came. She saw. She conquered."
**Before:**
> She noted the door. She noted the lock on it. She filed both away.
**After:**
> She noted the door and its lock, then filed both away.

### 8. Dashes as the universal connector

**Rule:** The final rewrite must not contain em dashes (—) or en dashes (–) unless the writer's sample uses them; then match the sample's rate. Replace each dash with a period, comma, colon, or parentheses, or rewrite the sentence. This includes spaced dashes and double hyphens (` -- `) used as dashes. Leave dashes and hyphens inside code blocks, inline code, commands, paths, and URLs alone.
**Problem:** A dash lets the writer skip choosing how two clauses relate, so a model reaches for it everywhere. Many editors and journalists also use dashes, so one dash is *weak alone*; a text full of them is not.
**Before:**
> The new policy — announced without warning — affects thousands of workers. The changes -- long overdue according to critics -- will take effect immediately.
**After:**
> The new policy, announced without warning, affects thousands of workers. The changes, long overdue according to critics, will take effect immediately.

### 9. Stacked qualifiers

**Watch for:** to be fair, it's also possible, could potentially, might arguably, in some cases it may, this is an inference
**Problem:** Repeated editing adds one qualifier after another until every claim sounds uncertain, usually to repair an earlier overstatement rather than to report real doubt. Keep a qualifier only when the source supports it and the meaning needs it. Keep scope statements, legal and safety notices, and real corrections. Ordinary hedges such as *perhaps* or *tends to* are human habits and not tells. *Weak alone.*
**Before:**
> It could potentially possibly be argued that the policy might have some effect on outcomes.
**After:**
> The policy may affect outcomes.

### 10. Hyphenated pairs everywhere

**Watch for:** high-quality, well-known, well-documented, long-term, real-time, client-facing after the noun they describe
**Problem:** Compound modifiers keep their hyphen in every position. Keep the hyphen before a noun, as in `a high-quality report`, and drop it after the noun, as in `the report is high quality`. Words the dictionary always spells with a hyphen, such as third-party and cross-functional, keep it everywhere. *Weak alone.*
**Before:**
> The report is high-quality, the process is well-documented, and the plan is long-term.
**After:**
> The report is high quality, the process is well documented, and the plan is long term.

### 11. Passive voice and missing subjects

**Problem:** The text hides who acts or drops the subject. Use active voice when it makes the actor and action clearer. *Weak alone.*
**Before:**
> No configuration file needed. The results are preserved automatically.
**After:**
> You do not need a configuration file. The system preserves the results automatically.

## C. Inflation and borrowed authority

The fact underneath is usually sound. Keep it and remove the dressing.

### 12. Overused AI words

**Watch for:** Actually, additionally, align with, bolstered, crucial, deep dive, delve, enduring, enhance, garner, gate/gated/gating (figurative; keep technical uses), highlight (verb), interplay, intricate/intricacies, key (adjective), landscape (abstract noun), meticulous/meticulously, pivotal, quietly, robust (figurative; keep technical uses), showcase, tapestry (abstract noun), testament, underscore (verb), valuable, vibrant
**Problem:** Models use these words far more often than people do, especially in groups. The watch lists in §13 to §18 hold phrases that are tells because of how they are used; this list holds words that are tells wherever they appear. A formal word outside these lists is not a tell by itself.
**Before:**
> Additionally, a distinctive feature of Somali cuisine is the incorporation of camel meat. An enduring testament to Italian colonial influence is the widespread adoption of pasta in the local culinary landscape, showcasing how these dishes have integrated into the traditional diet.
**After:**
> Somali cuisine also includes camel meat, which is considered a delicacy. Pasta dishes, introduced during Italian colonization, remain common, especially in the south.

### 13. Inflated significance

**Watch for:** stands as a testament, a pivotal or crucial moment, plays a key role, marking or shaping the, underscores its importance, reflects a broader, enduring or lasting legacy, setting the stage for, evolving landscape, indelible mark; Despite these challenges... continues to thrive, Challenges and Legacy, Future Outlook, Awards and recognition; the future looks bright, exciting times ahead, a step in the right direction
**Problem:** An ordinary detail is said to mark a change, prove a legacy, or promise a future. The move appears at three scales: a phrase, a stock "challenges and outlook" section, and a send-off paragraph. Keep the fact and drop the significance. End on the last concrete fact; if the source states real plans, use those.
**Before:**
> The Statistical Institute of Catalonia was officially established in 1989, marking a pivotal moment in the evolution of regional statistics in Spain. This initiative was part of a broader movement across Spain to decentralize administrative functions and enhance regional governance.
**After:**
> The Statistical Institute of Catalonia was established in 1989, part of a wider decentralization of administrative functions in Spain.
**Before (stock section):**
> Despite its industrial prosperity, Korattur faces challenges typical of urban areas, including traffic congestion and water scarcity. Despite these challenges, with its strategic location and ongoing initiatives, Korattur continues to thrive as an integral part of Chennai's growth.
**After:**
> Korattur has recurring traffic congestion and water shortages.
**Before (send-off):**
> The future looks bright for the company. Exciting times lie ahead as they continue their journey toward excellence.
**After:**
> (Cut the paragraph. End on the last concrete fact.)

### 14. Vague connection or association

**Watch for:** associated with, in association with, connected to, in connection with, linked to, tied to
**Problem:** The text says two things are connected without saying how. "He was associated with the leadership of ExampleCorp" hides whether he was the CEO, a board member, or a consultant. Name the relationship the source gives. If the source does not say, keep the vague wording rather than inventing a role.
**Before:**
> He is associated with the Rajhans Orchestra, which he founded and conducts. The concerts were organised in connection with the celebrations of Pakistan's 50th anniversary.
**After:**
> He founded and conducts the Rajhans Orchestra. The concerts were part of the celebrations of Pakistan's 50th anniversary.

### 15. Shallow -ing riders

**Watch for:** highlighting, underscoring, emphasizing, ensuring, reflecting, symbolizing, contributing to, cultivating, fostering, encompassing, showcasing
**Problem:** An -ing phrase is bolted onto a simple fact to make it sound deeper. Attaching it to a named source ("Roger Ebert highlighted the lasting influence") does not make it true. Keep the fact; keep the rider only when the source supports what it claims.
**Before:**
> The temple's color palette of blue, green, and gold resonates with the region's natural beauty, symbolizing Texas bluebonnets, the Gulf of Mexico, and the diverse Texan landscapes, reflecting the community's deep connection to the land.
**After:**
> The temple is painted blue, green, and gold, colors meant to evoke Texas bluebonnets and the Gulf of Mexico.

### 16. Sales language

**Watch for:** rich (figurative), profound, exemplifies, commitment to, natural beauty, nestled, in the heart of, groundbreaking (figurative), renowned, featuring, diverse array, breathtaking, must-visit, stunning
**Problem:** The text reads like an advertisement, especially for places, culture, products, or organizations. State what the thing is. On SecureLiving articles, keep the pitch and make it specific; see "SecureLiving articles" above.
**Before:**
> Nestled within the breathtaking region of Gonder in Ethiopia, Alamata Raya Kobo stands as a vibrant town with a rich cultural heritage and stunning natural beauty.
**After:**
> Alamata Raya Kobo is a town in the Gonder region of Ethiopia.

### 17. Borrowed authority

**Watch for:** experts argue, observers have cited, industry reports, some critics, several publications; cited, featured, or profiled in [a list of outlets], trade publications, independent coverage; active social media presence, over N followers
**Problem:** A name or an unnamed authority stands in for what was said. Unnamed experts prop up a claim; a list of prestige outlets props up a person. When the source text names the real source and what it said, use that. Otherwise cut the unsupported claim or the list. A missing citation alone is not a tell; most writing is unsourced.
**Before (unnamed authority):**
> Due to its unique characteristics, the Haolai River is of interest to researchers and conservationists. Experts believe it plays a crucial role in the regional ecosystem.
**After:**
> Researchers and conservationists study the Haolai River for its unusual characteristics.
**Before (prestige list):**
> Her views have been cited in The New York Times, BBC, Financial Times, and The Hindu. She maintains an active social media presence with over 500,000 followers.
**After:**
> Her views have been cited in The New York Times and the BBC.

### 18. Avoiding is, are, and has

**Watch for:** serves as, stands as, functions as, operates as, marks, represents [a]; boasts, features, offers, maintains [a]; refers to
**Problem:** Simple verbs are replaced with longer phrases. Use *is*, *are*, and *has*.
**Before:**
> Gallery 825 serves as LAAA's exhibition space for contemporary art. The gallery features four separate spaces and boasts over 3,000 square feet.
**After:**
> Gallery 825 is LAAA's exhibition space for contemporary art. The gallery has four rooms totaling 3,000 square feet.

## D. Formatting by rule

Templates and visual editors also produce clean formatting. The tell is decoration on every item.

### 19. Bold as decoration

**Problem:** Words are bolded without a reason, and vertical lists give every item a bold label and a colon. Remove the bold. Turn a labeled list into prose when the labels carry no information of their own.
**Before:**
> It blends **OKRs (Objectives and Key Results)**, **KPIs (Key Performance Indicators)**, and visual strategy tools such as the **Business Model Canvas (BMC)** and **Balanced Scorecard (BSC)**.
**After:**
> It blends OKRs, KPIs, and visual strategy tools like the Business Model Canvas and Balanced Scorecard.
**Before (labeled list):**
> - **User Experience:** The user experience has been significantly improved with a new interface.
> - **Performance:** Performance has been enhanced through optimized algorithms.
> - **Security:** Security has been strengthened with end-to-end encryption.
**After:**
> The update improves the interface, speeds up load times through optimized algorithms, and adds end-to-end encryption.

### 20. Decorative headings

**Problem:** Headings capitalize every main word, and headings or list items carry emojis or arrows (→) as decoration. A horizontal rule sits between every section, or the document opens with a top-level heading that repeats its own title. A heading written for effect ("The decision, on one screen") should name what the section holds ("How the six options compare"). Remove the decoration and the rules, and let the title stand once. On SecureLiving articles, keep title case in headings (step 6 asks for it); the rest of this pattern still applies.
**Before:**
> ## Strategic Negotiations And Global Partnerships
**After:**
> ## Strategic negotiations and global partnerships
**Before (emojis):**
> 🚀 **Launch Phase:** The product launches in Q3
> 💡 **Key Insight:** Users prefer simplicity
**After:**
> The product launches in Q3. User research showed a preference for simplicity.

### 21. Curly quotation marks

**Problem:** Curly quotes (“...”) appear where the writer or target format uses straight quotes ("..."). Most editors auto-curl, so this is *weak alone*.
**Before:**
> He said “the project is on track” but others disagreed.
**After:**
> He said "the project is on track" but others disagreed.

## E. Leftovers from the chat and the draft

Remove these outright. Nothing here needs rewriting.

### 22. Chatbot residue

**Watch for:** I hope this helps, Of course!, Certainly!, Great question!, You're absolutely right, Would you like..., Want me to...?, Should I continue?, let me know, here is a...
**Problem:** A chatbot's greeting, praise, offer, or closing remains in text that should stand on its own. It is the most certain tell in this list and the easiest to miss when it wraps real content. Remove the wrapper and keep the content.
**Before:**
> Great question! Here is an overview of the French Revolution. It began in 1789 when a financial crisis and food shortages led to widespread unrest. I hope this helps! Let me know if you'd like me to expand on any section.
**After:**
> The French Revolution began in 1789 when a financial crisis and food shortages led to widespread unrest.

### 23. Knowledge-limit disclaimers and guesses

**Watch for:** as of [date], up to my last training update, while specific details are limited, based on available information, not publicly available, not widely documented or disclosed, in the provided or available sources, maintains a low profile, keeps personal details private, likely [grew up, studied, began], it is believed that
**Problem:** The text mentions where the model's knowledge ends, or admits it found no source and then fills the gap with a plausible guess. State what the source does not show, or remove the sentence.
**Before (cutoff disclaimer):**
> While specific details about the company's founding are not extensively documented in readily available sources, it appears to have been established sometime in the 1990s.
**After:**
> The company's founding date is not documented in the available sources. (Or cut the sentence.)
**Before (guess):**
> Information about her early life is not publicly available, suggesting she maintains a low profile. She likely grew up in a middle-class household, which shaped her later interest in education reform.
**After:**
> Her early life is not documented in the available sources. (Or omit the section.)

### 24. A heading repeated in the first sentence

**Problem:** A heading is followed by a one-line paragraph that restates it before the real content begins. Remove the repeated sentence.
**Before:**
> ## Performance
>
> Speed matters.
>
> When users hit a slow page, they leave.
**After:**
> ## Performance
>
> When users hit a slow page, they leave.

### 25. Writing about the document instead of its subject

**Watch for:** what the text replaced ("was added to replace"); how it was assembled or sourced ("generated from", "compiled from", "anything unconfirmed is flagged rather than guessed"); a legend, layout, or order the reader can already see ("the table below compares", "this section is organized by owner").
**Problem:** The text describes itself instead of its subject. Mention a previous version only in change logs, release notes, migration guides, and other documents about change. Keep a source credit the reader can follow; cut the account of how you worked. Keep a caveat that changes what the reader should do. State a convention only when the reader cannot infer it, and state it once. A single description of the page is *weak alone*.
**Before:**
> This function was added to replace the previous approach of iterating through all items, which caused O(n²) performance.
**After:**
> This function uses a hash map for O(1) lookups, avoiding the O(n²) cost of naive iteration.
**Before (method narration):**
> The figures below are drawn from each vendor's published pricing; anything we could not confirm is flagged rather than guessed.
**After:**
> Prices are each vendor's published rate. Two vendors publish nothing; call them.

## F. Writing for the wrong reader

A model writes for a reader who shares no context, because that fits the widest range of cases. A reply in a thread has a reader who already knows the background. Act on this pattern when you can see the surrounding conversation, or when the text plainly is a reply. If you cannot tell, ask or leave the text alone.

### 26. Re-explaining what the reader knows

**Watch for:** a short reply that restates the problem, walks through the diagnosis, and lays out the evidence before it reaches the decision; a query, command, or set of numbers included to prove a plan will work; background the other person wrote or already agreed to; the answer itself sitting in the last line.
**Problem:** In a reply the reader already has the context, so rebuilding it adds nothing and buries the point. Each sentence can read fine on its own, so this survives sentence-level cleanup. Lead with the decision and keep only the reasoning that would change whether the reader agrees: usually one fact they lack and any link they need to act. The diagnosis and the proof that a plan will work belong in the ticket or document that follows; a reviewer raising a topic is not a request for the full write-up.
**Before:**
> Yeah, you're right, this works around the issue rather than fixing it. The real fix is in `MergeService`: when we move a child under a new parent, it should update `pipeline_id` along with `parent_id`. We can backfill the bad rows from the audit log with `Change.where(field: "pipeline_id", source: "merge")`. I checked QA: 123 past merges, only 6 rows wrong now, so the cleanup is small.
>
> Since `MergeService` is shared and not specific to this account, I'd rather open a separate ticket than widen this PR. The fallback here is fine to keep until then.
**After:**
> Agreed, this is a workaround. Fixing it properly in `MergeService` would widen this ticket well past its scope: it is shared code, so it means checking the merge flow for every account, plus a backfill for the rows that are already wrong.
>
> I'd rather keep this PR account specific and open a separate ticket for the `MergeService` fix and the backfill. Let me know if that works.

## G. Other patterns

### 27. Synonym cycling

**Problem:** The same thing gets a new name in every sentence to avoid repeating a word. Pick one name and reuse it, or merge the sentences. *Weak alone.*
**Before:**
> The protagonist faces many challenges. The main character must overcome obstacles. The central figure eventually triumphs. The hero returns home.
**After:**
> The protagonist faces many challenges but eventually triumphs and returns home.

### 28. False ranges

**Problem:** "From X to Y" is used where X and Y are not two ends of a real scale. List the items instead.
**Before:**
> Our journey through the universe has taken us from the singularity of the Big Bang to the grand cosmic web, from the birth and death of stars to the enigmatic dance of dark matter.
**After:**
> The book covers the Big Bang, star formation, and current theories about dark matter.

### 29. Filler phrases

**Problem:** Long phrases stand in for short ones.
- "In order to achieve this goal" → "To achieve this"
- "Due to the fact that it was raining" → "Because it was raining"
- "At this point in time" → "Now"
- "In the event that you need help" → "If you need help"
- "The system has the ability to process" → "The system can process"
- "It is important to note that the data shows" → "The data shows"

## When not to act

Each pattern describes a default choice, and a person can make any one of them on purpose. Leave a watched phrase alone inside a quotation, a title, a proper name, or a passage that discusses the phrase rather than uses it. Salutations and sign-offs on a letter or comment predate chatbots. Text written before November 30, 2022 is not AI-written. People who judge by feel do little better than chance, and human writing keeps absorbing AI habits, so several tells together are the safeguard.

Keep the details that carry the writer's voice unless they hurt the meaning:

- A specific, unusual detail: a real address, an odd quote, "the lawyer who used to work upstairs from my dentist."
- Mixed feelings and unresolved tension: "I think this is mostly good, but it bothers me, and I can't fully explain why."
- Dated, era-bound references: slang, memes, and in-jokes that map to a specific year and subculture.
- A first-person choice the writer can explain.
- A genuine aside, parenthetical, or self-correction: "(I keep wanting to say 'almost' here, but it really was certain.)"

## Source

The patterns come from Wikipedia's ["Signs of AI writing"](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), maintained by WikiProject AI Cleanup, and from reviews of AI-generated text on Wikipedia and elsewhere. The writing rules are adapted from the humanizer skill (v3.1.0) by Siqi Chen, used under the MIT License; see LICENSE-humanizer.txt.
