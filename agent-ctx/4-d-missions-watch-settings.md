# 4-d — Missions + Watch + Settings (redesign §5 scaffold, §7-4d, §8 voice, §9 gates)

Worker record for the redesign wave. Spec: `agent-ctx/REDESIGN-SPEC.md`. My
three files: `src/components/product/missions.tsx`, `watch.tsx`,
`settings.tsx`. §1 preservation contract held throughout — zero store.ts /
data.ts / API changes; markup + styling reorganization only.

## What landed

- **missions.tsx** — full restyle to the calm card discipline:
  - §5 scaffold (eyebrow "UNiCOM Commerce Workspace" + h1 "Missions" +
    the spec's verbatim lede "Multi-step work, split into lanes and run by
    workers — reviewed before anything touches a store." — the old lede's
    "reviewed by the orchestrator" wording replaced per spec §5).
  - Everything kept: project-group rails (dot/tint/name/blurb/count + the
    w-1 tint rail), "One-offs" + count + "not filed under a group" block,
    mission cards (h3 title, status badge, brief, mono started/eta/lanes/
    group/store·platform meta line, Evidence button → Sheet drawer with
    per-lane evidence chips + the "diff bundle 41f2c9 · tl-review PASS ·
    ship-gates 8/8" line verbatim), 3-col lane chips (name/status/progress%/
    worker), the session replay player (44px round prev/play/next controls,
    event counter + state line, per-kind timeline dots, per-event ts/actor/
    duration/text, 1200ms auto-advance + restart-from-end).
  - Honest empty state (new, spec-mandated): "No missions yet — the honest
    state" / "Nothing has been commissioned in this workspace — the record
    starts with the first task." / "Launch a new task" → setSection("newtask").
  - Long-list law: the replay timeline is now bounded (max-h-80
    overflow-y-auto + THIN_SCROLL custom scrollbar) with an auto
    scrollIntoView({block:"nearest"}) on idx change so playback keeps the
    active event in view. framer-motion entrance delays capped at index 6.
  - Replay dot for `tool` changed violet → ink (`bg-foreground/45`);
    `evidence` stone (`bg-muted-foreground/60`) — no blue-family hues, text
    hierarchy over color (dispatch emerald / approval amber pulse / resume
    emerald ring / done emerald fill unchanged).
  - Mission title demoted h2 → h3 (group names own h2); Evidence button
    44px (h-11); semantic section/aria-label landmarks throughout.
- **watch.tsx** — full restyle:
  - §5 scaffold + spec's verbatim lede ("…everything on the record.").
  - Two §5 blocks: "Store monitors" + "Event stream".
  - Per-store monitor cards kept verbatim (watch: "alive · 2m cycle",
    sync: lastSync, skills: count, health pulse dot); grid now
    `sm:grid-cols-2` (the max-w-3xl column makes the old 4-col xl grid
    cramped; 4-c's stores section keeps its own grid). Skills-on-watch
    dashed card kept.
  - Event stream note is the spec's verbatim: "The real ring record,
    newest first — append-only, never rewritten, never fabricated." Stream
    bounded at max-h-96 (was max-h-[26rem]) + THIN_SCROLL custom scrollbar;
    kind badges (heartbeat/anomaly/self-heal/review/dispatch) + ts·actor
    mono line + text kept; container is a role=list/listitem structure so
    framer-motion rows stay semantic.
  - Two honest empties added (spec §5 law; reachable states): stores →
    "No stores on the ring — the honest state" + reason + "Connect a store"
    → setSection("stores") (reachable via the danger-zone disconnect-all);
    events → "No events on the record yet."
- **settings.tsx** — scaffold + chrome restyle, inventory frozen:
  - §5 scaffold (eyebrow + h1 "Settings" + verbatim lede). Root stack
    `flex flex-col gap-6`.
  - Tab chrome, quieter selected treatment: mobile chip strip 44px pills
    (`bg-accent font-semibold text-accent-foreground` — accent surface, no
    brand fill), sticky at the shell's `top-[calc(3.5rem+2rem)]` (verified:
    sits at 88px under the 89px header on mobile); desktop rail normal-case
    text-sm min-h-11 buttons with the same selected treatment, same sticky
    offset, THIN_SCROLL on the rail's own overflow. Both keep aria-current
    + focus-visible rings.
  - TabHeader h2 → text-base font-semibold (block pattern).
  - All 12 tabs + every control preserved verbatim (ids/labels/titles/
    descs): general (name/tone/model/reasoning/verbosity), permissions
    (6×3 matrix, intro card now hairline), automations, commands, hooks,
    MCP (reconnect for error servers), computer use (fence + domains),
    stores tab (sync/reconnect/revoke + ConnectDialog import untouched),
    notifications, data & privacy, danger zone, about. All 17 settings
    mutations untouched in name/semantics.
  - 44px targets: every section-surface Button bumped to h-11 (New
    automation/command/hook, Add server, Sync all, Connect store, export,
    all three danger triggers); icon buttons h-11 w-11; domain chips
    min-h-11 with an h-8 w-8 remove control; CollapsibleTrigger min-h-11;
    radio-card / chip controls get focus-visible rings.
  - Long-list law: automations, commands grid, hooks, MCP grid, stores-tab
    rows all max-h-96 overflow-y-auto + THIN_SCROLL.
  - Danger zone: pause-all card now the §5 attention pattern
    (border-l-[3px] border-l-amber-500, p-5); the two destructive cards
    keep border-destructive/40; all three double-confirm AlertDialogs
    verbatim.

## Shared convention added (in-file, per file)

`THIN_SCROLL` — the same thin custom-scrollbar class string 4-a used on
Overview's recent-activity list (scrollbar-color/width + webkit thumb
rounding). Later workers can copy it.

## Verified in-browser (agent-browser, dev :3000 — never restarted)

- Missions: group rails + cards + lane chips render; replay expand → play
  auto-advances (prev unlocks, label flips to Pause); Evidence drawer
  opens with lane chips + the diff bundle line; drawer close works.
- Watch: scaffold + both blocks; monitor lines verbatim; stream list with
  kind badges + ts·actor; the new note renders verbatim.
- Settings: all 12 tabs walked; live mutation battery — setPermission
  (Store reads auto→ask), toggleAutomation (on→off→on), reconnectMcp
  (amazon-spapi error→connected, "34 tools live" toast), computer-use
  fence (master on → Allow enabled → domain added → removed), prompt-body
  collapsible, syncStore, revoke dialog cancel path, pause-all +
  disconnect-all dialog cancel paths, export toast.
- Danger zone reset exercised for real: trigger + "Reset everything"
  confirm → clean seed restored (Store reads back to auto, amazon-spapi
  back to error with its Reconnect button) — the workspace was left in the
  clean seed state for the operator preview.
- Mobile 390×844: settings chip strip 44px chips, sticky at 88px after
  scroll; Missions Evidence button exactly 44px; single-column stacking.
- Reload → zero page errors / hydration errors; console clean (HMR noise
  only). Light + dark verified (selected tab = #ecfdf5/#065f46 light,
  #052e21/#a7f3d0 dark; card radius 14px = rounded-xl).

## Gates

lint 0/0 · tsc 0 errors in src/ (pre-existing non-src noise in download/
examples/harvest/skills only — same set 4-a documented) · dev.log GET / 200
clean · no new console errors.

## Deviations / judgment calls

- Missions lede now the spec's verbatim wording (the pre-redesign file said
  "reviewed by the orchestrator before…" — spec §5 pins the shorter form).
- Replay `tool` dot violet → ink (no-blue-family law; data.ts group tints
  like `bg-violet-500` are 4-c's data, untouched).
- Watch monitor grid 4-col → 2-col at sm (max-w-3xl column; 4-col × 180px
  was not calm). Skills dashed card now sits in the same grid (last cell).
- Two honest empty states added to Watch (stores / events) — not quoted in
  my brief but §5's general law + genuinely reachable states (danger-zone
  disconnect-all); copy follows the honest-state voice.
- Domain remove control is h-8 w-8 inside a min-h-11 chip (chip row is
  the 44px target) — full 44px on the tiny X would balloon the chips.
- Dialog-internal buttons (Cancel/Create/AlertDialogAction) left at shadcn
  defaults, matching every other dialog in the console (4-a's precedent).
- Replay timeline gained scrollIntoView on step change — required by the
  new bounded list; behavior only, no API change.

## For the TL

- 4-c was live in parallel (dev.log shows their local-store connect/delete
  E2E on /api/stores) — no shared files with my lane; my three files are
  exclusively mine per the ownership map.
- The desktop tab rail sticky top and the mobile strip both use the shell
  convention `top-[calc(3.5rem+2rem)]` — if the header height ever changes,
  all three places (page.tsx sidebar ×2, settings ×2) move together.
