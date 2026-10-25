# UNiCOM Console — Frontend Redesign Spec (payswap-3.0 translation)

TL design document for the redesign wave. Source exemplar: `/home/z/repos/payswap-3.0` (the operator's
approved shipped console). Domain: **commerce — ecommerce + local commerce** (PaySwap adapted ZCode to
payments; UNiCOM adapts the same substrate to commerce). Every worker in this wave MUST read this spec
fully before touching code, and re-read §0 + §8 before writing any copy.

Exemplar files workers may consult directly:
- `/home/z/repos/payswap-3.0/packages/payswap-app/src/console/ConsoleChrome.tsx` (chrome + icons + footer)
- `/home/z/repos/payswap-3.0/packages/payswap-app/src/console/sections/*.tsx` (section patterns)
- `/home/z/repos/payswap-3.0/packages/payswap-app/src/console/sections/shared.tsx` (SectionScaffold, ReferenceCard)
- `/home/z/repos/payswap-3.0/DESIGN.md` (the parent design law)

---

## 0. The one-paragraph design law

Calm, dense, operational — never decorative. Warm paper neutrals, one emerald accent, hairline borders,
text hierarchy over color, honest states everywhere (loading = skeleton, empty = typed reason + real next
action, counts only ever from loaded state), 44px touch targets, keyboard-first. Every section is a stack
of `SectionHeader → blocks` under a shared shell. The voice is plain, honest, commerce-first: agents plan,
the merchant approves, every action leaves evidence.

## 1. Preservation contract (NEVER break)

- All 35 zustand mutations keep their names + semantics; `HydratePayload` shape unchanged; all 13 API
  handlers unchanged; all 8 prisma models unchanged; seed data unchanged.
- Fail-soft law: demo seeds paint instantly; `live:false` + toast on hydrate failure; dual-path mutations
  keep byte-equivalent local fallbacks.
- ⌘K palette, HeartbeatStrip telemetry, hydration-safe clock pattern (`useState<Date|null>(null>` +
  `setTimeout(0)` first tick), toast-queue drain — all keep working.
- `Section` union changes exactly once (worker 4-a, §6) — everyone else consumes it.
- No new routes: the whole console stays on `/` with section switching.
- Sticky-footer law: root `min-h-screen flex flex-col`, footer `mt-auto`, natural push on overflow.

## 2. New navigation architecture (the payswap 8-section shape)

**Nav order (pinned):** Overview · Missions · Commander · Decisions · Stores · Watch · Skills — under a
"Workspace" group label — then a hairline divider, then **Settings pinned at the end** (same nav landmark).

**Section id map:**

| id | Nav label | Status |
|---|---|---|
| `overview` | Overview | NEW — the outcome-first home; absorbs `command` (morning brief folds in, live-computed) |
| `missions` | Missions | restyled |
| `chat` | Commander | restyled (id unchanged) |
| `decisions` | Decisions | restyled + reference card |
| `stores` | Stores | restyled as the connections surface + **local commerce platform** |
| `watch` | Watch | restyled |
| `skills` | Skills | restyled |
| `settings` | Settings | pinned at nav end; restyled chrome |
| `newtask` | *(no nav item)* | the primary action: topbar button, rail top button, mobile topbar, ⌘K action, overview intake |
| `command` | — | RETIRED from union; brief content absorbed by Overview |

New union (worker 4-a applies, all references fixed):
`"overview" | "missions" | "chat" | "decisions" | "stores" | "watch" | "skills" | "newtask" | "settings"`

## 3. Design tokens — globals.css retune (Tailwind 4 / shadcn variable system)

Keep the existing variable structure; swap values to the payswap warm-stone + emerald system. **No indigo,
no blue.** Light:

```
--background: #fafaf8      --foreground: #1c1a17
--card: #ffffff            --card-foreground: #1c1a17
--popover: #ffffff         --popover-foreground: #1c1a17
--primary: #047857         --primary-foreground: #ffffff
--secondary: #f4f3f0       --secondary-foreground: #44403a
--muted: #f4f3f0           --muted-foreground: #5c5750
--accent: #ecfdf5          --accent-foreground: #065f46
--destructive: #b91c1c     --destructive-foreground: #ffffff
--border: #e7e4de          --input: #e7e4de        --ring: #1c1a17
--sidebar: #fafaf8         --sidebar-foreground: #5c5750
--sidebar-accent: #ecfdf5  --sidebar-accent-foreground: #065f46
--sidebar-border: #e7e4de  --sidebar-ring: #1c1a17
chart: emerald ramp (#047857, #059669, #10b981, #34d399, #a7f3d0)
radius: keep existing (0.5rem-ish; cards render rounded-xl via component classes)
```

Dark (warm stone dark, emerald lifts):

```
--background: #131211      --foreground: #f4f3f0
--card: #1c1a17            --card-foreground: #f4f3f0
--popover: #1c1a17         --popover-foreground: #f4f3f0
--primary: #10b981         --primary-foreground: #052e21
--secondary: #2b2925       --secondary-foreground: #e7e4de
--muted: #232120           --muted-foreground: #a8a29a
--accent: #052e21          --accent-foreground: #a7f3d0
--destructive: #f87171     --destructive-foreground: #1c1917
--border: #2b2925          --input: #2b2925        --ring: #f4f3f0
--sidebar: #131211         --sidebar-foreground: #a8a29a
--sidebar-accent: #052e21  --sidebar-accent-foreground: #a7f3d0
--sidebar-border: #2b2925  --sidebar-ring: #f4f3f0
```

Amber stays the attention color (semantic only — alerts, attention cards, awaiting states): use Tailwind
`amber-*` classes directly as today. Red stays failure-only. Shadows stay restrained (existing shadcn).

## 4. Shell spec (page.tsx — worker 4-a)

Root: `min-h-screen flex flex-col bg-background text-foreground`.

1. **Skip link** — first focusable element: "Skip to main content" → `#console-main` (visually hidden until
   focus).
2. **Topbar** (sticky, border-b, bg-background/95 backdrop-blur, h-14):
   - Leading: **UNiCOM mark** — `h-7 w-7 rounded-lg bg-[#131211]` tile carrying an inline SVG: emerald
     `#10b981` ring — `<circle cx="16" cy="16" r="8.5" fill="none" stroke="#10b981" stroke-width="2.4"/>`
     + a filled node on the ring `<circle cx="22.5" cy="9.5" r="2.6" fill="#10b981"/>` (32 viewBox; the
     ring + a store on it — always the dark tile, both themes, like the payswap mark). Then wordmark
     **UNiCOM** (font-semibold tracking-tight). Then the framing chip:
     `<span class="rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">Commerce
     Workspace</span>` (hidden below sm).
   - Actions (keep existing behaviors): stores-live badge (`{n} stores live`, pulse dot, hidden on xs), ⌘K
     palette button, theme toggle, primary **New task** button.
3. **HeartbeatStrip** — keep exactly as-is content-wise (watch N stores · sync nominal · review N awaiting
   you | clear · UTC clock); restyle only to sit as a slim strip under the topbar (border-b, sunken bg
   `bg-muted/40`, mono 11px). It is our resident-watch signature — honest telemetry, live-derived.
4. **Shell row**: `flex flex-1` → sidebar + main.
   - **Sidebar** (`hidden lg:flex sticky top-[calc(3.5rem+2rem)] h-fit w-64 shrink-0 flex-col border-r
     bg-sidebar px-3 py-4` — sticky below topbar+heartbeat): primary full-width **New task** button
     (justify-start) → `setSection("newtask")`; group label `WORKSPACE` (text-xs font-semibold uppercase
     tracking-wider text-muted-foreground px-3); 7 nav buttons (icon 16px + label, `aria-current`,
     decisions badge amber); `mt-1 border-t` divider; pinned Settings; then **mt-auto** the trust-contract
     rail card (dashed border, text-xs): "Every agent action leaves evidence. Every risky action needs
     your checkbox. That's the whole contract."
   - **Main**: `<main id="console-main" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6
     lg:pb-10 lg:px-8">` → `<div className="mx-auto flex max-w-3xl flex-col gap-6">` — **max-w-3xl
     (880px)**, the payswap content column. Sections render here (section switch unchanged in mechanism).
5. **Mobile nav row** (replaces the bottom bar + More sheet — the payswap pattern): `<nav
   aria-label="Workspace sections">` under the topbar+heartbeat, `lg:hidden`, single-line horizontal
   scroll (`flex gap-1 overflow-x-auto border-b bg-background px-3 py-2`), items = all 8 (Overview →
   Settings) with 16px icon + label, **min-h-11 (44px)**, `whitespace-nowrap`, active = `bg-accent
   text-accent-foreground font-semibold` pill. Remove: MobileTabButton grid, FAB, More Sheet.
6. **Honest footer** (mt-auto, border-t, bg-sidebar, text-xs text-muted-foreground, two lines):
   - Line 1: `UNiCOM Commerce Workspace — {durability} No live store corridors are connected; nothing here
     executes or simulates real store writes.` where durability = `live` ?
     "Missions, decisions and chat are persisted by the workspace backend and survive reloads." :
     "Backend unreachable — running on demo data; changes stay in this session."
   - Line 2 (only from loaded state; `hydrating` → "Workspace counts load with the backend."):
     `{n} stores · {m} missions · {k} decisions open — counted from the loaded workspace state.`
   - Mobile: `pb-[env(safe-area-inset-bottom)]` extra on the footer's bottom padding.

## 5. Section scaffold (every section, every worker)

```tsx
<header className="flex flex-col gap-1.5">
  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
    UNiCOM Commerce Workspace
  </p>
  <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
  <p className="max-w-2xl text-sm text-muted-foreground">{lede}</p>
</header>
```

- Blocks inside a section: `section.flex.flex-col.gap-2` with an h2 `text-base font-semibold` + optional
  note `text-sm text-muted-foreground max-w-3xl`.
- Cards: shadcn Card, `rounded-xl border` (hairline), `p-5`-ish interiors, gap-4/6 stacks. Reference
  cards: `bg-card` + a muted "Reference" outline badge + `dl` term/line rows (term `text-sm font-medium`
  w-40ish column, line `text-sm text-muted-foreground`).
- Attention card: `rounded-xl border border-l-[3px] border-l-amber-500 bg-card p-5` + amber outline badge
  "Attention".
- Status pills: keep existing Badge patterns; semantic only.
- Empty states: title `{Thing} — the honest state`, typed reason, and a REAL next action (button or nav
  link — in-page targets via `scrollIntoView`, never `href="#…"`).
- Never fabricate: counts from state only; `hydrating` → skeleton lines.

Section ledes (verbatim):
- **Overview** — "Outcome-first starting point: commission work, clear decisions, watch the ring."
- **Missions** — "Multi-step work, split into lanes and run by workers — reviewed before anything touches a store."
- **Commander** — "One agent, every store. It plans first, shows evidence, and packs risky moves as decisions."
- **Decisions** — "The trust frontier — agents propose with evidence; nothing ships until you check the box."
- **Stores** — "Connect every storefront you run — online and in-person — into one ring, one catalog, one watch."
- **Watch** — "The resident monitor — heartbeats every cycle, self-healing when platforms misbehave, everything on the record."
- **Skills** — "Capability packs for the agent pool. Install per store — a skill starts watching the moment it lands."
- **Settings** — "Every guard, every schedule, every tool — the whole operating contract lives here."
- **New task** — "Say what needs doing — the agent plans it, guards it, and reports evidence at every step."

## 6. Overview — the outcome-first home (worker 4-a owns; absorbs command.tsx)

1. Scaffold (title "Overview").
2. **The outcome question block**: h2 `text-[26px] font-semibold tracking-[-0.01em] leading-tight
   (sm:text-2xl)` — **"What should UNiCOM accomplish?"** + sub `text-sm text-muted-foreground max-w-2xl` —
   "Describe an outcome. The agent plans it, you approve it, evidence lands in Watch."
3. **Intake entry card** (`rounded-xl border bg-card p-5 flex flex-col gap-3`): sr-only label "Tell your
   agents what you need"; borderless textarea rows=2 placeholder **"Tell your agents what you need …"**
   (transparent bg, focus ring on the card); suggestion line `text-sm text-muted-foreground` — "Reprice
   flagged SKUs, refresh stale listings, recover abandoned carts, or set up in-person selling."; actions
   row justify-end: primary **"New mission"** → `setDraft({...draft, job: text})` (only when text
   non-empty) + `setSection("newtask")`.
4. **"Start with an outcome"** — 2×2 grid (`grid gap-3 sm:grid-cols-2`), cards `rounded-xl border bg-card
   p-5 text-left transition-colors hover:border-foreground/25` with a 22px lucide glyph (stroke 1.75) +
   title `font-semibold` + description `text-sm text-muted-foreground`:
   - **Reprice** — "Fix prices and margins" (glyph `Tags`)
   - **Refresh** — "Rewrite what stopped selling" (glyph `PenLine`)
   - **Recover** — "Win back abandoned carts" (glyph `Undo2`)
   - **Audit** — "Sweep a store for drift" (glyph `ScanSearch`)
   Click → apply the matching template's draft (same payloads as the New Task templates) +
   `setSection("newtask")`.
5. **"Today's brief"** — LIVE-computed from state (never the static MORNING_BRIEF constants; keep
   data.ts exports untouched for compatibility): date line `text-sm text-muted-foreground` —
   "{Weekday}, {Month D} · the watch ran all night · {stores.length} stores connected"; 4 KPI cards
   (`rounded-xl border bg-card p-4`, number `text-2xl font-semibold tabular-nums`, label `text-xs
   uppercase tracking-wider text-muted-foreground`):
   - Revenue 7d: `$${sum(stores.revenue7d)}` + `±{avg delta weighted}` sub-line
   - Orders 7d: `sum(orders7d)`
   - Open decisions: `decisions.length` + sub "(n high-risk)"
   - Watch ring: `watchEvents.length} events on record`
   Brief note (composed, honest): one line summarizing attention-stores, heal events, anomalies from the
   loaded ring. Footer actions: "Review N decisions" → `setSection("decisions")`, "Ask the agent" →
   `setSection("chat")`. If `stores.length === 0`: honest empty "No stores connected yet — the brief
   starts when your first store joins the ring." + "Connect a store".
6. **Attention card** (amber left border): decisions.length > 0 → badge "Attention" + h2 "Decisions
   needing your call" + line "{n} packets are holding at the frontier — agents cannot proceed until you
   check the box." + link "Open Decisions". Else quiet card: "Frontier clear — agents are running free on
   approved rails only."
7. **"Missions in progress"** — live list of missions with status !== "done": bordered rows
   (`rounded-xl border bg-card p-4`): title (font-medium), meta line `text-xs text-muted-foreground
   font-mono` — "{status} · {lanes.length} lanes · {eta} · updated {started}", status badge, "Open" →
   `setSection("missions")`. Empty (two-reason honest): no missions at all → "No missions exist yet —
   commission the first one above."; all done → "No missions in progress — every recorded mission is
   done. Records stay readable in Missions."
8. **"Recent activity"** — last 12 watchEvents (kind badge + text + `ts` mono), link "Open the full Watch
   feed" → `setSection("watch")`. Empty: "No events on the record yet."
9. Delete `command.tsx`; remove its import; keep `MORNING_BRIEF` in data.ts (unused is fine — no data.ts
   edits by 4-a).

## 7. Section responsibilities (workers 4-b/4-c/4-d)

### 4-b — New task + Commander
- **newtask.tsx**: adopt the scaffold + lede; keep EVERY control (templates, job, scope, project,
  autonomy, guardrails, sticky mission preview, Launch). It now also receives prefills (overview job text
  / template application land via the existing `draft` state — ensure applying a template from Overview
  then arriving here shows it). Restyle cards to hairline `rounded-xl` discipline.
- **chat.tsx** (Commander): scaffold + lede; keep @-context chips, plan-first switch, suggestions,
  plan lists + Approve/Request changes, inline diff preview, jump links, thinking state, footnote.
  Restyle bubbles: user `rounded-xl bg-secondary`, agent `rounded-xl border bg-card`, mono timestamps.

### 4-c — Stores + Decisions + Skills
- **data.ts**: add to PLATFORMS: `local: { name: "Local", glyph: "⌂", tint: amber-ish, scopes: "In-person
  · POS · Local pickup · Camera capture" }`. Nothing else in data.ts changes.
- **stores.tsx**: scaffold + lede + **headerAside env pill**: `rounded-full border bg-emerald-50
  border-emerald-200 text-emerald-800` (dark: `bg-emerald-950/40 border-emerald-900 text-emerald-300`)
  with a green dot + "Test environment". Then:
  - **"Store catalogue"** h2 + note "The platforms your ring can speak — online marketplaces and the
    local edge." + grid `grid gap-3 sm:grid-cols-2 xl:grid-cols-3` of 7 platform tiles (the 6 platforms +
    Local): mark tile (glyph, platform tint), name, scopes line, meta "Connected · n stores" (live count)
    or "Not connected", button Connect/Explore → `startConnect(platform)`. Local tile copy: **"Local —
    in-person"** + "POS, local pickup, a camera, even no API."
  - **"Connected stores"** h2 — the live store cards (restyled existing card: everything stays — health,
    stats, delta, sync/audit, apiUsage bar, skills, sync/reconnect/revoke). Empty state (honest, when 0):
    "No stores connected — the honest state" + reason "Nothing is connected yet; the catalogue above
    records the first connection." + action "Connect your first store".
  - **ConnectDialog**: platform grid now 7 (Local included, amber tile + ⌂). Form step: for `local` the
    domain field label becomes "Where it lives — street or neighborhood" (placeholder "e.g. 214 Main
    St · weekend market"), else unchanged. Flow steps for `local` (the honest local path):
    1. **Capture** — "Choose a capture — a POS export, phone-camera scans, or a file drop. Even systems
       without an API can join the ring."
    2. **Reconcile** — "Physical observations stay observations until reconciled — counts settle before
       they're truth."
    3. **Watch** — "Your local presence joins the nightly audit and the heartbeat strip."
    mono line: `edge · capture: pos-export | camera | file-drop`. Online platforms keep the existing
    Authorize/Sync/Watch steps + `oauth · scope:` line verbatim.
  - Local store cards render domain as the location + platform label "in-person" (PLATFORMS lookup drives
    it — no special-casing beyond the label).
- **decisions.tsx**: scaffold + lede; add (top, after scaffold) the Reference card **"What the frontier
  gates"** (badge "Reference", note "Reference only — how the approval plane reads. No decision is
  minted from this page; skills pack them as they watch.") with three rows:
  - **Material terms** — "What a decision gates on the action side — the exact SKUs, prices, listings or
    refunds, always with a diff before and after."
  - **Authority scope** — "Who may approve what — your permission matrix in Settings decides which
    actions the agent may take alone."
  - **Before execution** — "Consequential actions wait at the frontier; an unapproved risky action never
    proceeds — 'Continue' is never authorization."
  Keep: cards, kind icons, risk badges, detail tables, evidence chips, diff views, approve/decline,
  resolved history ("Handled today"), existing empty states (append " — the honest state" to their
  titles).
- **skills.tsx**: scaffold + lede; restyle the honesty card into the Reference card pattern (badge
  "Reference", title "The risk tiers are honest", keep the three-tier copy verbatim). Keep install/manage,
  per-store chips, event counts.

### 4-d — Missions + Watch + Settings
- **missions.tsx**: scaffold + lede; keep groups rails, mission cards, lane chips, evidence drawer, diff
  bundle line, session replay player, pause/resume. Restyle to the card discipline. Empty (when 0): "No
  missions yet — the honest state" + reason + action → newtask.
- **watch.tsx**: scaffold + lede; keep per-store monitor cards + skills-on-watch card; "Event stream" h2
  note becomes: "The real ring record, newest first — append-only, never rewritten, never fabricated."
  Keep max-h-96 overflow-y-auto stream + custom scrollbar.
- **settings.tsx**: scaffold + lede; keep all 12 tabs and every control + danger zone exactly; restyle
  tab chrome to the calmer discipline (the 12-tab inventory is frozen — labels/titles/descs verbatim).

## 8. Copy voice rules

- Plain, operational, honest. No exclamation marks. No marketing adjectives.
- Payswap-style honesty constructions, commerce-native: "— the honest state" empty titles; "counted from
  the loaded workspace state"; "never rewritten, never fabricated"; UNKNOWN is never FAILURE.
- Keep established UNiCOM voice: evidence-first, trust frontier, the ring, "nothing ships without your
  checkbox".
- Commerce vocabulary everywhere: SKUs, listings, carts, margins, orders, storefronts, in-person, local
  pickup — never payment-rail vocabulary.

## 9. Quality gates (every worker)

1. `bun run lint` → 0 errors / 0 warnings.
2. `bunx tsc --noEmit` → 0 errors in src/.
3. Boot the dev server once (`bun run dev` background, single Bash call, kill after) — `/` renders, no
   console errors in dev.log.
4. No dead actions; every button does something real.
5. Append your worklog section (template below) — the TL verifies independently regardless.
