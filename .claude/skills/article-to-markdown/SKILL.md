---
name: article-to-markdown
description: |
  Fetch one or more competitor article URLs and save each article's content as a markdown
  file in that keyword's packet (packets/<keyword-slug>), so blog-writer can use it as competitor
  material. Use when the user gives a URL (or several) and asks to grab, scrape, save, pull,
  or convert the article to markdown, or to save competitor articles for a keyword.
metadata:
  version: 1.1.0
---

# Article to Markdown

Turns a ranking competitor article into a markdown file that blog-writer reads from the packet. The file keeps the article's headings, lists, tables, images, and links so its structure and word count can be studied, and the frontmatter records the page's SEO title, meta description, dates, and counts.

## Where Files Go

Save each article to:

```
packets/<keyword-slug>/<site>-<page-slug>.md
```

- `<keyword-slug>` is the keyword the article ranks for, lowercase with hyphens (`adt-alternatives`). Use the keyword I give you. If I don't give one, use the main keyword of the article being written in this conversation, or the topic of the page itself. Ask me only if the URLs cover different topics.
- `<site>` is the domain without `www.` or the TLD (`security`, `safewise`, `cnet`).
- `<page-slug>` is the last meaningful part of the URL path (`adt-alternatives`).

For example, `https://www.security.org/home-security-systems/adt/alternatives/` saved for "adt alternatives" becomes `packets/adt-alternatives/security-adt-alternatives.md`.

A packet holds at most 3 competitor articles. If saving would push it past 3, tell me and ask which ones to keep.

If the file already exists, overwrite it. A new fetch is the newer version of that page.

## Steps

1. **Install the dependencies once.** If `.claude/skills/article-to-markdown/node_modules` doesn't exist, run `npm install` in `.claude/skills/article-to-markdown`. These packages belong to the skill. Don't add them to the site's package.json.
2. **Fetch each URL.** From the project root, run:

   ```
   node .claude/skills/article-to-markdown/fetch-article.mjs "<url>" "<output path>"
   ```

   When I give several URLs, run them all. The script prints a JSON line with the title, word count, and heading, image, link, and table counts.
3. **Handle failures.** The script exits with `FETCH_FAILED <status>` when the site blocks the request or the page is missing, and with `NO_ARTICLE` when it can't find article content (common on pages built with JavaScript). In either case, tell me which URL failed and why. For a blocked or JavaScript page, ask me to open it in my browser, save it with Ctrl+S as "Webpage, HTML Only", and give you the path. Then convert the saved file:

   ```
   node .claude/skills/article-to-markdown/fetch-article.mjs "<url>" "<output path>" "<saved .html file>"
   ```

   Don't fall back to WebFetch. It returns a summary of the page, not the article's real wording and structure.
4. **Check the output.** Read each markdown file. Readability sometimes keeps page clutter or drops part of the article. Remove clutter that isn't part of the article, such as newsletter signups, "related articles" blocks, author bios, cookie notices, share buttons, and comment sections. Don't rewrite, shorten, or summarize the article's own text. If a large part of the article is missing (for example the page shows 8 products and the file has 3), tell me. When you remove clutter, update `wordCount` and the other counts in the frontmatter so they still match the body.
5. **Report back.** For each URL, give the file path, the H1, the word count, and the number of H2s, images, and tables. Note anything that failed or looked incomplete.

## Using the Files

These files are reference material for structure, length, and topic coverage only. blog-writer already says not to let competitor opinions shape mine and never to link to these articles. Never copy sentences, tables, or images from these files into a SecureLiving article.
