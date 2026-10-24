import { db } from "@/lib/db";
import {
  SEED_DECISIONS,
  SEED_MISSIONS,
  SEED_SETTINGS,
  SEED_SKILLS,
  SEED_STORES,
  SEED_WATCH_EVENTS,
} from "./data";

// ─────────────────────────────────────────────────────────────────────────────
// R-C1 backend spine — idempotent seed.
//
// every upsert uses `update: {}`: once a row exists, re-seeding NEVER clobbers
// runtime mutations (approved decisions, toggled skills, patched settings all
// survive re-hydrate). Deterministic display ordering is baked into staggered
// createdAt values that are set on CREATE only:
//   stores asc · missions/decisions/watch newest-first by seed array order
//   (m-1, d-1, e-1 read FIRST under desc) · chat asc (c-0 then c-1).
// ─────────────────────────────────────────────────────────────────────────────

// The two seed chat bubbles live in store.ts (client) — mirrored here verbatim
// so the server never imports client code. c-1's inline diff preview is
// frontend-only; the client store re-attaches it.
const SEED_CHAT: { id: string; text: string; plan: string | null }[] = [
  {
    id: "c-0",
    text: "Morning. All three stores are connected and green — Mountain Reads self-healed a rate-limit at 07:04Z, nothing needs you urgently. Ask me anything, or say things like “reprice the linen throw” or “why did Etsy jump 24%?”",
    plan: null,
  },
  {
    id: "c-1",
    text: "While you were away, Price Sentinel packed the overnight findings into decision d-1 — the reprice bundle is ready for your review.",
    plan: null,
  },
];

const STAGGER_MS = 1000;

async function runSeed(): Promise<void> {
  const base = Date.now();

  // ——— stores (asc: halcyon, mountain-reads, kaia) ———
  for (const [i, s] of SEED_STORES.entries()) {
    await db.store.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        domain: s.domain,
        platform: s.platform,
        health: s.health,
        products: s.products,
        orders7d: s.orders7d,
        revenue7d: s.revenue7d,
        delta7d: s.delta7d,
        lastSync: s.lastSync,
        installedSkills: JSON.stringify(s.installedSkills),
        apiUsage: s.apiUsage,
        createdAt: new Date(base + i * STAGGER_MS),
      },
    });
  }

  // ——— missions + lanes (desc display: m-1 newest, m-3 oldest) ———
  for (const [i, m] of SEED_MISSIONS.entries()) {
    await db.mission.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        title: m.title,
        brief: m.brief,
        stores: JSON.stringify(m.stores),
        status: m.status,
        eta: m.eta,
        started: m.started,
        groupId: m.groupId ?? null,
        createdAt: new Date(base + (SEED_MISSIONS.length - 1 - i) * STAGGER_MS),
      },
    });
    for (const l of m.lanes) {
      await db.lane.upsert({
        where: { id: l.id },
        update: {},
        create: {
          id: l.id,
          missionId: m.id,
          name: l.name,
          worker: l.worker,
          status: l.status,
          progress: l.progress,
          evidence: JSON.stringify(l.evidence),
        },
      });
    }
  }

  // ——— decisions (desc display: d-1 newest, d-3 oldest) ———
  for (const [i, d] of SEED_DECISIONS.entries()) {
    await db.decision.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        kind: d.kind,
        title: d.title,
        storeId: d.store,
        proposedBy: d.proposedBy,
        risk: d.risk,
        impact: d.impact,
        evidence: JSON.stringify(d.evidence),
        detail: JSON.stringify(d.detail),
        diffs: d.diffs ? JSON.stringify(d.diffs) : null,
        diffNote: d.diffNote ?? null,
        expires: d.expires,
        createdAt: new Date(base + (SEED_DECISIONS.length - 1 - i) * STAGGER_MS),
      },
    });
  }

  // ——— watch events (desc display: e-1 newest … e-5 oldest — the seed
  // array order IS newest-first, so e-1 gets the largest createdAt) ———
  for (const [i, e] of SEED_WATCH_EVENTS.entries()) {
    await db.watchEvent.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        ts: e.ts,
        kind: e.kind,
        actor: e.actor,
        text: e.text,
        createdAt: new Date(
          base + (SEED_WATCH_EVENTS.length - 1 - i) * STAGGER_MS,
        ),
      },
    });
  }

  // ——— skills (no createdAt — catalog order comes from SEED_SKILLS at hydrate) ———
  for (const s of SEED_SKILLS) {
    await db.skill.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        glyph: s.glyph,
        blurb: s.tagline,
        watches: s.watches,
        acts: s.acts,
        events: s.events7d,
        risk: s.risk,
        installedOn: JSON.stringify(s.installedOn),
      },
    });
  }

  // ——— settings singleton (full SEED_SETTINGS JSON) ———
  await db.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", data: JSON.stringify(SEED_SETTINGS) },
  });

  // ——— chat (asc: c-0 then c-1) ———
  for (const [i, c] of SEED_CHAT.entries()) {
    await db.chatMessage.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        role: "agent",
        text: c.text,
        plan: c.plan,
        createdAt: new Date(base + i * STAGGER_MS),
      },
    });
  }
}

// Per-process memo — the shared promise also keeps concurrent boot requests
// from double-seeding; a failure clears the memo so the next call retries.
let seedPromise: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((e: unknown) => {
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}
