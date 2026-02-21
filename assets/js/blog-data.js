// assets/js/blog-data.js
// Single source of truth for your blog posts.
// Add/remove posts here and both blog.html and post.html will update.

window.BLOG_POSTS = [
  {
    featured: true,
    slug: "launch-format",
    title: "ClutchTrades format: 48-hour events, explained",
    excerpt: "A clean breakdown of the rules, scoring, and why the format is built for skill — not hype.",
    date: "2026-02-20",
    category: "Product",
    tags: ["format", "rules", "leaderboard"],
    minutes: 4,
    cover: "./assets/img/mpreview.jpeg",
    content:
      "<p><strong>Placeholder content.</strong> Replace this with your real post body. You can write in plain HTML for now.</p>" +
      "<p>Explain how the competition works, how scoring is calculated, and what makes the platform fair.</p>" +
      "<h2>Example section</h2>" +
      "<ul><li>Same starting points</li><li>Fixed prize pools</li><li>Transparent rankings</li></ul>",
  },
  {
    slug: "pricing-demo",
    title: "Wiring the market snapshot (demo data → real data)",
    excerpt: "What we’re showing today, what’s faked, and the roadmap for plugging in a proper pricing source.",
    date: "2026-02-18",
    category: "Engineering",
    tags: ["pricing", "steam", "api"],
    minutes: 6,
    cover: null,
    content:
      "<p><strong>Placeholder.</strong> Talk about your data source options, caching, and how you’ll keep the UI fast.</p>",
  },
  {
    slug: "ruleset-v1",
    title: "Rulebook v1: what’s allowed (and what gets you banned)",
    excerpt: "No weird exploits, no multi-accounting, no nonsense — here’s the strict baseline for fair play.",
    date: "2026-02-15",
    category: "Rules",
    tags: ["fair play", "anti-cheat"],
    minutes: 5,
    cover: null,
    content: "<p><strong>Placeholder.</strong> List prohibited behavior, enforcement, and what you track.</p>",
  },
  {
    slug: "event-payouts",
    title: "Payouts: why fixed prizes beat mystery rewards",
    excerpt: "Fixed pools are predictable, auditable, and don’t feel like a casino. Here’s why we’re strict on this.",
    date: "2026-02-10",
    category: "Product",
    tags: ["payouts", "transparency"],
    minutes: 3,
    cover: null,
    content: "<p><strong>Placeholder.</strong> Explain your payout logic and why users should trust it.</p>",
  },
  {
    slug: "market-notes-1",
    title: "Market notes: what drives CS2 skin spikes?",
    excerpt: "A quick field guide to common catalysts (cases, updates, creator hype) and what’s just noise.",
    date: "2026-02-01",
    category: "Market",
    tags: ["analysis", "volatility"],
    minutes: 7,
    cover: null,
    content: "<p><strong>Placeholder.</strong> Share examples, charts, and caveats. Keep it practical.</p>",
  },
];

Object.freeze(window.BLOG_POSTS);