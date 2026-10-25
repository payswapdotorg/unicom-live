# 4-c — Stores (local commerce) + Decisions + Skills

Worker record for the redesign wave (spec §5 scaffold, §7-4c, §8 voice, §9 gates).
Files owned: `src/lib/product/data.ts` (one addition), `src/components/product/stores.tsx`,
`src/components/product/decisions.tsx`, `src/components/product/skills.tsx`.

## What landed

- **data.ts** — the one addition: `PlatformId` += `"local"` (required for the entry
  to typecheck) + `PLATFORMS` entry `{ id: "local", name: "Local", glyph: "⌂",
  tint: "text-amber-600", catalog: "In-person · POS · Local pickup · Camera capture" }`.
  Everything else byte-identical. POST /api/stores validates platform against
  `PLATFORMS.map(p => p.id)` — so "local" is now API-legal with ZERO backend
  changes (verified live: the server minted the store).
- **stores.tsx** — the §7-4c connections surface:
  - Scaffold + verbatim lede + headerAside "Test environment" pill (exact
    light/dark classes from the task, green dot) + header Connect button.
  - "Store catalogue": h2 + note + 7-tile grid (sm:2 / xl:3) — glyph mark,
    name, scopes, live count line ("Connected · n store(s)" | "Not connected",
    semantic dot), Connect button. Local tile: "Local — in-person" /
    "POS, local pickup, a camera, even no API." / ⌂ amber.
  - "Connected stores": search kept (filters name+domain, honest no-match line
    with a real "clear the search" action), live cards keep everything
    (health/stats/delta/synced·audit/API budget/skills chips) + location line
    `{domain} · {platformLabel}` (local → "in-person") + NEW Sync / Reconnect
    (health !== "healthy") / Revoke (AlertDialog) row on the existing
    syncStore/reconnectStore/revokeStore mutations. Dashed "More stores"
    card kept. Zero-stores honest empty ("— the honest state" + reason +
    "Connect your first store" → first connect step).
  - **ConnectDialog**: grid now 7; optional `initialPlatform` prop — a catalogue
    tile pre-picks its platform and lands on the FORM step (per-open session
    key remount; state initializer seeds `picked` — no effect, lint-clean).
    Local: domain label "Where it lives — street or neighborhood", placeholder
    "e.g. 214 Main St · weekend market", submit "Connect Local", description
    "The local edge — even systems without an API can join the ring.", 3-step
    Capture/Reconcile/Watch + mono "edge · capture: pos-export | camera |
    file-drop". Online: byte-identical form + Authorize/Sync/Watch +
    "oauth · scope: read_products, read_orders". finishConnect payload shape
    unchanged; local's empty-domain fallback is "location not set".
- **decisions.tsx** — scaffold + verbatim lede; Reference card "What the
  frontier gates" (badge "Reference", note, Material terms / Authority scope /
  Before execution rows, exact spec copy) directly after the scaffold; empty
  titles appended ("Frontier clear — the honest state", "No decisions yet —
  the honest state" + "Skills pack them as they watch."); decision cards,
  diffs, approve/decline (min-h-11), expiry all kept; "Handled today" bounded
  (max-h-96 + thin custom scrollbar).
- **skills.tsx** — scaffold + verbatim lede; the honesty card converted to the
  Reference card pattern (badge "Reference", title "The risk tiers are honest",
  three dl rows with the current tier copy verbatim, Eye on read-only); install
  dropdown, chips, counts, watches/acts, RiskBadge all kept (min-h-11 bump).

## Key judgment calls (full list in worklog 4-c)

- Tile Connect opens the dialog pre-picked on the platform's FORM step, then
  `startConnect(platform)` on submit — a direct startConnect would skip the
  form and mint "my-store.local.com"-shaped defaults, contradicting the local
  labels the task specifies. Same mutation, same platform id.
- Store cards now carry sync/reconnect/revoke (the task enumerates them under
  "KEEP all existing content and actions"; they previously lived only in
  Settings' connection manager) — existing mutations, no new semantics.
- The data.ts "scopes" string renders in the ConnectDialog grid/picked panel;
  the catalogue tile carries the task's friendlier local copy.
- `platformLabel(id)`: local → "in-person", else PLATFORMS lookup — label only.

## Verified end-to-end (isolated browser session, live :3000)

Local tile → local form (labels/placeholder/submit) → Capture/Reconcile/Watch
progress + edge mono line → finishConnect → POST /api/stores accepted "local"
(server-minted metrics) → card "214 Main St · weekend market · in-person" →
catalogue count flips to "Connected · 1 store" → revoke confirmed → ring
restored to the 3 seeds. Online flow regression-checked byte-identical.
Decisions/Skills reference cards + kept content verified. Env pill colors
lab-checked light + dark. Zero page/console errors.

## Gates

lint 0/0 · tsc 0 errors in src/ (pre-existing non-src noise only) · GET / 200 ·
dev.log clean. §1 preservation held: all 35 mutations untouched, seeds
byte-identical, one PLATFORMS addition.
