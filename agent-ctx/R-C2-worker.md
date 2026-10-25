# Work Record — Task ID: R-C2 — worker R-C2 (live wiring + the two LLM brains)

Full situation in `/home/z/my-project/worklog.md` (R-24 recycle recovery →
R-B1 surfaces → R-B2 depth → R-C1 backend spine → this wave). The complete
R-C2 entry is appended to the worklog; this file carries the essentials for
whoever follows (the TL battery / console swap).

## What landed

### 1. src/lib/product/llm.ts — NEW (87 lines)
`extractFirstJson(raw)` (fences stripped → first balanced `{...}`,
string/escape-aware, unparseable → null) · `stripPlanSuffix(text)` (drops a
line-starting "Plan:"/"My plan:"/"The plan:" enumeration; inline mentions
survive) · `truncateSentences(text, max=900)` (sentence boundary, decimals
like 3.14 are not boundaries, hard cut when none). All total — never throw.

### 2. POST /api/chat — REBUILT (161 lines, replaces the stub)
Persists the merchant message FIRST (server-minted `c-<ts>`) → builds the
grounding block FROM THE DB (stores w/ 7d revenue+delta+products+health,
open decision titles, active mission titles+statuses) → replays the last 12
chat turns as history (merchant→user / agent→assistant; pinned context rides
the current turn) → Atlas system persona + planFirst mode + STRICT JSON
`{"reply","plan"}` contract → `zai.chat.completions.create` (thinking
disabled) → llm.ts parsing (degrade: raw text + empty plan; plan ≤6 steps;
reply ≤900 chars sentence-truncated) → agent reply persisted
(`c-<ts>-a`, plan JSON) → `{ok,text,plan}`. `maxDuration = 60`. No
streaming. **SDK-down rung** (undefined by spec): stored graceful fallback
text + empty plan, still `ok` — the route never 500s and every exchange
stays paired in the DB; the client mock covers transport failures.

### 3. POST /api/missions/[id]/plan — REBUILT (179 lines)
LLM lane formation: title/brief/store scope → system+user prompt → STRICT
JSON `{"lanes":[{name,evidence}]}`; names hard-capped 60, evidence 1-2
(default "evidence pending"), `<3 usable → fallback`, `>4 → first 4`;
statuses deterministic (all done except LAST running @25); Plan-formation
lane deleted; ids `l-<ts>-0..`; eta "executing" + status "running" +
orchestrator "Plan formed for … — N lanes running" event. The heuristic
3-lane generator is kept verbatim as the fail-soft brain.

**API DISCOVERY (the one real bug):** the z-ai endpoint rejects a
system-ONLY messages array — error `1214 "messages 参数非法"`. First plan
battery silently fell back to heuristic lanes (visible in dev.log); fixed by
persona/rules → system + mission block → user. Re-verified: real LLM lanes.

### 4. store.ts — LIVE WIRING (821 → 1054)
- `live` / `hydrating` state; module-level `api<T>()` (envelope-aware fetch)
  + `pushSettingsLive(live, patch)` fire-and-forget.
- `hydrate()`: swaps everything from GET /api/hydrate; re-attaches the c-1
  diff+diffLink; settles past sessions' plans approved+complete; re-scopes
  draft stores; live:true on success; on failure "Backend unreachable /
  Running on demo data — changes stay in this session" toast. Never blocks
  first paint.
- Dual-path mutations: finishConnect (server mints id+metrics; failure →
  passed store + installedSkills []), resolveDecision (local ALWAYS + PATCH
  — checkbox never blocks), toggleSkill, syncStore/reconnectStore
  (PATCH {action}), revokeStore (DELETE), sendChat (success pushes text+plan
  — planFirst→planApproved:false holds at step 0, act-now→true ticks;
  failure = the exact 700ms mock), launchTask (POST mission → applyMission →
  POST plan → swap; silent catch; POST failure = local mock mission;
  "__new__" groups pass the MINTED grp-<ts> id so the mission lands in the
  new group).
- All 12 settings mutations → pushSettingsLive (array fields patch
  wholesale — server deepMerge replaces arrays).
- pauseAllMissions/disconnectAllStores drive PATCH/DELETE per item when
  live; resetWorkspace local-only (no reset route; re-hydrate is the
  recovery path — commented in code); syncAllStores left local-only
  ("queued" semantics; deviation noted).

### 5. Surgical UI fixes
- page.tsx (401→408): boot effect `useEffect(() => { void hydrate(); }, [hydrate])`.
- chat.tsx (338→355): context state holds chip IDS; `contextLabels()` maps
  ids → live store names / "Morning brief" / "Watch feed"; suggestions +
  submit pass real labels.
- heartbeat.tsx (72→79): `useState<Date | null>(null)`; first tick via
  `setTimeout(() => setNow(new Date()), 0)` inside the effect + the 1s
  interval; renders `(now ?? new Date(0)).toISOString().slice(11,19)+"Z"` —
  SSR/client first paint agree, hydration mismatch structurally impossible.

## Verification (:3199 single-call pattern, pkill-first; DB now EXACT clean seed)
1. Chat brain: "Which store needs attention first and why? Answer in two
   sentences." → real grounded reply (Mountain Reads −4.1%, needs-attention
   health, pending d-2 refund #MR-88113) + 5-step plan. **LLM path landed.**
2. Plan brain (after the 1214 fix): 4 real lanes w/ evidence, done×3 +
   running@25, "4 lanes running" event. **LLM path landed** (heuristic
   verified as the fallback in the pre-fix run).
3. hydrate persisted the exchange + mission; cleanup script (project root,
   bun-run, deleted) removed 2 missions / 4 watch / 2 chat → final hydrate =
   exact seed (3/3/3/0/5/6/2, c-0+c-1, m-1..m-3, glm-4.7).
4. `bun run lint` 0/0 · `bunx tsc --noEmit` 0 in src/ · GET / 200 (61KB) ·
   :3199 clear.

## For the TL (next steps per R-24)
Battery over the live console, the :3000 swap, worklog restoration, durable
commit, operator report. Known judgment calls are listed in the worklog's
deviations section.
