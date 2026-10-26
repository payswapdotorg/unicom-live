// UNiCOM product model — types + seed data (UI-only phase; backend later).
// Every concept here maps to a proven zcode capability:
//   watch → resident watch with heartbeats
//   missions/lanes → multi-agent orchestration
//   decisions → the operator frontier (approve/require-changes)
//   evidence → evidence-first review (diffs, runs, durations)
//   skills → pluggable capability packs
// FE2: the model catalog (providers + capability rules) lives in ./models —
// sourced verbatim from the zcode desktop repo's provider config.
import {
  defaultProviderConfigs,
  type ModelProviderConfig,
} from "./models";

export type PlatformId =
  | "shopify"
  | "woocommerce"
  | "etsy"
  | "amazon"
  | "squarespace"
  | "bigcommerce"
  | "local";

export type Platform = {
  id: PlatformId;
  name: string;
  glyph: string;
  tint: string; // tailwind text color class for the glyph
  catalog: string; // what it contributes once connected
};

export const PLATFORMS: Platform[] = [
  { id: "shopify", name: "Shopify", glyph: "S", tint: "text-emerald-500", catalog: "Products · Orders · Inventory · Customers" },
  { id: "woocommerce", name: "WooCommerce", glyph: "W", tint: "text-violet-400", catalog: "Products · Orders · Coupons · Media" },
  { id: "etsy", name: "Etsy", glyph: "E", tint: "text-orange-500", catalog: "Listings · Receipts · Reviews" },
  { id: "amazon", name: "Amazon", glyph: "a", tint: "text-amber-500", catalog: "Listings · Orders · FBA · Ads" },
  { id: "squarespace", name: "Squarespace", glyph: "◻", tint: "text-stone-400", catalog: "Products · Orders · Pages" },
  { id: "bigcommerce", name: "BigCommerce", glyph: "B", tint: "text-red-400", catalog: "Products · Orders · Carts" },
  { id: "local", name: "Local", glyph: "⌂", tint: "text-amber-600", catalog: "In-person · POS · Local pickup · Camera capture" },
];

export type StoreHealth = "healthy" | "attention" | "syncing";

export type StoreConnection = {
  id: string;
  name: string;
  domain: string;
  platform: PlatformId;
  health: StoreHealth;
  lastSync: string; // humanized
  lastAudit: string;
  products: number;
  orders7d: number;
  revenue7d: number; // USD
  delta7d: number; // % vs previous week
  apiUsage: number; // 0-100
  installedSkills: string[];
};

export type MissionStatus =
  | "running"
  | "in-review"
  | "awaiting-approval"
  | "done";

export type MissionLane = {
  id: string;
  name: string;
  worker: string;
  status: "running" | "in-review" | "done";
  progress: number; // 0-100
  evidence: string[]; // evidence chips
};

export type Mission = {
  id: string;
  title: string;
  brief: string;
  stores: string[]; // store ids
  status: MissionStatus;
  eta: string;
  started: string;
  lanes: MissionLane[];
  groupId?: string; // project group (R-B1); older missions may be ungrouped
};

export type DecisionKind = "price" | "listing" | "refund" | "campaign";

export type Decision = {
  id: string;
  kind: DecisionKind;
  title: string;
  store: string; // store id
  proposedBy: string; // skill/agent name
  risk: "low" | "medium" | "high";
  impact: string; // one-line expected impact
  evidence: string[];
  detail: { label: string; value: string }[];
  expires: string;
  // R-B2: evidence-first review — decisions may carry before/after diffs
  diffs?: DiffBlock[];
  diffNote?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Zcode emergence (R-B2) — decision diffs. Declared above the seeds because
// d-1 / d-3 carry diff bundles. Extends the vocabulary; nothing breaks.
// ─────────────────────────────────────────────────────────────────────────────

// ——— Decisions: diff blocks ———

export type DiffRow = {
  kind: "context" | "-" | "+";
  label?: string;
  value?: string;
  note?: string;
};

export type DiffBlock = {
  path: string;
  summary?: string;
  rows: DiffRow[];
};

export const LINEN_THROW_DIFF: DiffBlock = {
  path: "halcyon://products/linen-throw-price",
  summary: "before $84.00 → after $79.00",
  rows: [
    { kind: "context", value: "Linen Throw — Halcyon Goods" },
    { kind: "-", label: "price", value: "$84.00" },
    { kind: "+", label: "price", value: "$79.00" },
    { kind: "context", value: "margin +6.2pt · comp set −$2" },
  ],
};

const ROBE_DIFF: DiffBlock = {
  path: "halcyon://products/robe-v2",
  summary: "before $149.00 → after $139.00",
  rows: [
    { kind: "-", label: "price", value: "$149.00" },
    { kind: "+", label: "price", value: "$139.00" },
  ],
};

const TRAVEL_KIT_DIFF: DiffBlock = {
  path: "halcyon://products/travel-kit",
  summary: "before $52.00 → after $49.00",
  rows: [
    { kind: "-", label: "price", value: "$52.00" },
    { kind: "+", label: "price", value: "$49.00" },
  ],
};

const MUG_SET_TITLE_DIFF: DiffBlock = {
  path: "kaia://listings/mug-set-title",
  summary: "title rewrite · ≤140 chars",
  rows: [
    { kind: "context", value: "Mug Set (4) — Kaia Ceramics · listing 8812" },
    { kind: "-", value: "Handmade Ceramic Mug Set of 4 — Farmhouse Kitchen" },
    { kind: "+", value: "Mug set — hand-thrown stoneware, set of 4" },
  ],
};

const MUG_SET_TAGS_DIFF: DiffBlock = {
  path: "kaia://listings/mug-set-tags",
  summary: "13/13 tags on every listing",
  rows: [
    { kind: "+", value: "ceramic decor" },
    { kind: "-", value: "mugs" },
  ],
};

export type WatchEvent = {
  id: string;
  ts: string;
  kind: "heartbeat" | "anomaly" | "heal" | "review" | "dispatch";
  actor: string; // skill or agent
  text: string;
  // FE2 (Usage): the date-stamped record — present on live rows (the DB
  // timestamps every event incl. the seeded ones); absent only on static
  // demo seeds. Usage surfaces count ONLY dated events — never fabricated.
  createdAt?: string;
};

export type Skill = {
  id: string;
  name: string;
  glyph: string;
  tagline: string;
  watches: string; // what it watches
  acts: string; // what it does
  risk: "read-only" | "acts-with-approval" | "autonomous";
  events7d: number;
  installedOn: string[]; // store ids
};

export const SEED_STORES: StoreConnection[] = [
  {
    id: "halcyon",
    name: "Halcyon Goods",
    domain: "halcyongoods.com",
    platform: "shopify",
    health: "healthy",
    lastSync: "2 min ago",
    lastAudit: "06:40Z",
    products: 412,
    orders7d: 318,
    revenue7d: 28450,
    delta7d: 12.4,
    apiUsage: 34,
    installedSkills: ["price-sentinel", "listing-optimizer", "cart-saver"],
  },
  {
    id: "mountain-reads",
    name: "Mountain Reads",
    domain: "mountainreads.co",
    platform: "woocommerce",
    health: "attention",
    lastSync: "11 min ago",
    lastAudit: "06:40Z",
    products: 1287,
    orders7d: 96,
    revenue7d: 8120,
    delta7d: -4.1,
    apiUsage: 61,
    installedSkills: ["price-sentinel", "review-responder"],
  },
  {
    id: "kaia",
    name: "Kaia Ceramics",
    domain: "kaiaceramics.etsy.com",
    platform: "etsy",
    health: "syncing",
    lastSync: "just now",
    lastAudit: "yesterday 21:12Z",
    products: 84,
    orders7d: 61,
    revenue7d: 4390,
    delta7d: 23.8,
    apiUsage: 12,
    installedSkills: ["listing-optimizer"],
  },
];

export const SEED_MISSIONS: Mission[] = [
  {
    id: "m-1",
    title: "Spring price audit across all stores",
    groupId: "spring",
    brief:
      "Reprice 61 SKUs flagged by Price Sentinel against competitor moves of the last 14 days. High-impact changes are packed as decisions for your approval.",
    stores: ["halcyon", "mountain-reads"],
    status: "awaiting-approval",
    eta: "2 lanes in review",
    started: "06:02Z",
    lanes: [
      { id: "l-1", name: "Competitor crawl + margin table", worker: "wkr-a7", status: "done", progress: 100, evidence: ["1,204 rows crawled", "margin-model v3 · 61 flagged", "run 41m 12s"] },
      { id: "l-2", name: "Reprice drafts + risk packing", worker: "wkr-c2", status: "in-review", progress: 100, evidence: ["61 drafts · 9 high-impact", "diff bundle 41f2c9", "TL review: 2 notes"] },
      { id: "l-3", name: "Apply approved changes", worker: "wkr-a7", status: "running", progress: 38, evidence: ["applying in batches of 10", "0 conflicts so far"] },
    ],
  },
  {
    id: "m-2",
    title: "Etsy listing refresh — Kaia Ceramics",
    groupId: "etsy",
    brief:
      "Rewrite titles/tags for the 12 slowest listings using Listing Optimizer; A/B the top 4 against current copy.",
    stores: ["kaia"],
    status: "in-review",
    eta: "review by 12:00Z",
    started: "yesterday 22:47Z",
    lanes: [
      { id: "l-4", name: "Copy variants (12 listings × 3)", worker: "wkr-d9", status: "done", progress: 100, evidence: ["36 variants written", "keyword coverage +18%", "run 1h 04m"] },
      { id: "l-5", name: "A/B arm assignment", worker: "wkr-d9", status: "in-review", progress: 100, evidence: ["4 experiments staged", "traffic split 50/50"] },
    ],
  },
  {
    id: "m-3",
    title: "Abandoned-cart recovery funnel — Halcyon",
    groupId: "always",
    brief:
      "Three-email sequence drafted from the buyer-thought teardowns; sends are packed as decisions before anything ships.",
    stores: ["halcyon"],
    status: "running",
    eta: "drafts ~11:30Z",
    started: "07:15Z",
    lanes: [
      { id: "l-6", name: "Sequence drafting", worker: "wkr-b1", status: "running", progress: 64, evidence: ["2 of 3 emails drafted"] },
      { id: "l-7", name: "Segment snapshot", worker: "wkr-b1", status: "done", progress: 100, evidence: ["1,847 carts in scope", "avg value $67.20"] },
    ],
  },
];

export const SEED_DECISIONS: Decision[] = [
  {
    id: "d-1",
    kind: "price",
    title: "Reprice 9 high-impact SKUs — Halcyon Goods",
    store: "halcyon",
    proposedBy: "Price Sentinel",
    risk: "medium",
    impact: "Est. +$1,840/mo margin at 95% confidence",
    evidence: ["margin-table v3", "competitor moves 14d", "elasticity model PASS"],
    detail: [
      { label: "SKU 8841 · Linen Throw", value: "$84 → $79 (−6.0%)" },
      { label: "SKU 2210 · Waffle Robe", value: "$118 → $126 (+6.8%)" },
      { label: "SKU 7702 · travel kit", value: "$52 → $49 (−5.8%)" },
      { label: "+ 6 more", value: "all within ±8%" },
    ],
    diffs: [LINEN_THROW_DIFF, ROBE_DIFF, TRAVEL_KIT_DIFF],
    diffNote: "+ 6 more SKUs · all within ±8%",
    expires: "expires 18:00Z",
  },
  {
    id: "d-2",
    kind: "refund",
    title: "Refund order #MR-88113 — Mountain Reads",
    store: "mountain-reads",
    proposedBy: "Support Agent",
    risk: "low",
    impact: "Protects a 4× repeat buyer; order arrived damaged",
    evidence: ["photo evidence attached", "carrier scan shows damage", "buyer LTV $341"],
    detail: [
      { label: "Order", value: "#MR-88113 · $58.40" },
      { label: "Buyer", value: "repeat buyer · 4 orders" },
      { label: "Policy check", value: "within 30-day window" },
    ],
    expires: "expires 14:00Z",
  },
  {
    id: "d-3",
    kind: "listing",
    title: "Publish 12 rewritten Etsy listings — Kaia Ceramics",
    store: "kaia",
    proposedBy: "Listing Optimizer",
    risk: "medium",
    impact: "Projected +31% search impressions over 28 days",
    evidence: ["36 variants · A/B staged", "keyword coverage +18%", "no prohibited terms"],
    detail: [
      { label: "Titles", value: "12 rewritten (≤140 chars)" },
      { label: "Tags", value: "13/13 on every listing" },
      { label: "A/B arms", value: "top 4 listings, 50/50 split" },
    ],
    diffs: [MUG_SET_TITLE_DIFF, MUG_SET_TAGS_DIFF],
    expires: "expires 12:00Z",
  },
];

export const SEED_WATCH_EVENTS: WatchEvent[] = [
  { id: "e-1", ts: "07:04Z", kind: "heal", actor: "inventory-sync", text: "Mountain Reads rate-limit recovered — backoff succeeded on retry 2 (self-healed, no action needed)" },
  { id: "e-2", ts: "06:58Z", kind: "anomaly", actor: "price-sentinel", text: "Competitor undercut detected on 3 Halcyon SKUs — packed as decision d-1" },
  { id: "e-3", ts: "06:40Z", kind: "review", actor: "tl-agent", text: "Overnight audit complete: 3 stores, 0 security findings, 2 margin flags" },
  { id: "e-4", ts: "06:02Z", kind: "dispatch", actor: "orchestrator", text: "Mission m-1 dispatched — 3 lanes, 2 workers assigned" },
  { id: "e-5", ts: "05:41Z", kind: "anomaly", actor: "cart-saver", text: "Abandoned-cart spike on Halcyon (+38% vs baseline) — mission m-3 spawned" },
];

export const SEED_SKILLS: Skill[] = [
  {
    id: "price-sentinel",
    name: "Price Sentinel",
    glyph: "⌖",
    tagline: "Watches competitor prices and your margins, 24/7.",
    watches: "competitor prices · cost changes · elasticity",
    acts: "drafts repricing decisions for your approval",
    risk: "acts-with-approval",
    events7d: 412,
    installedOn: ["halcyon", "mountain-reads"],
  },
  {
    id: "listing-optimizer",
    name: "Listing Optimizer",
    glyph: "✎",
    tagline: "Rewrites listings that stopped selling.",
    watches: "search rank · CTR · conversion per listing",
    acts: "drafts new titles/tags, A/B tests the top movers",
    risk: "acts-with-approval",
    events7d: 268,
    installedOn: ["halcyon", "kaia"],
  },
  {
    id: "cart-saver",
    name: "Cart Saver",
    glyph: "◔",
    tagline: "Catches abandoned carts before they cool.",
    watches: "cart events · checkout abandonment",
    acts: "drafts recovery emails (never sends without you)",
    risk: "acts-with-approval",
    events7d: 189,
    installedOn: ["halcyon"],
  },
  {
    id: "review-responder",
    name: "Review Responder",
    glyph: "☾",
    tagline: "Answers reviews in your voice, kindly and fast.",
    watches: "new reviews across all connected stores",
    acts: "drafts public replies; escalates the angry ones",
    risk: "acts-with-approval",
    events7d: 97,
    installedOn: ["mountain-reads"],
  },
  {
    id: "stock-scout",
    name: "Stock Scout",
    glyph: "▦",
    tagline: "Knows what you'll run out of, before you do.",
    watches: "inventory velocity · supplier lead times",
    acts: "read-only forecasts (restock packs coming soon)",
    risk: "read-only",
    events7d: 55,
    installedOn: [],
  },
  {
    id: "ad-watcher",
    name: "Ad Watcher",
    glyph: "◉",
    tagline: "Guards your ad spend like it's its own.",
    watches: "ROAS · burn rate · listing quality score",
    acts: "flags waste, never pauses campaigns without you",
    risk: "read-only",
    events7d: 31,
    installedOn: [],
  },
];

export const MORNING_BRIEF = {
  date: "2026-10-19",
  summary:
    "Night watch: all three stores healthy. One self-heal (Woo rate-limit), two margin flags packed as decisions, one recovery mission spawned.",
  checks: [
    "3 stores audited overnight — 0 security findings",
    "Mountain Reads rate-limit self-healed at 07:04Z",
    "2 margin flags → decision d-1 awaiting you",
    "Cart-saver spike +38% → mission m-3 running",
  ],
  numbers: [
    { label: "Revenue 7d", value: "$40,960", delta: "+9.2%", up: true },
    { label: "Orders 7d", value: "475", delta: "+6.1%", up: true },
    { label: "Open decisions", value: "3", delta: "2 urgent", up: null },
    { label: "Watch events", value: "854", delta: "all green", up: true },
  ],
};

export function storeName(id: string): string {
  return SEED_STORES.find((s) => s.id === id)?.name ?? id;
}

export function platformOf(id: PlatformId): Platform {
  return PLATFORMS.find((p) => p.id === id)!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zcode emergence (R-B1) — new-task composer + full settings model.
// Everything below EXTENDS the base vocabulary above; nothing breaks.
// ─────────────────────────────────────────────────────────────────────────────

// ——— New task: quick-start templates ———

export type TaskTemplate = {
  id: string;
  glyph: string;
  title: string;
  blurb: string;
  goal: string; // pre-fills the composer
};

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "tpl-reprice",
    glyph: "⌖",
    title: "Reprice flagged SKUs",
    blurb: "Margin table, competitor moves, decisions packed",
    goal:
      "Reprice the SKUs Price Sentinel flagged this week across my stores — pack anything above ±5% margin impact as a decision, never apply it silently.",
  },
  {
    id: "tpl-refresh",
    glyph: "✎",
    title: "Refresh stale listings",
    blurb: "Rewrite what stopped selling, A/B the movers",
    goal:
      "Find listings with falling search rank over the last 28 days, rewrite their titles and tags, and A/B the top four against current copy.",
  },
  {
    id: "tpl-carts",
    glyph: "◔",
    title: "Recover abandoned carts",
    blurb: "Three-email sequence, sends as decisions",
    goal:
      "Draft a three-email recovery sequence for carts abandoned in the last 7 days — every send packed as a decision, nothing auto-sent.",
  },
  {
    id: "tpl-audit",
    glyph: "▤",
    title: "Audit a store",
    blurb: "Dead listings, price drift, policy risk",
    goal:
      "Run a full audit on the store: dead listings, price drift, stale inventory, and policy risk — report findings with evidence for each.",
  },
];

// ——— New task / missions: project groups ———

export type ProjectGroup = {
  id: string;
  name: string;
  tint: string; // tailwind bg-* class for the marker dot
  blurb: string;
};

export const SEED_GROUPS: ProjectGroup[] = [
  { id: "spring", name: "Spring Push", tint: "bg-emerald-500", blurb: "Seasonal repricing + listing refresh wave" },
  { id: "etsy", name: "Etsy Refresh", tint: "bg-orange-500", blurb: "Listing copy overhaul for Kaia Ceramics" },
  { id: "always", name: "Always-on", tint: "bg-violet-500", blurb: "Standing watch: prices, carts, reviews" },
];

// ——— Settings: model + permissions ———
// FE2: the full model catalog (GLM-5.3, GLM-5.3-Flash, … the zcode lineup)
// lives in ./models; `model` here is a catalog id string, `effort` is a
// reasoning level, and `models` is the configured provider list.

export const MODEL_SETTINGS_SOURCE =
  "Catalog verbatim from the zcode desktop app (rev 33).";

export type PermissionFamily =
  | "store-reads"
  | "price-changes"
  | "listing-edits"
  | "customer-emails"
  | "refunds"
  | "ad-spend";

export type PermissionPolicy = "auto" | "ask" | "block";

export const PERMISSION_FAMILIES: {
  id: PermissionFamily;
  label: string;
  description: string;
}[] = [
  {
    id: "store-reads",
    label: "Store reads",
    description: "Products, orders, inventory — the read-only catalog layer.",
  },
  {
    id: "price-changes",
    label: "Price changes",
    description: "Repricing SKUs — Price Sentinel territory.",
  },
  {
    id: "listing-edits",
    label: "Listing edits",
    description: "Titles, tags, copy — publishing new listing versions.",
  },
  {
    id: "customer-emails",
    label: "Customer emails",
    description: "Recovery sequences and review replies, drafted in your voice.",
  },
  {
    id: "refunds",
    label: "Refunds",
    description: "Refunding orders when policy and evidence line up.",
  },
  {
    id: "ad-spend",
    label: "Ad spend",
    description: "Campaign budget changes — the money faucet.",
  },
];

export const PERMISSION_POLICIES: { id: PermissionPolicy; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "acts alone, evidence logged" },
  { id: "ask", label: "Ask", hint: "packs a decision for you" },
  { id: "block", label: "Block", hint: "never — even if asked" },
];

// ——— Settings: automations, commands, hooks, MCP ———

export type Automation = {
  id: string;
  name: string;
  schedule: string; // humanized preset
  stores: string[]; // store ids
  skill: string; // skill id
  enabled: boolean;
};

export const AUTOMATION_SCHEDULES = ["06:00 daily", "every 6h", "weekly Monday"];

export type CustomCommand = {
  id: string;
  name: string; // slash-prefixed
  description: string;
  body: string; // the real prompt body
  enabled: boolean;
};

export type Hook = {
  id: string;
  event: string; // "when"
  action: string; // "does"
  enabled: boolean;
};

export const HOOK_EVENTS = [
  "before price change",
  "after listing publish",
  "on decision approved",
  "before customer email send",
  "on watch anomaly",
  "after store sync",
];

export type McpStatus = "connected" | "idle" | "error";

export type McpServer = {
  id: string;
  name: string;
  status: McpStatus;
  tools: number;
  scope: string[]; // store ids the server may touch
  enabled: boolean;
};

// ——— Settings: the full settings state ———

export type AgentTone = "warm-professional" | "plain-spoken" | "enthusiastic";

export const AGENT_TONE_OPTIONS: { id: AgentTone; label: string }[] = [
  { id: "warm-professional", label: "Warm professional" },
  { id: "plain-spoken", label: "Plain-spoken" },
  { id: "enthusiastic", label: "Enthusiastic" },
];

export type Verbosity = "terse" | "balanced" | "detailed";

export type ComputerUseSettings = {
  enabled: boolean;
  headless: boolean;
  allowedDomains: string[];
};

export type NotificationSettings = {
  morningBriefTime: string; // "07:00"
  morningBriefEnabled: boolean;
  watchDigest: boolean;
  decisionAlerts: boolean;
};

export type DataSettings = {
  retentionDays: number;
  piiRedaction: boolean;
  evidenceExport: boolean;
};

export type SettingsState = {
  agentName: string;
  agentTone: AgentTone;
  /** Catalog model id ("GLM-5.3", …) — the workspace default for new missions. */
  model: string;
  /** Reasoning effort for the default model ("max", "high", "enabled", …). */
  effort: string;
  /** Configured model providers (Z.ai + BigModel presets + custom). */
  models: ModelProviderConfig[];
  verbosity: Verbosity;
  permissions: Record<PermissionFamily, PermissionPolicy>;
  automations: Automation[];
  commands: CustomCommand[];
  hooks: Hook[];
  mcp: McpServer[];
  computerUse: ComputerUseSettings;
  notifications: NotificationSettings;
  data: DataSettings;
};

export const SEED_SETTINGS: SettingsState = {
  agentName: "Atlas",
  agentTone: "warm-professional",
  model: "GLM-5.3",
  effort: "max",
  models: defaultProviderConfigs(),
  verbosity: "balanced",
  permissions: {
    "store-reads": "auto",
    "price-changes": "ask",
    "listing-edits": "ask",
    "customer-emails": "ask",
    refunds: "ask",
    "ad-spend": "ask",
  },
  automations: [
    {
      id: "a-1",
      name: "Price Sentinel sweep",
      schedule: "06:00 daily",
      stores: ["halcyon", "mountain-reads"],
      skill: "price-sentinel",
      enabled: true,
    },
    {
      id: "a-2",
      name: "Listing rank check",
      schedule: "every 6h",
      stores: ["kaia"],
      skill: "listing-optimizer",
      enabled: true,
    },
    {
      id: "a-3",
      name: "Review round-up",
      schedule: "weekly Monday",
      stores: ["mountain-reads"],
      skill: "review-responder",
      enabled: false,
    },
  ],
  commands: [
    {
      id: "cmd-1",
      name: "/reprice",
      description: "Reprice SKUs flagged since the last sweep",
      body:
        "Scan the flagged SKUs on {stores}. Rebuild the margin table against the last 14 days of competitor moves, then draft repricing decisions for anything above ±5% impact. Pack high-impact changes as decisions — never apply without approval.",
      enabled: true,
    },
    {
      id: "cmd-2",
      name: "/refresh",
      description: "Rewrite stale listings",
      body:
        "Pull search rank and CTR for every listing on {stores} from the last 28 days. Rewrite titles and tags for the 12 worst movers, keep titles ≤140 chars, avoid prohibited terms, and stage A/B arms for the top four.",
      enabled: true,
    },
    {
      id: "cmd-3",
      name: "/carts",
      description: "Draft a cart recovery sequence",
      body:
        "Snapshot carts abandoned on {stores} in the last 7 days. Draft a three-email recovery sequence in the store's voice — every send packed as a decision, never auto-sent. Include a discount arm only if margin allows.",
      enabled: true,
    },
    {
      id: "cmd-4",
      name: "/audit",
      description: "Run a full store audit",
      body:
        "Run a full audit on {stores}: dead listings, price drift beyond ±8%, stale inventory past two lead-times, and policy risk (prohibited terms, missing policies). Report findings with evidence chips for each category.",
      enabled: true,
    },
  ],
  hooks: [
    { id: "h-1", event: "before price change", action: "attach margin evidence to the decision", enabled: true },
    { id: "h-2", event: "after listing publish", action: "log to watch feed + evidence trail", enabled: true },
    { id: "h-3", event: "on decision approved", action: "apply within 5 min + note in morning brief", enabled: false },
  ],
  mcp: [
    { id: "mcp-1", name: "shopify-admin", status: "connected", tools: 28, scope: ["halcyon"], enabled: true },
    { id: "mcp-2", name: "woo-rest", status: "connected", tools: 19, scope: ["mountain-reads"], enabled: true },
    { id: "mcp-3", name: "etsy-openapi", status: "idle", tools: 12, scope: ["kaia"], enabled: true },
    { id: "mcp-4", name: "amazon-spapi", status: "error", tools: 34, scope: [], enabled: false },
  ],
  computerUse: {
    enabled: false,
    headless: true,
    allowedDomains: [
      "admin.shopify.com",
      "woocommerce.com",
      "etsy.com",
      "sellercentral.amazon.com",
    ],
  },
  notifications: {
    morningBriefTime: "07:00",
    morningBriefEnabled: true,
    watchDigest: true,
    decisionAlerts: true,
  },
  data: {
    retentionDays: 90,
    piiRedaction: true,
    evidenceExport: true,
  },
};

// ——— New task: composer option vocabularies ———

export const CONTEXT_OPTIONS = [
  { id: "morning-brief", label: "Today's brief" },
  { id: "watch-feed", label: "Watch feed" },
  { id: "competitor-digest", label: "Competitor digest" },
];

export type GuardrailKey = "prices" | "publishing" | "data" | "spend";

export const GUARDRAILS: { key: GuardrailKey; label: string; helper: string }[] = [
  { key: "prices", label: "Price guard", helper: "Repricing beyond ±5% impact must be approved" },
  { key: "publishing", label: "Publish guard", helper: "Listing changes wait for your checkbox" },
  { key: "data", label: "Data guard", helper: "Customer data stays redacted in evidence" },
  { key: "spend", label: "Spend guard", helper: "Ad budget moves need your sign-off" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Zcode emergence (R-B2) — mission session replays.
// ─────────────────────────────────────────────────────────────────────────────

// ——— Missions: session replay transcripts ———

export type ReplayEvent = {
  ts: string;
  kind:
    | "dispatch"
    | "tool"
    | "evidence"
    | "approval-wait"
    | "resume"
    | "done";
  actor: string;
  text: string;
  duration?: string;
};

export type MissionReplay = {
  events: ReplayEvent[];
};

export const SEED_REPLAYS: Record<string, MissionReplay> = {
  "m-1": {
    events: [
      { ts: "06:02Z", kind: "dispatch", actor: "orchestrator", text: "Mission dispatched — 3 stores" },
      { ts: "06:03Z", kind: "tool", actor: "competitor_crawl", text: "Competitor crawl + margin table — 14-day window", duration: "41m 12s" },
      { ts: "06:44Z", kind: "evidence", actor: "wkr-a7", text: "1,204 rows crawled · sealed" },
      { ts: "06:45Z", kind: "evidence", actor: "wkr-a7", text: "margin-model v3 · 61 flagged" },
      { ts: "06:58Z", kind: "approval-wait", actor: "tl-agent", text: "holding for your approval — d-1" },
      { ts: "07:12Z", kind: "resume", actor: "orchestrator", text: "resumed after your approval" },
      { ts: "07:14Z", kind: "done", actor: "orchestrator", text: "done — 9 batches applied" },
    ],
  },
  "m-2": {
    events: [
      { ts: "22:47Z", kind: "dispatch", actor: "orchestrator", text: "Mission dispatched — 12 listings in scope" },
      { ts: "22:48Z", kind: "tool", actor: "listing-optimizer", text: "Copy variants — 12 listings × 3 arms", duration: "1h 04m" },
      { ts: "23:52Z", kind: "evidence", actor: "wkr-d9", text: "36 variants written · sealed" },
      { ts: "23:54Z", kind: "evidence", actor: "wkr-d9", text: "keyword coverage +18%" },
      { ts: "00:06Z", kind: "tool", actor: "ab-router", text: "A/B arms staged — top 4 listings, 50/50 split", duration: "12m 08s" },
      { ts: "00:19Z", kind: "approval-wait", actor: "tl-agent", text: "holding — d-3" },
    ],
  },
  "m-3": {
    events: [
      { ts: "07:15Z", kind: "dispatch", actor: "orchestrator", text: "Mission dispatched — cart recovery funnel" },
      { ts: "07:16Z", kind: "tool", actor: "segment-snapshot", text: "Cart segment snapshot — 7-day window", duration: "18m 41s" },
      { ts: "07:35Z", kind: "evidence", actor: "wkr-b1", text: "1,847 carts in scope · avg value $67.20" },
      { ts: "07:36Z", kind: "evidence", actor: "wkr-b1", text: "buyer-thought teardowns attached" },
      { ts: "07:41Z", kind: "tool", actor: "sequence-drafter", text: "2 of 3 emails drafted" },
    ],
  },
};
