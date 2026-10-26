# FE2 SPEC — zcode desktop emergence, wave 2

Operator directive (2026-10-27): *"you need to emerge more features from the original
zcode desktop app (from the repo zai-org/zcode): new task page exactly as is; model
settings with all the models (glm-5.3, glm-5.3 flash, etc.); etc."*

Source of truth: the zcode repo clone at `/home/z/repos/zcode` (READ-ONLY reference —
never edit it). Research build sheets: worklog Task IDs **7-a** (new-task page),
**7-b** (model settings + full catalog), **7-c** (feature inventory). Read those
worklog entries + this spec before any edit.

Wave shape (mirrors the 4-a→4-b/c/d pattern):
- **9-a** (foundation, lands FIRST): model catalog + shared picker + store seams + the
  New Task page rebuilt as the zcode draft experience.
- **9-b ∥ 9-c** (parallel, after 9-a lands): 9-b = Settings "Models" + "Usage" tabs +
  General cleanup; 9-c = Missions worker drilldown + Skills Discover.

## §0 Preservation contract (HARD, all lanes)

1. Every existing store mutation keeps its name + semantics. Additions allowed only
   where this spec names them (`settingsTab`, `setSettingsTab`).
2. `HydratePayload` shape + `hydrate()` Promise.all ordering: untouched. Legacy
   settings migrate client-side AFTER hydrate (§2.3) — never inside the API layer.
3. Fail-soft dual-path, mount-gated clock (`useState<Date|null>` + `setTimeout(0)`),
   toast-queue drain, boot hydrate effect, ⌘K palette, sticky-footer law, `aria-*`
   landmark law: all preserved.
4. Design language: the payswap warm-stone + emerald tokens, NO indigo/blue, 44px
   touch targets, `max-h-*` bounds + the thin custom scrollbar for long lists, calm
   hairline cards, honest (typed-reason) empty states, "— the honest state" titles.
5. Seeds: **only** `SEED_SETTINGS` changes (model/effort/models defaults). Everything
   else in `data.ts` stays byte-identical. NO prisma / route / handler changes — the
   `Setting` singleton JSON row carries all new state.
6. Dev server on :3000 stays running — NEVER restart it. Verify in-browser with
   agent-browser (fresh `--session` per check; errors are sticky across calls).
7. Gates per lane: `bun run lint` 0/0 · `bunx tsc --noEmit` 0 errors in src/ · GET /
   200 · zero page errors + zero console errors · leave the workspace at the exact
   seed truth (delete your own test rows from db/custom.db if you minted any).

## §1 Lane 9-a — foundation + THE NEW TASK PAGE (zcode draft, commerce)

Files owned: `src/lib/product/models.ts` (NEW), `src/components/product/model-picker.tsx`
(NEW), `src/lib/product/store.ts`, `src/lib/product/data.ts`,
`src/components/product/newtask.tsx` (full rebuild), plus glue-only touches in
`src/app/page.tsx`, `src/components/product/overview.tsx`,
`src/components/product/palette.tsx`.

### §1.1 models.ts — the catalog (source verbatim from zcode)

Build the catalog by READING `/home/z/repos/zcode/config/provider/zcode-builtin.json`
(all 6,311 lines — chunked) and `/home/z/repos/zcode/packages/shared/src/official-glm-model-id.ts`.
Export:

```ts
export type ModelApiFormat = "anthropic-messages" | "openai-chat-completions" | "openai-responses";
export type ProviderAccess = "coding-plan" | "api-key";

export type CatalogModel = {
  id: string;                 // verbatim ids: "GLM-5.3", "GLM-5.3-Flash", "GLM-5V-Turbo", …
  contextWindow: number;      // from modelConfigRules.modelRules
  maxOutputTokens: number;
  inputs: ("text" | "image" | "video" | "pdf" | "audio")[]; // text always present
  reasoning: string[];        // e.g. ["low","high","max"] | ["disabled","enabled"] | []
  vision: boolean;            // inputs includes image
};

export type ProviderTemplate = {
  id: string;                 // "zai-api", "zai-standard-api", "moonshot-kimi", …
  name: string;               // en-US display name verbatim: "Z.ai Coding Plan", "Kimi", …
  group: "Zhipu" | "Other";   // Zhipu = zai-*/bigmodel-*; everything else Other
  access: ProviderAccess;
  apiKeyManagementUrl: string;
  apiFormat: ModelApiFormat;
  baseUrl: string;
  logo: string;               // "zai" | "bigmodel" | "kimi" | "minimax" | …
  models: string[];           // ordered verbatim from builtinModelIds
  enabledByDefault: string[]; // from templateModelRules (zai-*: GLM-5.3 + GLM-5.3-Flash)
};

export type ModelProviderConfig = {
  id: string;                 // "zai" | "bigmodel" | "p-<ts>" for custom
  name: string;
  preset: boolean;
  templateId?: string;
  access: ProviderAccess;
  apiFormat: ModelApiFormat;
  baseUrl: string;
  apiKey: string;             // "" = not set
  enabled: boolean;
  models: { id: string; enabled: boolean }[];
};
```

- `PROVIDER_TEMPLATES`: ALL 21 templates from `templateRules` in file order, complete
  model lists (zai-standard-api carries the full 24: GLM-5.3, GLM-5.3-Flash,
  GLM-5V-Turbo, GLM-5.1, GLM-5.1-Highspeed, GLM-5, GLM-5-Turbo, GLM-4.7,
  GLM-4.7-FlashX, GLM-4.7-Flash, GLM-4.6, GLM-4.5-Air, GLM-4.5, GLM-4.6V,
  GLM-4.6V-Flash, GLM-4.6V-FlashX, GLM-4.1V-Thinking-FlashX, GLM-4.1V-Thinking-Flash,
  GLM-4-FlashX-250414, GLM-4-Flash-250414, GLM-4V-Flash, codegeex-4, charglm-4,
  emohaa). `enabledByDefault` from `templateModelRules` where present (transcribe at
  least zai-api / zai-standard-api / bigmodel-* / moonshot-kimi / minimax / deepseek /
  qwen / anthropic / openai; others default to their first model).
- `CATALOG_MODELS`: per-model rules from `modelConfigRules.modelRules` — the GLM
  family COMPLETE (23 official ids; use the values 7-b recorded: glm-5.3 → 1M ctx /
  low·high·max / 128K out; glm-5.3-flash → + image·video·pdf; glm-5.2 → 1M /
  disabled·high·max; glm-5.x → 200K / disabled·enabled / 64K; 4.7 family → 200K /
  131K out; 4.6V line → 131K ctx, image; 4.5(-Air) → 131,072 / 98,304; codegeex-4 →
  131,072; charglm-4 + emohaa → 8,192 ctx). Plus the major non-GLM families the Other
  templates list (kimi-k3 1,048,576 / low·high·max; MiniMax-M3 image+video; deepseek
  v4 384K out; qwen3.8 low·medium·xhigh; gpt/claude families per the rules file) —
  transcribe from the source, don't invent. Unknown models fall back to a global
  default (1M ctx / no reasoning) via `modelRuleFor(id)`.
- Helpers: `formatContextWindow(n)` → "1M"/"200K"/"131K"…; `modelRuleFor(id)`;
  `isHighspeed(id)` → `/glm/i && /highspeed|flashx/i`; `DEFAULT_MODEL_ID = "GLM-5.3"`;
  `DEFAULT_EFFORT = "max"` (zcode auto-completes new selections at the HIGHEST level);
  `migrateSettings(settings)` (§2.3); `defaultProviderConfigs()` (seed shape below).

### §1.2 store.ts + data.ts seams

- `TaskDraft` += `mode: "confirm" | "autonomous" | "full"` (default `"confirm"`),
  `model: string` (default `DEFAULT_MODEL_ID`), `effort: string` (default `DEFAULT_EFFORT`).
  `freshDraft` seeds these. Existing fields untouched.
- `SettingsState`: `model: string` (widened from the 3-model union; delete `ModelId`
  + `MODEL_CARDS`), `reasoning` REMOVED from type + seed, `effort: string` added,
  `models: ModelProviderConfig[]` added. `SEED_SETTINGS` gets:
  `model: "GLM-5.3"`, `effort: "max"`, and `models: defaultProviderConfigs()` =
  Z.ai preset (coding-plan, enabled, models GLM-5.3+GLM-5.3-Flash enabled — the
  console's connected mode) + BigModel preset (api-key, enabled, apiKey "" → Not
  ready, same two models enabled but provider disabled). Everything else in the seed
  byte-identical.
- Store state += `settingsTab: string` (init `"general"`) + `setSettingsTab(t)`.
- **Migration (client-side, after hydrate applies settings):** if `settings.models` is
  missing/empty → defaultProviderConfigs(); if `settings.effort` missing →
  DEFAULT_EFFORT; normalize legacy model ids (`glm-4.7`→`GLM-4.7`, `glm-4.6`→`GLM-4.6`,
  `glm-4.7-air`→`GLM-4.5-Air`, unknown→DEFAULT_MODEL_ID). The persisted DB row carries
  the old shape — this keeps hydrate honest without touching the API layer.
- `setSettings` already persists arbitrary partials — model settings mutations ride it
  (`setSettings({ model, effort, models })`). NO new mutations beyond setSettingsTab.
- palette.tsx: actions += "Model settings" → `setSettingsTab("models")` +
  `setSection("settings")`. Nav items unchanged.
- overview.tsx / page.tsx: glue only (the intake + outcome shortcuts keep writing
  `setDraft({ goal })` + `setSection("newtask")` — the new page consumes the prefill;
  keep the sr-only h1 landmark inside newtask.tsx).

### §1.3 model-picker.tsx — the shared picker (zcode ModelConfigSelect, commerce)

Props: `value: { providerId: string; modelId: string; effort: string }`,
`onChange(v)`, optional `compact`. Anatomy (zcode verbatim structure):

- Trigger: ghost button `h-11` — Package lucide icon + model id (+ `{Provider}/`
  prefix when provider ≠ Z.ai family) + effort indicator (a 3-dot mini meter when the
  model has >2 levels, or a small on/off dot) + ChevronDown. Tooltip "Choose model".
  While open, trigger label swaps to "Select model" (zcode behavior).
- Dropdown (Popover, side top, w-80): 
  - "Provider" label — provider rows: logo tile (letter mark), name, mode badge
    ("Coding Plan" | "API"), status dot (Ready emerald / Not ready amber / Disabled
    gray), CheckMark on selected.
  - "Models" label — the selected provider's rows: mono model id + context-window
    badge ("1M"/"200K") + Vision badge (Eye icon + "Vision") + Check on selected;
    disabled rows greyed with a lock tooltip "Enable this model in Model settings".
  - "Effort" label — the selected model's reasoning levels: a Slider when >2 levels
    (low/max etc., tick labels mono) or a Switch for disabled/enabled models; a
    faster bubble animation note is NOT needed — keep it calm.
  - Sticky footer: "Manage models" → `setSettingsTab("models")` + `setSection("settings")`.
- Keyboard/pointer minimums: all rows min-h-11, focus-visible rings, aria roles
  (menu/listbox semantics per the console's existing popovers).
- The picker NEVER mutates settings — it reports upward. The composer stores the
  choice in the draft; the Settings default card stores it via setSettings.

### §1.4 newtask.tsx — THE NEW TASK PAGE, rebuilt as the zcode draft experience

Replace the form-based composer with the zcode draft page, commerce-translated.
Structure top→bottom (zcode anatomy from 7-a §B):

1. **sr-only scaffold**: `<h1 className="sr-only">New task</h1>` (landmark law) — the
   page itself renders NO visible section header (zcode: no visible draft header).
2. **Centered column**: `mx-auto w-full max-w-2xl flex-1 flex flex-col` with breathing
   room (`justify-center` when the draft is empty).
3. **Empty state** (renders ONLY while `draft.goal` is empty):
   - **Watermark**: the UNiCOM ring-mark SVG (same mark as the topbar tile), centered,
     aria-hidden, `w-56 opacity-[0.06] dark:opacity-[0.08]`, CSS
     `mask-image: linear-gradient(to bottom, black 60%, transparent 95%)`.
   - **Greeting** (the zcode 6-slot machine, mount-gated per the hydration law —
     `useState<string|null>(null)` + effect sets it; SSR renders nothing):
     boundaries [5,9,12,14,18,23]; a `setTimeout` re-renders at the next boundary.
     Verbatim copy (zcode en-US):
     - 05–09 "Morning, ready when you are"
     - 09–12 "Morning, how can I help?"
     - 12–14 "Noon break?"
     - 14–18 "Good afternoon! Leave the rest to me."
     - 18–23 "Evening, nice work today"
     - 23–05 "It's late—remember to take care of yourself."
     `text-2xl sm:text-3xl font-medium text-center tracking-tight`.
4. **Composer card** (always): `rounded-2xl border bg-card shadow-sm` with inner stack:
   - **Context header strip** (`border-b px-3 py-2 flex items-center gap-2`): the
     Scope chip — ghost button showing `"{n} stores · {m} skills"` or `"Select scope"`
     + ChevronDown; opens the Scope popover (absorbs the old Scope/Project/Guardrails
     cards): sections **Stores** (checkbox rows with platform glyph + health dot; the
     keep-at-least-one-store toast path preserved verbatim), **Skills** (chips,
     min-h-11), **Context** (chips — Today's brief / Watch feed / Competitor digest),
     **Project** (radios: Ungrouped / groups / "New group…" + inline name input),
     **Guardrails** (the 4 switches with their amber off-warning helpers verbatim).
     Popover = `w-80 max-h-[26rem] overflow-y-auto` + thin scrollbar. The chip also
     shows a group dot when a group is selected.
   - **Textarea** (draft.goal): borderless `w-full resize-none min-h-10 max-h-56
     overflow-y-auto bg-transparent focus:outline-none text-[15px]`; placeholder:
     **"Describe what UNiCOM should do — @ for stores, skills, and context"**;
     Enter = launch attempt, Shift+Enter = newline (keydown handler, IME-safe:
     ignore Enter while `isComposing`); typing "@" opens the Scope popover (light
     mention affordance); autofocus on mount only when `window.matchMedia(
     "(pointer: fine)").matches` (no mobile keyboard popup).
   - **Toolbar row** (`flex items-center gap-1 pt-2`):
     - Left: **[+] Add context** ghost icon button (Plus) → opens the same Scope
       popover (zcode: add-context menu); **Mode switch** ghost button `h-11` —
       icon (Hand/ShieldCheck/ShieldAlert by mode) + rolling label
       ("Ask before changes" | "Autonomous" | "Full access") + ChevronDown; dropdown
       `w-72`: a "Plan first" checkbox item, description **"Draft the mission plan
       before any store is touched."** (maps to draft.autonomy plan/act), then a
       radio group (zcode verbatim, commerce descriptions):
       - **"Ask before changes"** — Hand icon — "Writes pack decisions for your
         approval." (default; maps draft.mode "confirm")
       - **"Autonomous"** — ShieldCheck — "Acts alone inside your permission matrix."
       - **"Full access"** — ShieldAlert — "Runs with fewer confirmations."
       When plan-first is on, an inline **"Plan"** chip (Lightbulb icon, ✕ on hover,
       tooltip "Remove Plan from this mission") renders at the textarea's top-right
       like zcode's plan marker.
     - Right (`ml-auto`): the **model picker** (§1.3, value = draft.model/effort on
       the selected provider, onChange → setDraft) + **send button** `h-11 w-11
       rounded-lg bg-primary text-primary-foreground` — ArrowUp icon, disabled until
       `ready` (goal + stores), Spinner while launching; tooltip "Launch mission".
   - **Helper line** under the card (`text-xs text-muted-foreground px-1`): the honest
     armed reasons — `!goalOk` → "Describe the mission first — a sentence is enough.";
     else `!storesOk` → "Pick at least one store — the mission needs somewhere to run.";
     else → summary: `"Launches {Plan first|Immediately} · {mode label} · {model} ·
     {effort} effort"`.
5. **Suggested chips** (only while draft.goal is empty; `mt-6`): horizontal scroll row
   (`overflow-x-auto` thin scrollbar), chips `min-h-11 rounded-full border bg-card
   px-4` with a lucide icon + label, staggered entrance (framer, 65ms × index, delays
   capped). Content = the 4 TASK_TEMPLATES (labels: "Reprice flagged SKUs" Target
   icon, "Refresh stale listings" PenLine, "Recover abandoned carts" MailPlus,
   "Audit a store" ClipboardSearch) + two honest extra suggestions:
   - "Restock best-sellers before the weekend" (PackagePlus) → goal "Check 28-day
     sales velocity across my stores and draft restock orders for every SKU trending
     below a 10-day cover — pack the orders as decisions."
   - "Audit this week's failed orders" (CircleAlert) → goal "Pull every failed or
     cancelled order from the last 7 days across my stores, group them by failure
     reason, and draft the recovery steps with evidence."
   Click → `setDraft({ goal: <payload> })` (templates carry their existing goal
   payloads). New constant `SUGGESTED_MISSIONS` lives in newtask.tsx (local).
6. **Start over**: when draft is non-default, a ghost icon button (RotateCcw,
   "Start over") at the composer card's top-right corner — resetDraft + the existing
   toast. Prefill from Overview lands here through draft.goal (the textarea is
   controlled by draft.goal).
7. **Launch** = the existing `launchTask()` (never re-implement): same toasts, same
   mission creation, same navigation. Enter in the textarea calls the same path.

Deviations from the old page are intentional: the template tiles, the Scope/Project/
Autonomy/Guardrail cards and the sticky Mission preview are ABSORBED (scope popover +
mode dropdown + suggested chips). All draft fields remain live — nothing in the store
contract is lost.

### §1.5 9-a verification (in-browser, agent-browser)

Empty draft → watermark + time-greeting + composer + chips; typing hides the empty
state; Scope popover round-trip (store toggle + keep-one toast, skills, context,
group select, guardrail toggles); mode dropdown (plan-first chip appears/dismisses;
three modes roll the trigger label); model picker (provider rows, model rows with
badges, effort slider, "Manage models" → Settings); Enter launches (mission lands,
Missions section, toast); Shift+Enter newline; Overview "Reprice" → prefill lands in
the composer; palette "Model settings" action; reload persistence (settings.models
survives hydrate + legacy-row migration); light + dark; mobile 390 (chips scroll,
44px targets); zero console errors.

## §2 Lane 9-b — Settings: MODELS tab + USAGE tab + General cleanup

Files owned: `src/components/product/settings.tsx`. Consumes 9-a's `models.ts` +
`model-picker.tsx` + the `settingsTab` store seam (replaces the local active-tab
state with `settings.settingsTab` + `setSettingsTab` so palette/picker deep-links
work). Read the current settings.tsx fully first; keep every other tab byte-stable
(only the tab-state wiring changes).

### §2.1 TABS changes

- Insert **Models** as the 2nd tab (after General): icon Package, title
  "Model settings", desc "The brains your missions think with — configured once,
  available everywhere work is dispatched."
- Insert **Usage** after Data & privacy: icon ChartColumn (or BarChart3), title
  "Usage", desc "What the ring actually did — counted from the local record, never
  estimated."
- **General tab**: remove the model cards + reasoning slider (absorbed by Models);
  keep agentName / tone / verbosity; add a hairline "Default model" row showing the
  current default + effort (mono) + a "Manage" link-button → setSettingsTab("models").

### §2.2 Models tab surface (zcode ModelProviderSection, commerce)

- Header row: Refresh icon-button (toast "Model settings refreshed") + **"Add
  provider"** primary-outline button → template picker pane.
- **Default model card** (top): the shared ModelPicker bound to
  `settings.model/effort` via setSettings + note: "New missions start with the
  default. Change it per mission in the composer."
- **Split panel** (`rounded-xl border grid md:grid-cols-[224px_1fr] min-h-[36rem]`,
  mobile = rail collapses to icon-width or a Select):
  - **Left rail**: group "Providers" — preset cards Z.ai + BigModel (letter tile,
    name, status dot: Ready / Not ready / Disabled — Ready = enabled && (coding-plan
    || apiKey set)); group "Custom providers" (hidden when empty) with rows + a
    trailing "Add provider" row. Selected row = accent surface + aria-current.
  - **Right detail — provider card**:
    - Header: logo tile + name (inline-editable for custom: click to edit, Enter
      commits) + enable Switch (tooltips "Enable provider" / "Disable provider") +
      kebab (Rename / Delete — custom only; Delete confirm dialog VERBATIM zcode:
      title `Delete provider "{name}"?`, body "This removes the custom provider
      configuration. Related edits on the current settings page will not be restored
      automatically.", action "Delete provider").
    - **Connection** section: "Base URL" (presets read-only + lock icon + "(read
      only)"; custom editable, placeholder "https://api.example.com/v1") + "API
      format" Select: "Anthropic messages" / "Chat completions (/v1/chat/completions)"
      / "Responses (/responses)".
    - **Access** section: coding-plan → a status card "Coding Plan connected — GLM-5.3
      and GLM-5.3-Flash included."; api-key → "API key" label + password Input
      (placeholder "Enter API key", show/hide eye toggle) + "Get API key" external
      link (ArrowUpRight) to the template's apiKeyManagementUrl.
    - **Model list** section: heading "Model list" + "Add model" (Plus) button. Rows:
      mono model id + context-window badge (pill "1M"/"200K", tooltip
      "Context window: {value}") + Vision badge + per-row enable Switch ("Enable"/
      "Disable") + **Test** icon button (Unplug icon; toast "Testing {provider} /
      {model}" → after ~600ms "{provider} / {model} connected" or, when the provider
      is not ready, "Failed to connect to {provider} / {model} — set the API key
      first") + **Edit** (Pencil → dialog) + **Delete** (Trash — custom-added rows
      only). Preset catalog rows: no Delete (disable instead) — zcode law.
      Rows render in provider.models order; incomplete-config note not needed (we
      always have catalog rules).
    - Empty state (a provider with zero models): dashed card + info icon: "No models
      are configured. Add a model to use it in missions."
  - **Add/Edit model dialog**: title "Add model" / "Edit model settings". Header
    switch **"Smart configuration"** + helper "Matches recommended configuration
    using the model ID, Base URL, and API format. When you manually change a
    setting, that setting becomes manually managed." When on, typing a known Model ID
    auto-fills from `modelRuleFor(id)` and shows the chip "Smart configuration
    matched for this model". Fields: **Model ID** (mono Input; read-only when editing
    a catalog row), **Context window** (number, placeholder = catalog value), **Max
    output tokens** (number), Collapsible **"Advanced settings"**: "Input types"
    chips (Text required-locked + Image / Video / Audio / PDF), "Model capabilities"
    chips (Tool calls / Structured output / Native web search / Mid-conversation
    system messages), "Reasoning levels (low to high)" (comma-separated Input,
    rendered as mono chips below). Footer: "Reset form" (ghost) / "Cancel" / "Save".
    Validation toasts/inline: "Model ID is required", "Context window must be a
    positive integer", "Max output tokens must be a positive integer". Adding a
    custom model appends `{ id, enabled: true }` to the provider (custom rows are
    deletable).
  - **Add provider flow** (replaces the detail pane until Back): "← Back to provider
    details" ghost + h2 "Add provider" + group "Zhipu" (Z.ai Coding Plan, Z.ai API,
    BigModel Coding Plan, BigModel API) + group "Other" — FIRST card "Create custom
    provider" (Plus icon → creates a provider named "New provider", api-key,
    openai-chat-completions, empty models, auto-selected) — then a template card per
    PROVIDER_TEMPLATES entry (logo + name + ChevronRight; 1/2-col grid). Click =
    create from template (models seeded from the template with enabledByDefault) +
    select + toast "{name} added".
- All mutations ride `setSettings({ models })` (optimistic + persisted). 44px law,
  bounded lists (rail + model list `max-h-[26rem]` + thin scrollbar), honest empties.

### §2.3 Usage tab surface (honest, live-derived ONLY)

- **"Mission activity" heatmap**: last 8 weeks × 7 grid from `watchEvents`
  (`createdAt` day buckets), 4-step emerald cell scale, "Less"/"More" legend caption,
  note "Built from the local ring record." (mount-safe: createdAt is persisted data,
  not Date.now() — still render nothing until hydrated state is loaded if needed).
- **Stat tiles** (grid sm:grid-cols-2 xl:grid-cols-3): "Busiest day" (weekday name +
  "about {n} events"), "Missions run" (total + "{k} running"), "Decisions handled"
  ("{approved} approved · {declined} declined" from resolved), "Chat turns"
  (messages count), "Most active actor" (top watchEvents actor by count, mono),
  "Skills on watch" (count). Every tile's number comes from loaded state only.
- **"Model access" card**: the connection summary (Coding Plan · Z.ai · default
  {model} · {effort} effort · {n} models enabled) + honest note: "Quota syncing
  lands with the billing connector — nothing is estimated here."
- Everything bounded + calm; no fabricated numbers, ever.

### §2.4 9-b verification

All 14 tabs walk clean; the models tab round-trips: provider select, enable toggle,
API key show/hide + set (BigModel flips Not ready → Ready), model enable switches,
Test toasts both ways, Edit dialog smart-config autofill ("GLM-4.6" → 200K badge),
Add model (custom row + Delete), Add provider (template + custom), Delete provider
confirm, default-model card picker + "Manage models" deep-link back from the
composer picker; Usage tab renders the heatmap + tiles from the LIVE seed (5 events
→ honest small numbers, never padded); palette "Model settings" opens the tab
directly; General no longer shows model cards; reload persistence; lint/tsc/browser
gates; exact seed restored.

## §3 Lane 9-c — Missions worker drilldown + Skills Discover

Files owned: `src/components/product/missions.tsx`, `src/components/product/skills.tsx`.
NO changes to data.ts/store/models.ts (a LOCAL `MARKET` const in skills.tsx carries
marketplace metadata — presentation-layer reference data like PLATFORMS).

### §3.1 Missions — worker drilldown (zcode SubagentDrilldown, commerce)

- Mission cards keep everything; the 3-col lane chip grid becomes clickable rows
  (each lane chip = a `min-h-11` button, full-width in its cell): click toggles an
  inline **worker drilldown** panel under the chip (only one open per mission):
  - **Worker header**: mono `{worker}` + status badge using the zcode taxonomy
    labels mapped honestly from lane.status — running → "Running", in-review →
    "Waiting", done → "Completed" + the existing progress bar.
  - **Evidence**: the lane's evidence chips (real data, verbatim).
  - **Recent ring activity**: `watchEvents` filtered `actor === lane.worker`, newest
    first, `max-h-48` + thin scrollbar, kind badge + mono ts + text; honest empty
    "No ring events recorded for this worker yet."
  - **Worker states reference card** (the payswap reference-card pattern: badge
    "Reference", hairline, dl rows): Running "Executing its lane right now.",
    Waiting "Holding for a review or an approval.", Blocked "Waiting on another lane
    or an external system.", Completed "Finished with evidence sealed.", Failed
    "Ended in error — the ring re-dispatches when safe.", Cancelled "Stopped by you
    or by a guardrail.", Lost "Contact dropped — the record keeps its last evidence."
    + note "Reference only — how worker states read. The live states come from the
    ring record."
- Session replay, group rails, evidence drawer, honest empties: unchanged.

### §3.2 Skills — Discover (zcode PluginStore, commerce)

- Skills gains a two-way toggle at the top (toggle-pills like the settings chip
  strip): **"Installed"** (the current surface, byte-stable) | **"Discover"**.
- **Discover** surface:
  - Search Input (h-11, placeholder "Search the catalog…") + category chips
    (min-h-11 pills): All / Pricing / Catalog / Ads / Support / Analytics.
  - **Featured strip** (sm:grid-cols-2): the 2 flagship skills (price-sentinel,
    listing-optimizer) as wide cards — glyph tile, name, blurb, risk badge,
    "View details" + install-state line.
  - **Card grid** (`sm:grid-cols-2 xl:grid-cols-3`): every skill — glyph, name,
    developer, category, risk badge, install state ("Installed on {n} stores" /
    "Not installed"), "View details" (min-h-11).
  - **Detail Dialog**: "Information" dl (Developer, Category, Version, Risk tier),
    "Components" dl (Watches / Acts — the skill's real fields verbatim), "Installed
    on" — the per-store install switches (the EXISTING install/manage mutations),
    and the uninstall confirm (AlertDialog): title "Uninstall {name}?", body "This
    removes the skill from every store and clears its saved configuration. This
    cannot be undone.", action "Uninstall".
  - Local `MARKET` const: the 6 seeded skills + category (pricing / catalog /
    support / analytics), developer ("UNiCOM Labs" for the built-ins — honest
    product-catalog truth like PLATFORMS), version ("1.x" style), website omitted.
  - Search filters name/blurb/category with an honest no-match line + clear action.
- Reference card + everything else in skills.tsx unchanged.

### §3.3 9-c verification

Lane chip → drilldown opens/closes (one at a time), taxonomy badges, evidence,
worker-filtered ring activity (wkr-a7 shows its m-1 replay events from the ring
record — REAL cross-reference); reference card renders; Discover: search +
categories filter, featured cards, detail dialog install/uninstall round-trip (the
store chips update live), uninstall confirm verbatim; Installed surface
byte-stable; zero console errors; gates.

## §4 Wave protocol

- Every worker: read worklog tail (from Task 7-a onward) + this spec + your lane
  files before editing; APPEND your worklog entry (template in the worklog) with
  your Task ID; never restart the dev server; never touch files outside your lane
  without TL approval (report the need instead).
- 9-a lands solo. TL smoke-checks. Then 9-b and 9-c run in parallel (disjoint files).
- TL battery (Task 10) follows: full E2E, exact-seed restore (danger-zone reset mints
  the new SEED_SETTINGS defaults), worklog, commit, durability push to unicom-live.
