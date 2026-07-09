# How to Publish a Blog Post — Sajilomatics

Your site is static, which is a *feature* for SEO: every article is a fast, crawlable HTML page. Publishing takes ~15 minutes once you have the article written.

## The 6-step publish workflow

**1. Copy the template.** Duplicate `the-20-hour-audit.html` and rename it to your article slug, e.g. `hotel-automation-nepal.html`. The slug should contain your target keyword, use hyphens, and stay short.

**2. Replace the content.** Update these spots (search for each in the file):

| What | Where |
|---|---|
| `<title>` | Keyword first, brand last: "Your Topic \| Sajilomatics Blog" (under 60 chars) |
| `<meta name="description">` | 140–155 chars, contains the keyword, ends with a reason to click |
| `<link rel="canonical">` + all `og:url` | The new URL |
| `og:title`, `og:description`, twitter tags | Match title/description |
| `article:published_time` | Today's date (YYYY-MM-DD) |
| JSON-LD block | Update headline, description, dates, URL — and rewrite the 3 FAQ Q&As to match the new article |
| Article body | Your content: H1 once, TL;DR box, H2 sections, author box |

**3. Add the card to the blog page.** In `insights.html`, copy one of the three post cards, update the date, title (linked to your new file), and summary.

**4. Add the URL to `sitemap.xml`.** Copy a `<url>` line, update the `loc` and `lastmod`.

**5. Commit to GitHub.** Go to your repo → "Add file" → "Upload files" → drop the new article file + the updated `insights.html` + `sitemap.xml` → Commit. Vercel deploys automatically in ~20 seconds.

**6. Ping Google.** In Google Search Console (set this up once — takes 5 min, free), use URL Inspection → paste your new URL → "Request indexing."

## Writing for SEO + GEO + AEO (one article, three engines)

The good news: the same structure wins all three. Here's the anatomy — the template already implements every piece:

**SEO (Google rankings)**
- One target keyword per article, in: title, first paragraph, one H2, the URL slug
- 800–1,500 words of *specific* content (numbers, examples, steps — not fluff)
- Internal links to your service/contact pages; those pages link back to articles
- Fast page + mobile-friendly (already handled by the site itself)

**AEO (Answer Engine Optimization — featured snippets, voice, "People Also Ask")**
- The **TL;DR box**: a 40–60 word direct answer at the top. This is what gets pulled into snippets.
- **Question-form H2s** where natural ("What should a business automate first?")
- The **FAQ block in JSON-LD**: 3 real questions with self-contained answers. Google reads this directly.
- Answer in the first sentence under each heading, *then* elaborate.

**GEO (Generative Engine Optimization — ChatGPT, Claude, Perplexity, AI Overviews)**
- **Quotable, self-contained facts**: "Most 5–30 person service businesses lose roughly 20 hours per week" is a sentence an AI can lift and cite. Write 3–5 of these per article.
- **Name your brand near the facts** — "In our audits at Sajilomatics…" — so citations carry your name.
- **`llms.txt`** (already live at /llms.txt): a summary AI crawlers read. When you add a major article, add one line about it there.
- **Structured data** (Article, FAQPage, Organization schema — all in the template): AI engines lean heavily on this to trust and attribute content.
- Update `dateModified` when you refresh old posts — freshness matters to AI engines.

## Cadence that actually works

One good article every 1–2 weeks beats four rushed ones. Best topics for you: "how to automate X" guides for your three industries (recruitment, hotels, marketing), cost/comparison articles ("custom software vs off-the-shelf in Nepal"), and case-study write-ups once client numbers are approved.

## One-time setup (do this week)

1. **Google Search Console** → add sajilomatics.com → submit `sitemap.xml`
2. **Bing Webmaster Tools** → same (Bing powers ChatGPT browsing)
3. After the domain switch: search-replace `sajilomatics-website.vercel.app` → nothing to change — all URLs already point to `sajilomatics.com` ✓
