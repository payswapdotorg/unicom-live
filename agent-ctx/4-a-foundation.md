# 4-a — Foundation lane (tokens + shell + overview)

Worker record for the redesign wave. Spec: `agent-ctx/REDESIGN-SPEC.md` (TL's
design translation of the payswap-3.0 exemplar). My lanes: §2 Section union,
§3 tokens, §4 shell, §6 Overview. §1 preservation contract held throughout.

## What landed

- **globals.css (§3)** — warm-stone + emerald retune, structure untouched.
  Light: `#fafaf8` paper, `#1c1a17` ink, primary `#047857`, accent
  `#ecfdf5`/`#065f46`, borders `#e7e4de`. Dark: `#131211`/`#f4f3f0`, primary
  `#10b981`/`#052e21`, accent `#052e21`/`#a7f3d0`. Ring = ink/paper (spec).
  Amber stays semantic-only (Tailwind classes, as before). Chart = emerald
  ramp (light verbatim from spec; dark lifted one step for surface
  visibility). No indigo/blue.
- **store.ts (§2)** — `Section` union: `"command"` removed, `"overview"`
  first member. Only other internal reference fixed: initial `section`
  state → `"overview"`. ZERO other changes — all 35 mutations, `hydrate()`,
  `HydratePayload`, dual-path semantics byte-identical.
- **overview.tsx (§6, NEW)** — outcome-first home: scaffold header, 26px
  question "What should UNiCOM accomplish?", intake entry card (textarea →
  `setDraft({goal})` + `setSection("newtask")`), Reprice/Refresh/Recover/
  Audit 2×2 grid applying the New Task template goal payloads, "Today's
  brief" LIVE-computed (mount-gated date line, 4 KPI cards from stores/
  decisions/watchEvents state, composed honest note, "Review N decisions" +
  "Ask the agent"), amber attention card / quiet "Frontier clear" card,
  "Missions in progress" with two-reason honest empty, "Recent activity"
  last 12 watch events (max-h-96 scroll, thin scrollbar) + Watch link.
  Never reads `MORNING_BRIEF` (kept in data.ts untouched).
- **command.tsx** — DELETED; import removed from page.tsx.
- **page.tsx (§4)** — shell rewrite: skip link → topbar (dark-tile emerald
  ring-mark SVG both themes, wordmark, "Commerce Workspace" chip, stores-live
  badge, ⌘K, theme, New task) → HeartbeatStrip → desktop w-64 sticky sidebar
  (New task primary, WORKSPACE group: Overview/Missions/Commander/Decisions/
  Stores/Watch/Skills with LayoutGrid/ListTodo/MessageSquare/CheckSquare/
  Store/Radar/Puzzle, divider, pinned Settings, mt-auto dashed trust card)
  + mobile horizontal scroll nav row (8 items, min-h-11 pills) — bottom bar,
  FAB, More sheet removed entirely; main `#console-main` max-w-3xl column;
  honest footer (durability from `live`, counts only when !hydrating,
  safe-area padding). Sticky-footer law kept (min-h-screen flex flex-col,
  footer mt-auto).
- **heartbeat.tsx** — wrapper only: slim h-8 strip, `bg-muted/40`, border-b,
  text-[11px] mono. Clock law (useState<Date|null> + setTimeout(0)) intact.
- **palette.tsx** — Navigate group = new 8 sections (Overview first,
  Settings last, command gone, newtask stays a standing Action);
  "Open today's brief" → `go("overview")`. Groups/behavior unchanged.

## For the later wave (4-b/4-c/4-d)

- Section union is migrated — consume `"overview"`, never `"command"`.
- The shared scaffold pattern lives in overview.tsx (eyebrow + h1 + lede +
  block h2 `text-base font-semibold`); §5 ledes are verbatim in the spec.
- Main column is `max-w-3xl` with `gap-6` — sections render inside it, so
  top-level stacks should not assume wider layouts (the old xl: grids still
  work but the column is narrower now; test at 768px content width).
- Section switch order in page.tsx: overview, missions, chat, decisions,
  stores, watch, skills, newtask, settings.
- Amber badge pattern for decisions counts: `bg-amber-500 text-amber-950`.

## Deviations (all judgment calls, see worklog 4-a for the full list)

- `setDraft({ job })` (spec payswap wording) → `setDraft({ goal })` — our
  draft field name; same merge semantics as the New Task templates.
- "New mission" disabled-when-empty instead of a silent no-op.
- Dark chart ramp lifted one step (light values verbatim; near-invisible on
  the dark surface otherwise).
- Sidebar sticky top keeps spec's exact `top-[calc(3.5rem+2rem)]` (1px below
  the true 89px header bottom — imperceptible).
- layout.tsx document title still says "Multi-Store Command Center" — not in
  my file ownership; TL may want to rename.

## Gates

lint 0/0 · tsc 0 (src/) · GET / 200 · dev.log clean · browser-verified
(desktop 1280, tall 1400 sticky-footer, mobile 390 scroll row, palette,
intake/template/section navigation handoffs, light+dark, skip link, zero
page errors).
