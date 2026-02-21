// assets/js/blog.js
// Renders blog listing (blog.html) + single post view (post.html)
(function () {
  "use strict";

  function safeJsonParse(str) {
    try { return JSON.parse(str); } catch { return null; }
  }

  function getInlineData() {
    const el = document.getElementById("blog-data");
    if (!el) return null;
    const raw = (el.textContent || "").trim();
    if (!raw) return null;
    const parsed = safeJsonParse(raw);
    return Array.isArray(parsed) ? parsed : null;
  }

  async function fetchJson(url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  function normalizePost(p) {
    const out = Object.assign({}, p);
    out.slug = String(out.slug || "").trim();
    out.title = String(out.title || "Untitled").trim();
    out.excerpt = String(out.excerpt || "").trim();
    out.date = String(out.date || "").trim();
    out.category = String(out.category || "General").trim();
    out.tags = Array.isArray(out.tags) ? out.tags.map((t) => String(t).trim()).filter(Boolean) : [];
    out.minutes = Number.isFinite(Number(out.minutes)) ? Number(out.minutes) : null;
    out.cover = out.cover ? String(out.cover) : null;
    out.featured = Boolean(out.featured);
    out.content = typeof out.content === "string" ? out.content : "";
    return out;
  }

  function parseDateValue(iso) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso || "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function el(tag, cls) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function makeTag(text) {
    const t = el("span", "tag");
    t.textContent = text;
    return t;
  }

  function makePostCard(post) {
    const a = el("a", "post-card");
    a.href = `./post.html?slug=${encodeURIComponent(post.slug)}`;
    a.setAttribute("aria-label", `Read: ${post.title}`);

    const cover = el("div", "post-cover");
    if (post.cover) {
      const img = new Image();
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = "";
      img.src = post.cover;
      cover.appendChild(img);
    } else {
      const ph = el("div", "post-cover-ph");
      ph.textContent = "CT";
      cover.appendChild(ph);
    }

    const body = el("div", "post-body");

    const meta = el("div", "post-mini");
    const left = el("span", "post-mini-left");
    left.textContent = post.category;
    const right = el("span", "post-mini-right");
    const mins = post.minutes ? ` • ${post.minutes} min` : "";
    right.textContent = `${fmtDate(post.date)}${mins}`;
    meta.appendChild(left);
    meta.appendChild(right);

    const h = el("h3", "post-title");
    h.textContent = post.title;

    const p = el("p", "post-excerpt");
    p.textContent = post.excerpt;

    const tags = el("div", "post-tags");
    post.tags.slice(0, 3).forEach((t) => tags.appendChild(makeTag(t)));

    body.appendChild(meta);
    body.appendChild(h);
    if (post.excerpt) body.appendChild(p);
    if (post.tags.length) body.appendChild(tags);

    a.appendChild(cover);
    a.appendChild(body);
    return a;
  }

  function renderFeatured(post) {
    const wrap = document.getElementById("blogFeatured");
    if (!wrap) return;
    wrap.innerHTML = "";

    const card = el("div", "featured-card");

    const cover = el("a", "featured-cover");
    cover.href = `./post.html?slug=${encodeURIComponent(post.slug)}`;

    if (post.cover) {
      const img = new Image();
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = "";
      img.src = post.cover;
      cover.appendChild(img);
    } else {
      const ph = el("div", "featured-cover-ph");
      ph.textContent = "Featured";
      cover.appendChild(ph);
    }

    const content = el("div", "featured-body");

    const k = el("div", "featured-kicker");
    k.textContent = "Featured";

    const h = el("h3", "featured-title");
    h.textContent = post.title;

    const meta = el("div", "featured-mini");
    meta.textContent = `${post.category} • ${fmtDate(post.date)}${post.minutes ? ` • ${post.minutes} min` : ""}`;

    const ex = el("p", "featured-excerpt");
    ex.textContent = post.excerpt;

    const ctas = el("div", "featured-ctas");
    const btn = el("a", "btn primary");
    btn.href = `./post.html?slug=${encodeURIComponent(post.slug)}`;
    btn.textContent = "Read post";
    const btn2 = el("a", "btn");
    btn2.href = "#posts";
    btn2.textContent = "See all";
    ctas.appendChild(btn);
    ctas.appendChild(btn2);

    content.appendChild(k);
    content.appendChild(h);
    content.appendChild(meta);
    if (post.excerpt) content.appendChild(ex);
    content.appendChild(ctas);

    card.appendChild(cover);
    card.appendChild(content);

    wrap.appendChild(card);
  }

  function renderGrid(posts) {
    const grid = document.getElementById("blogGrid");
    const empty = document.getElementById("blogEmpty");
    if (!grid) return;

    grid.innerHTML = "";

    if (!posts.length) {
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    posts.forEach((p) => grid.appendChild(makePostCard(p)));
  }

  function uniqueCategories(posts) {
    const set = new Set();
    posts.forEach((p) => set.add(p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function initListing(posts) {
    const search = document.getElementById("blogSearch");
    const cat = document.getElementById("blogCategory");

    const featured = posts.find((p) => p.featured) || posts[0];
    if (featured) renderFeatured(featured);

    const rest = posts.filter((p) => !featured || p.slug !== featured.slug);

    if (cat) {
      const cats = uniqueCategories(posts);
      const cur = cat.value || "all";
      cat.innerHTML = "";

      const allOpt = el("option");
      allOpt.value = "all";
      allOpt.textContent = "All categories";
      cat.appendChild(allOpt);

      cats.forEach((c) => {
        const o = el("option");
        o.value = c;
        o.textContent = c;
        cat.appendChild(o);
      });

      cat.value = cats.includes(cur) ? cur : "all";
    }

    function apply() {
      const q = (search?.value || "").trim().toLowerCase();
      const c = (cat?.value || "all").toLowerCase();

      const filtered = rest.filter((p) => {
        const inCat = c === "all" || p.category.toLowerCase() === c;
        if (!inCat) return false;

        if (!q) return true;
        const hay = [p.title, p.excerpt, p.category, p.tags.join(" ")].join(" ").toLowerCase();
        return hay.includes(q);
      });

      renderGrid(filtered);
    }

    if (search) search.addEventListener("input", apply);
    if (cat) cat.addEventListener("change", apply);

    apply();
  }

  function initPostView(posts) {
    const titleEl = document.getElementById("postTitle");
    const excerptEl = document.getElementById("postExcerpt");
    const catEl = document.getElementById("postCategory");
    const dateEl = document.getElementById("postDate");
    const minEl = document.getElementById("postMinutes");
    const bodyEl = document.getElementById("postBody");
    const tagsEl = document.getElementById("postTags");
    const coverWrap = document.getElementById("postCover");
    const coverImg = document.getElementById("postCoverImg");

    const params = new URLSearchParams(window.location.search);
    const slug = (params.get("slug") || "").trim();

    const post = posts.find((p) => p.slug === slug);

    if (!post) {
      if (titleEl) titleEl.textContent = "Post not found";
      if (excerptEl) excerptEl.textContent = "That slug doesn’t exist yet. Go back and pick a real post.";
      if (catEl) catEl.textContent = "Blog";
      if (dateEl) dateEl.textContent = "—";
      if (minEl) minEl.textContent = "—";
      if (bodyEl) bodyEl.innerHTML = `<p>Nothing matched <code>${slug || "(empty)"}</code>.</p><p><a class="btn" href="./blog.html">Back to Blog</a></p>`;
      document.title = "Post not found — ClutchTrades";
      return;
    }

    if (titleEl) titleEl.textContent = post.title;
    if (excerptEl) excerptEl.textContent = post.excerpt || "";
    if (catEl) catEl.textContent = post.category;
    if (dateEl) dateEl.textContent = fmtDate(post.date);
    if (minEl) minEl.textContent = post.minutes ? `${post.minutes} min read` : "—";

    if (tagsEl) {
      tagsEl.innerHTML = "";
      post.tags.forEach((t) => tagsEl.appendChild(makeTag(t)));
    }

    if (post.cover && coverWrap && coverImg) {
      coverWrap.hidden = false;
      coverImg.src = post.cover;
      coverImg.alt = "";
    }

    if (bodyEl) {
      bodyEl.innerHTML = post.content || "<p><strong>Placeholder:</strong> Add <code>content</code> for this post inside your JSON.</p>";
    }

    document.title = `${post.title} — ClutchTrades`;
  }

  async function loadPosts() {
    if (Array.isArray(window.BLOG_POSTS)) return window.BLOG_POSTS;
    const inline = getInlineData();
    if (inline) return inline;
    const fetched = await fetchJson("./assets/data/blog.json");
    return fetched || [];
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(async function () {
    const raw = await loadPosts();
    const posts = raw.map(normalizePost).filter((p) => p.slug);
    posts.sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));

    const hasListing = Boolean(document.getElementById("blogGrid"));
    const hasPost = Boolean(document.getElementById("postTitle"));

    if (hasListing) initListing(posts);
    if (hasPost) initPostView(posts);
  });
})();