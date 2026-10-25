# 4-b — New task + Commander lane

Worker record for the redesign wave. Spec: `agent-ctx/REDESIGN-SPEC.md` (TL's
design translation of the payswap-3.0 exemplar). My lanes: §5 scaffold +
§7-4b — `src/components/product/newtask.tsx` (the primary-action surface)
and `src/components/product/chat.tsx` (Commander). §1 preservation contract
held throughout (markup-only; zero store/data/API/page changes).

## What landed

- **newtask.tsx** — §5 scaffold (eyebrow + h1 "New task" + the verbatim
  lede); every control kept whole: quick-start templates (glyph tiles,
  aria-pressed, accent-surface active state), job textarea + verbatim
  examples, Scope (stores/skills/context chips, min-h-11, the
  keep-at-least-one-store toast path), Project (ungrouped/groups/new-group
  radios + conditional input), Autonomy (plan first / act immediately),
  4 guardrail switches with amber off-warnings on hairline divide-y rows
  (the label row is the 44px target), sticky Mission preview
  (`xl:top-[calc(3.5rem+2rem)]`, plain hairline border), Launch task
  armed/disabled with the verbatim reason lines, Start over. Cards =
  `Card gap-4 py-5` + `px-5`, real `h2 text-base font-semibold` block
  headings (CardTitle div → semantic h2), notes text-sm, helpers text-xs.
  Overview prefills (draft.goal from the intake / outcome shortcuts) render
  in the form + preview — the textarea is draft-controlled.
- **chat.tsx (Commander)** — §5 scaffold + verbatim lede; merchant bubbles
  right `rounded-xl bg-secondary`, agent bubbles left `rounded-xl border
  bg-card` under a terminal-tile header; message ids mono
  `text-xs text-muted-foreground` (no timestamps exist on ChatMessage —
  none fabricated); transcript = bounded `max-h-[34rem]` + overflow-y-auto
  + the 4-a thin custom scrollbar + tabIndex 0 inset focus ring;
  "Morning brief" → "Today's brief" (chip label + contextLabels mapping;
  the chip id `morning-brief` unchanged); suggestion chips + context chips
  at 44px; thinking state carries the terminal tile; plan lists with ticks,
  held plans (Approve / Request changes), DiffPreview + decision jump
  links, evidence chips (render only when `m.evidence` non-empty — honest),
  verbatim frontier footnote. `sendChat`/`approvePlan`/`tickPlan` calls
  byte-identical; the tick effect unchanged.

## For the TL / later wave

- The chat transcript bound is a fixed `max-h-[34rem]` (calm, predictable);
  if a taller console feel is wanted, a `dvh`-calc max-h is a one-class swap.
- `ChatMessage.evidence` is wired (`[]` from sendChat) but never populated
  by the live brain today — the chips are ready for the day it is.
- The Scope card's context chip still says "Morning brief" — the label
  lives in `CONTEXT_OPTIONS` in data.ts (shared file; only the chat
  @-context chips were mine to relabel). Consider aligning it if desired.
- Message ids are Date.now-shaped (`c-1792…`) — real state data, honest,
  but long; if the TL prefers short display ids that's a display-only trim.

## Deviations (judgment calls — full list in worklog 4-b)

- CardTitle divs → semantic h2s (§5 block law) — visual result identical.
- Pressed chips / active templates / active context chips use the
  accent-surface selected pattern (4-a nav pills, 4-d tab chrome precedent)
  instead of brand-fill + ring — the emerald stays semantic.
- Suggestion chips + send button raised to 44px (touch-target law).
- dvh full-height chat flex → bounded max-h scroll container per the brief.

## Gates

lint 0/0 · tsc 0 (src/) · GET / + /api/hydrate 200 · dev.log clean ·
browser-verified end-to-end (prefill → launch → missions; sendChat →
approve → ticking; jump links; dark + mobile VLM pass) · my verification
rows surgically removed from db/custom.db (workspace left at the honest
seed truth: 3 stores · 3 missions · 3 decisions, chat = c-0/c-1).
