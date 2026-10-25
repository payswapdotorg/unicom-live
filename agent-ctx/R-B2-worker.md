# Work Record — Task ID: R-B2 — worker (zcode depth features, UX-EMERGE-2)

Context for later waves (R-C1/R-C2): full situation in
`/home/z/my-project/worklog.md` (R-24 = recycle recovery, R-B1 = surfaces
wave). R-B1's record with groups/launch semantics lives in
`agent-ctx/R-B1-worker.md`.

## What I built (from the operator-approved UX-EMERGE-2 spec)

Single route kept; zustand `section` switching; no new deps, no new routes,
no backend work. Dev server NOT started (:3000 still held by the replay
console, pid 1625 / /home/z/replay2).

### 1. src/lib/product/data.ts — EXTENDED (712 → 843)
- `DiffRow` {kind "context"|"-"|"+", label?, value?, note?} + `DiffBlock`
  {path, summary?, rows}. Declared BEFORE the seeds (d-1/d-3 reference them
  at module-eval time).
- `LINEN_THROW_DIFF` (halcyon://products/linen-throw-price, "before $84.00 →
  after $79.00", 4 rows: context / − price $84.00 / + price $79.00 /
  context "margin +6.2pt · comp set −$2").
- Compact blocks: ROBE_DIFF + TRAVEL_KIT_DIFF (2 rows each, "− $149.00 /
  + $139.00" and "− $52.00 / + $49.00" — full `halcyon://products/…` paths,
  see deviations), MUG_SET_TITLE_DIFF (title before/after, after-title =
  "Mug set — hand-thrown stoneware, set of 4") + MUG_SET_TAGS_DIFF
  (+ceramic decor / −mugs).
- `Decision` += `diffs?: DiffBlock[]` + `diffNote?: string`; d-1 gets
  [linen, robe, travel-kit] + diffNote "+ 6 more SKUs · all within ±8%",
  d-3 gets [mug-title, mug-tags], d-2 stays diff-less.
- `ReplayEvent` {ts, kind dispatch|tool|evidence|approval-wait|resume|done,
  actor, text, duration?} + `MissionReplay` {events} + `SEED_REPLAYS`:
  m-1 = 7 events ending done "done — 9 batches applied" (incl.
  competitor_crawl 41m 12s, approval-wait "holding for your approval —
  d-1", resume "resumed after your approval"); m-2 = 6 events ending
  approval-wait "holding — d-3"; m-3 = 5 events ending tool "2 of 3 emails
  drafted".

### 2. src/lib/product/store.ts — EXTENDED (778 → 821)
- `ChatMessage` (now EXPORTED) += `planApproved?: boolean`, `diff?:
  DiffBlock`, `diffLink?: {label, section}`.
- seedChat: c-1 appended AFTER c-0 — "While you were away, Price Sentinel
  packed the overnight findings into decision d-1…" with diff:
  LINEN_THROW_DIFF + diffLink "Open decision d-1" → decisions.
- `sendChat(text, planFirst = true, context?: string[])`: plan-first →
  reply plan carries planApproved: false (holds at step 0); act-now →
  planApproved: true (auto-ticks). Context labels acknowledged in the reply
  text ("Context pinned — …").
- `approvePlan(msgId)`: flips held → approved + toast "Plan approved —
  execution continues".
- `tickPlan` guarded: never ticks a plan with planApproved === false
  (undefined still ticks — base behavior preserved).
- resetWorkspace unchanged (seedChat now re-seeds c-1 too).

### 3. src/components/product/diff.tsx — NEW (110)
- `DiffView({block, dense?})`: header bar (mono path, right-aligned summary,
  border) + mono rows — context muted with "·" marker, "−" bg-red-500/10
  text-red(-600/dark:400), "+" bg-emerald-500/10 text-emerald; rows
  whitespace-nowrap inside overflow-x-auto; dense = smaller text/padding.
- `DiffPreview({block})`: same header + first 3 rows + italic muted footer
  "+N more rows — open the decision for the full diff".

### 4. src/components/product/missions.tsx — REWORKED (192 → 494)
- Preserved verbatim: card layout, MissionBadge, LaneChip, Evidence Sheet,
  per-card framer-motion entrance.
- Groups (store's `groups` order): header = tinted dot (group.tint) + name +
  blurb + count Badge + mono group id; cards indented under a w-1 tinted
  rail (bg-class rail instead of border-l — Tailwind can't see
  string-replaced border-* classes; bg-* literals are all scanned).
- Ungrouped (or unknown groupId) → muted "One-offs" header (no dot) LAST.
- Card mono meta row gains a group-tint chip (dot + group name) when grouped.
- "Session replay" chevron row per card (aria-expanded, aria-controls,
  rotating ChevronDown, mono "N events") → ReplayPlayer: prev / play-pause /
  next as h-11 w-11 round buttons (aria-labels) + mono counter
  "i / N · playing|paused|end of session". Vertical timeline: dots per kind
  (dispatch primary / tool violet / evidence stone / approval-wait amber
  +pulse / resume emerald ring / done emerald filled), ts mono + actor chip
  + text + right-aligned duration. Events ≤ i highlighted, beyond dimmed
  opacity-40. Play auto-advances 1200ms, stops at end (next disabled);
  play-from-end restarts at 0. NOTE: stop logic lives inside the
  setTimeout callback — `react-hooks/set-state-in-effect` forbids sync
  setState in effect bodies (eslint-config-next 16 rule).
- Replay source: SEED_REPLAYS[m.id] when present, else synthesized 2-event
  transcript (dispatch + tool "plan forming — first evidence lands in a
  moment") so EVERY card (incl. launchTask missions) has a replay.

### 5. src/components/product/decisions.tsx — EXTENDED (199 → 251)
- `DiffSection` per card: "Review diff" ghost trigger (min-h-11, dashed
  border, FileDiff icon, ChevronDown rotating via group-data-[state=open])
  → Collapsible with dense DiffViews of decision.diffs + mono diffNote.
- Decisions without diffs: italic muted "no diff — policy action".

### 6. src/components/product/chat.tsx — REWORKED (172 → 338)
- Preserved: header, scroller, thinking indicator, suggestions, base
  bubble layout.
- @-context chip row above input: "@{store name}" per connected store
  (platform glyph, tint) + "Morning brief" + "Watch feed"; aria-pressed,
  primary ring/bg when active; local useState string[] of labels.
- "Plan first" Switch (default ON) + helper "agent proposes a plan before
  acting", next to the trust line under the form; submit (and suggestion
  clicks) pass (text, planFirst, context).
- Held plans (plan && planApproved === false): "Approve plan" (emerald
  outline) + "Request changes" (muted ghost) — approve → approvePlan(msgId)
  (toast + ticking begins automatically); request → toast "Change request
  sent". Plan box mono label reads "plan — awaiting your approval" while
  held; blink cursor suppressed while held.
- Approved + fully-ticked plans: mono note "plan approved — execution
  continues".
- Ticking effect now ticks EVERY approved-but-unfinished plan (900ms),
  not just the newest message.
- c-1 renders inline DiffPreview + link-style "Open decision d-1" button →
  setSection("decisions").

### 7. src/components/product/palette.tsx — NEW (145)
- `CommandPalette({open, onOpenChange})` on ui/command.tsx (cmdk):
  Navigate (all 9 sections + icons, spec order Command→…→New Task),
  Actions (Launch a new task / Connect a store / Sync all stores — runs the
  store action / Open morning brief), Recent (top 4 watch events, mono ts +
  truncated text, value includes actor for search matching → watch).
  Empty: `No results — try "reprice" or "settings"`.
- Global keydown (⌘K / Ctrl+K, preventDefault, toggles) inside the
  component.

### 8. src/app/page.tsx — SURGICAL (379 → 401)
- Header: bordered outline Search button (h-9, aria-label "Open command
  palette", aria-keyshortcuts "Meta+K Control+K", ⌘K kbd hint hidden below
  sm) between the stores-live badge and the theme toggle.
- `<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />`
  rendered once before the footer.

### 9. src/components/product/command.tsx — SURGICAL (215 → 267)
- "Commission work" card after the header: Rocket title + blurb "Describe it
  once — the agent plans, you approve, evidence lands in Watch" + primary
  "New task" button + 2 template mini-chips (⌖ Reprice flagged SKUs /
  ▤ Audit a store) → setDraft({goal}) + jump to newtask.

## Verification
- `bun run lint` → exit 0, 0 errors / 0 warnings.
- `bunx tsc --noEmit` → 0 errors in src/. Remaining (pre-existing,
  untouched): harvest/ 21, download/ 3, skills/ 2, examples/ 2,
  .next/dev/types/ 1.
- Dev server not started; :3000 verified held by the replay console
  (/home/z/replay2 next-server pid 1625). dev.log untouched since Oct 24.

## Deviations / interpretation notes
- Spec's robe path "…/robe-v2" read as shorthand for the same prefix →
  full "halcyon://products/robe-v2" (+ travel-kit path). Compact blocks got
  label "price" rows and before→after summaries for header consistency.
- Group rail implemented as a w-1 rounded bg rail using group.tint instead
  of border-l with a derived border-* class (Tailwind 4 only generates
  literal scanned classes; all tint literals are scanned).
- Replay stop-at-end setState moved into the timeout callback to satisfy
  the react-hooks/set-state-in-effect rule (same visible behavior).
- @-context chips pass their labels to sendChat; the agent acknowledges
  them in the reply text (spec left context consumption open).
- One-offs kept the count Badge + a "not filed under a group" whisper for
  parity with group headers (spec only mandated: muted, no dot, last).

## Notes for R-C1/R-C2
- DiffBlock/ReplayEvent are pure data shapes — backend can hydrate
  decisions.diffs and mission replays directly (SEED_REPLAYS keyed by
  mission id; synthesized fallback lives in missions.tsx `replayFor`).
- ChatMessage is exported from store.ts; the plan-approval flow
  (planApproved false→true) is the shape the chat brain should stream into.
- approvePlan/tickPlan guards mean the backend can call tickPlan freely;
  held plans never advance.
