# Work Record — Task ID: R-B1 — worker (zcode emergence surfaces, UX-EMERGE-1)

Context for later waves (R-B2/R-C1/R-C2): you can read the full situation in
`/home/z/my-project/worklog.md` (last entry R-24 = recycle #27 damage
assessment; this file is my slice of the rebuild).

## What I built (from the operator-approved UX-EMERGE-1 spec)

All under /home/z/my-project. Single route (src/app/page.tsx), client-side
section switching via zustand. No new deps, no new routes, the 7 base section
components untouched.

### 1. src/lib/product/data.ts — EXTENDED (712 lines total)
- `TaskTemplate` type + `TASK_TEMPLATES` (4 seeds: reprice ⌖ / refresh ✎ /
  carts ◔ / audit ▤, each with a plausible pre-filled goal sentence).
- `ProjectGroup` type + `SEED_GROUPS` (spring "Spring Push" emerald, etsy
  "Etsy Refresh" orange, always "Always-on" violet).
- `Mission.groupId?: string` + backfill m-1→spring, m-2→etsy, m-3→always.
- Full settings model: `SettingsState` (agentName "Atlas", agentTone
  "warm-professional" + 3-tone options, model glm-4.7/air/4.6, reasoning 1–5
  seed 4, verbosity terse/balanced/detailed, permissions Record over 6
  commerce families — store-reads/price-changes/listing-edits/
  customer-emails/refunds/ad-spend — seed reads=auto others=ask,
  automations 3 seeds incl. "Price Sentinel sweep · 06:00 daily", commands 4
  seeds with real prompt bodies (/reprice /refresh /carts /audit), hooks 3
  seeds, mcp 4 seeds (shopify-admin connected 28 [halcyon], woo-rest
  connected 19 [mountain-reads], etsy-openapi idle 12 [kaia], amazon-spapi
  error 34 []), computerUse off/headless-on/4 allowed domains,
  notifications 07:00 brief + digest + alerts, data 90d/pii/export).
- `MODEL_CARDS`, `PERMISSION_FAMILIES`, `PERMISSION_POLICIES`,
  `AGENT_TONE_OPTIONS`, `AUTOMATION_SCHEDULES`, `HOOK_EVENTS`,
  `CONTEXT_OPTIONS`, `GUARDRAILS` (4 commerce guards), `SEED_SETTINGS`.
- All existing exports preserved (StoreConnection/Decision/… untouched above
  the new block).

### 2. src/lib/product/store.ts — EXTENDED (778 lines total)
- `Section` += "newtask" | "settings" (9 total).
- `TaskDraft` {goal, stores, skills, groupId (""|id|"__new__"),
  newGroupName, autonomy plan|act, guardrails {prices,publishing,data,spend},
  context} + `INITIAL_DRAFT` (all seed stores, plan-first, 4 guards on,
  ["morning-brief"]) + internal `freshDraft(storeIds)` helper.
- New state: settings (structuredClone(SEED_SETTINGS)), groups, draft.
- New actions: setSettings (one-level merge); setPermission (+toast);
  toggleAutomation/addAutomation; toggleCommand/addCommand (auto "/"-prefix
  + toast); toggleHook/addHook; reconnectMcp (error→connected + toast);
  toggleMcp; addMcpServer (id mcp-<slug>, idle, tools 0, + toast);
  setComputerUse/setNotifications/setDataSettings; syncStore (lastSync "just
  now" + heartbeat event + toast); syncAllStores (one dispatch event actor
  "you" + toast "Sync queued for N stores"); reconnectStore (healthy + heal
  event); revokeStore (remove + review/you event + toast); pauseAllMissions
  (running lanes→in-review, missions→awaiting-approval, counted toast);
  disconnectAllStores; resetWorkspace (everything back to seeds + toast);
  setDraft/resetDraft; launchTask (validate goal+≥1store else toast "Not
  ready to launch" with reason; "__new__" → create group grp-<ts> tint
  bg-primary blurb "Created from the New Task page"; running Mission
  m-<ts> with one "Plan formation" lane wkr-<2rand> progress 8 "plan
  forming…", prepended; dispatch watch event "Mission dispatched — N stores ·
  plan-first|act-now · all|K of 4 guardrails on"; toast "Mission launched" /
  "Plan forming — first evidence lands in a moment"; draft reset with all
  stores re-scoped; section→missions).
- sendChat untouched (base behavior; chat upgrades are a later wave).

### 3. src/components/product/newtask.tsx — NEW (736 lines)
Composer (xl:grid-cols-[1fr_340px], left composer + right sticky MISSION
PREVIEW): quick-start template row (glyph-prefixed, active ring, click
pre-fills goal); "The job" labelled Textarea + example-phrasings helper;
Scope card (Stores fieldset+legend toggle chips with platform glyph tint,
≥1 store enforced with toast; Skills chips; Context chips); Project
radio-chips (groups + Ungrouped + "New group…" revealing a name Input);
Autonomy RadioGroup two cards ("Plan first" recommended badge / "Act
immediately"); 4 guardrail Switch rows with per-row amber hint "agent may
act without asking" when off; sticky preview card mirroring the draft live
(stores/skills/project/autonomy/guardrails/context) + Launch button
(disabled until valid, helper text explains why) + Start over ghost.
All chips ≥44px (min-h-11), fieldset/legend semantics, aria-pressed.

### 4. src/components/product/settings.tsx — NEW (2077 lines)
"Settings" section, 12 tabs: General (identity, 3 model radio-cards,
reasoning Slider 1–5 with live value + snap/quick/steady/thorough/deep
labels, verbosity chips); Permissions (info card "the approval matrix" +
6×3 radio grid, active cell tinted, each row a real Radix RadioGroup);
Automations (rows + New dialog with schedule presets 06:00 daily / every 6h
/ weekly Monday, store multi-chips, skill select); Commands (mono
slash-cards with collapsible prompt body + Switch + New dialog with live
"/" prefix); Hooks (when→does rows + New dialog, event select + action
input); MCP (status dots connected-emerald/idle-amber/error-red, tools
count mono, scope chips, Reconnect on error, Switch + Add dialog, new
servers idle); Computer Use (fence card master Switch "off = the agent
never touches a browser", headless, allowed-domains chip editor locked
while off); Stores (connection manager rows + Sync/Reconnect + revoke
AlertDialog + "Sync all" + existing ConnectDialog reused); Notifications
(time input + 3 switches); Data & Privacy (30/60/90 retention radio-cards,
PII switch, evidence export → toast "Export queued — evidence bundle will
land in your email"); Danger Zone (pause all missions / disconnect all
stores / reset workspace, each AlertDialog-confirmed, amber→destructive
styling); About (v0.2.0 mono, session id, "development" channel chip,
zcode-heritage blurb). Desktop: sticky left rail with uppercase
micro-labels, scrollable; mobile: sticky horizontal chip strip. Every
dialog has a DialogDescription; every mutation toasts.

### 5. src/app/page.tsx — RESTRUCTURED nav (379 lines)
- 9-entry NAV (command LayoutDashboard, stores Store, missions ListTodo,
  commander MessageSquare, decisions CheckSquare + amber badge = unresolved,
  watch Radar, skills Puzzle, settings Settings; newtask = Plus, rendered
  separately).
- Desktop rail: PRIMARY full-width "New task" button pinned at top (with
  active ring), then grouped OPERATE / SAFETY / SYSTEM with uppercase
  micro-labels, active ring/highlight, dashed contract card kept.
- Header: CTA swapped to "New task" (stores-live badge + theme toggle kept).
- Mobile bottom bar: grid-cols-5 — Command · Stores · center elevated [+]
  (48px round-full, -translate-y, shadow, active ring, aria-label) ·
  Missions · More (Ellipsis, amber decision badge). More opens a bottom
  Sheet (Commander/Decisions/Watch/Skills/Settings, 44px rows, navigate +
  close, sr-only SheetDescription, safe-area padding on bar + sheet).
  Footer pb-16 lg:pb-3 kept. NewTaskSection + SettingsSection wired into
  the switch.

## Verification
- `bun run lint` → exit 0, 0 errors / 0 warnings.
- `bunx tsc --noEmit` → 0 errors in src/ (pre-existing non-src errors only:
  download/, examples/, harvest/, skills/, .next/dev/types — untouched).
- Dev server intentionally NOT started (:3000 held by the replay console).
- Base section components verified untouched (mtimes still at restore time).

## Notes for R-B2
- Groups model lives in store (`groups`, `Mission.groupId`, launchTask
  creates groups on the fly) — missions-section group rendering is yours.
- INITIAL_DRAFT is exported from store.ts if you need the reset semantics.
- sendChat is intentionally still the base mock.
- The settings model is fully typed in data.ts — reuse SEED_SETTINGS for
  any backend hydration (R-C1) rather than re-declaring shapes.
