// Self-contained site builder.
// Reads posts.js + style.css, regenerates: blog-<slug>.html, blog.html & index.html
// post cards (between POSTS markers), inlines CSS into every page, and rebuilds sitemap.xml.
// Run from the repo root:  node scripts/build.js
const fs = require("fs");
const path = require("path");

const DIR = process.cwd();
const BASE = "https://kumarbagri.github.io/contentmind-ai/";
const YEAR = new Date().getFullYear();

// ---- load data ----
const css = fs.readFileSync(path.join(DIR, "style.css"), "utf8");
const postsSrc = fs.readFileSync(path.join(DIR, "posts.js"), "utf8");
eval(postsSrc + "\n;globalThis.__POSTS = POSTS;");
const POSTS = globalThis.__POSTS;

// ---- helpers ----
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function dShort(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function dLong(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function inlineCss(html) {
  html = html.replace(/<link[^>]*rel="stylesheet"[^>]*style\.css"[^>]*>/g, "");
  html = html.replace(/<style id="site-css">[\s\S]*?<\/style>/g, "");
  html = html.replace(/<\/head>/i, '<style id="site-css">\n' + css + '\n</style>\n</head>');
  html = html.replace(/<span id="year"><\/span>/g, '<span id="year">' + YEAR + "</span>");
  return html;
}
function card(p) {
  return '      <a class="post" href="blog-' + p.slug + '.html">\n' +
    '        <div class="thumb" aria-hidden="true"><span></span></div>\n' +
    '        <div class="body">\n' +
    '          <div class="meta"><span class="tag">' + esc(p.tag) + '</span><span>' + dShort(p.date) + '</span></div>\n' +
    '          <h3>' + esc(p.title) + '</h3>\n' +
    '          <p>' + esc(p.excerpt) + '</p>\n' +
    '          <span class="readmore">Read more \u2192</span>\n' +
    '        </div>\n' +
    '      </a>';
}
function fillPosts(html, cardsHtml) {
  if (html.indexOf("<!-- POSTS:START -->") === -1) return html;
  return html.replace(/<!-- POSTS:START -->[\s\S]*?<!-- POSTS:END -->/,
    "<!-- POSTS:START -->\n" + cardsHtml + "\n      <!-- POSTS:END -->");
}

const NAV = `  <div class="wrap nav-in">
    <a href="index.html" class="brand"><span class="logo">C</span> ContentMind <span class="grad">AI</span></a>
    <div class="nav-links">
      <a href="about.html">About</a>
      <a href="services.html">Services</a>
      <a href="blog.html">Blog</a>
      <a href="contact.html" class="btn btn-primary" style="padding:9px 18px">Get in touch</a>
    </div>
  </div>`;

const FOOTER = `<footer>
  <div class="wrap foot-in">
    <div>© <span id="year">${YEAR}</span> ContentMind AI · Founded by Dr Dhirendra Bagri</div>
    <div><a href="https://www.linkedin.com/in/dhirendra-bagri-69977031b" target="_blank" rel="noopener">LinkedIn</a> &nbsp;·&nbsp; <a href="mailto:dhirendrabagri@zohomail.in">Email</a></div>
  </div>
</footer>`;

// ---- 1. generate static post pages ----
let n = 0;
for (const p of POSTS) {
  if (!p.slug) continue;
  const url = BASE + "blog-" + p.slug + ".html";
  const paras = (p.body || p.excerpt).split(/\n\s*\n/)
    .map(t => "        <p>" + esc(t.trim()) + "</p>").join("\n");
  const words = (p.body || p.excerpt).split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(p.title);
  const related = POSTS.filter(q => q.slug && q.slug !== p.slug)
    .sort((a, b) => (b.tag === p.tag) - (a.tag === p.tag)).slice(0, 3);
  const relatedHtml = related.map(q => '<a class="post" href="blog-' + q.slug + '.html"><div class="body"><div class="meta"><span class="tag">' + esc(q.tag) + '</span></div><h3>' + esc(q.title) + '</h3><span class="readmore">Read \u2192</span></div></a>').join("\n");
  const ld = JSON.stringify({
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: p.title, description: p.excerpt, datePublished: p.date, dateModified: p.date,
    wordCount: words, articleSection: p.tag, inLanguage: "en",
    author: { "@type": "Person", name: "Dr Dhirendra Bagri", url: "https://www.linkedin.com/in/dhirendra-bagri-69977031b" },
    publisher: { "@type": "Organization", name: "ContentMind AI" },
    mainEntityOfPage: url, image: BASE + "og-image.png"
  });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(p.title)} — ContentMind AI</title>
<meta name="description" content="${esc(p.excerpt)}" />
<meta name="keywords" content="${esc(p.tag)}, AI content, founders, ContentMind AI" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${url}" />
<meta name="theme-color" content="#08080f" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="ContentMind AI" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.excerpt)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${BASE}og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(p.title)}" />
<meta name="twitter:description" content="${esc(p.excerpt)}" />
<meta name="twitter:image" content="${BASE}og-image.png" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%237c5cff'/><text x='50' y='71' font-size='60' font-family='Arial' font-weight='bold' text-anchor='middle' fill='white'>C</text></svg>" />
<link rel="alternate" type="application/rss+xml" title="ContentMind AI Blog" href="${BASE}rss.xml" />
<script type="application/ld+json">${ld}</script>
</head>
<body>
<nav aria-label="Main">
${NAV}
</nav>
<main class="wrap" style="max-width:800px;padding:52px 24px 24px">
  <a href="blog.html" style="color:var(--muted);font-size:.9rem">← All posts</a>
  <article style="margin-top:20px">
    <div style="display:flex;gap:12px;align-items:center;font-size:.82rem;color:var(--muted)">
      <span class="tag">${esc(p.tag)}</span><span>${dLong(p.date)}</span><span>· ${mins} min read</span><span>· By Dr Dhirendra Bagri</span>
    </div>
    <h1 style="font-size:clamp(1.9rem,4.4vw,2.9rem);letter-spacing:-.03em;line-height:1.12;margin:16px 0 24px">${esc(p.title)}</h1>
    <div class="prose" style="font-size:1.07rem">
${paras}
    </div>
    <div class="share" style="margin-top:36px;padding-top:22px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:10px;align-items:center">
      <strong style="margin-right:6px">Found this useful? Share it:</strong>
      <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${enc}">LinkedIn</a>
      <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encT}%20${enc}">WhatsApp</a>
      <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encT}&url=${enc}">X</a>
      <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://t.me/share/url?url=${enc}&text=${encT}">Telegram</a>
    </div>
    <div style="margin-top:28px;padding:22px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)">
      <strong>Get one practical AI idea every day.</strong>
      <p style="color:var(--muted);margin:6px 0 14px">Free. No spam. Follow ContentMind AI where you already are.</p>
      <div class="hero-cta"><a class="btn btn-primary" target="_blank" rel="noopener" href="https://www.linkedin.com/company/contentmind-ai/">Follow on LinkedIn</a><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://t.me/ContentMindAI">Join on Telegram</a></div>
    </div>
    <h2 style="margin:40px 0 16px;font-size:1.4rem">Keep reading</h2>
    <div class="posts">
${relatedHtml}
    </div>
    <div style="margin-top:28px">
      <a href="blog.html" class="btn btn-ghost">← Back to all posts</a>
    </div>
  </article>
</main>
<section id="contact"><div class="wrap"><div class="contact">
  <h2>Want content like this <span class="grad">for your brand?</span></h2>
  <p>ContentMind AI turns these ideas into a steady stream of posts that sound like you.</p>
  <div class="hero-cta"><a href="contact.html" class="btn btn-primary">Work with us →</a><a href="mailto:dhirendrabagri@zohomail.in" class="btn btn-ghost">dhirendrabagri@zohomail.in</a></div>
</div></div></section>
${FOOTER}
</body>
</html>
`;
  fs.writeFileSync(path.join(DIR, "blog-" + p.slug + ".html"), inlineCss(html));
  n++;
}
console.log("generated " + n + " post pages");

// ---- 2. fill listing sections ----
const allCards = POSTS.map(card).join("\n");
const latest3 = POSTS.slice(0, 3).map(card).join("\n");

for (const f of ["blog.html", "index.html"]) {
  let h = fs.readFileSync(path.join(DIR, f), "utf8");
  h = fillPosts(h, f === "index.html" ? latest3 : allCards);
  h = inlineCss(h);
  fs.writeFileSync(path.join(DIR, f), h);
}

// ---- 3. inline CSS into remaining static pages ----
for (const f of ["about.html", "services.html", "contact.html"]) {
  let h = fs.readFileSync(path.join(DIR, f), "utf8");
  h = inlineCss(h);
  fs.writeFileSync(path.join(DIR, f), h);
}

// ---- 4. sitemap ----
let urls = [["", "1.0", "daily"], ["about.html", "0.8", null], ["services.html", "0.9", null],
  ["blog.html", "0.8", "daily"], ["contact.html", "0.7", null]];
const TODAY = new Date().toISOString().slice(0, 10);
for (const p of POSTS) if (p.slug) urls.push(["blog-" + p.slug + ".html", "0.6", null, p.date]);
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for (const [u, pr, cf, lm] of urls) {
  sm += "  <url><loc>" + BASE + u + "</loc><lastmod>" + (lm || TODAY) + "</lastmod>" + (cf ? "<changefreq>" + cf + "</changefreq>" : "") + "<priority>" + pr + "</priority></url>\n";
}
sm += "</urlset>\n";
fs.writeFileSync(path.join(DIR, "sitemap.xml"), sm);

// ---- 5. RSS feed ----
let rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>ContentMind AI Blog</title>\n<link>' + BASE + 'blog.html</link>\n<description>Practical AI, content and growth ideas, daily.</description>\n<language>en</language>\n';
for (const p of POSTS.slice(0, 30)) if (p.slug) {
  rss += '<item><title>' + esc(p.title) + '</title><link>' + BASE + 'blog-' + p.slug + '.html</link><guid>' + BASE + 'blog-' + p.slug + '.html</guid><pubDate>' + new Date(p.date + "T06:00:00Z").toUTCString() + '</pubDate><category>' + esc(p.tag) + '</category><description>' + esc(p.excerpt) + '</description></item>\n';
}
rss += '</channel></rss>\n';
fs.writeFileSync(path.join(DIR, "rss.xml"), rss);

console.log("done: listings filled, CSS inlined, sitemap rebuilt");
