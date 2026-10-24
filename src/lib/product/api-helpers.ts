import { NextResponse } from "next/server";
import type {
  Store as StoreRow,
  Mission as MissionRow,
  Lane as LaneRow,
  Decision as DecisionRow,
  WatchEvent as WatchEventRow,
  Skill as SkillRow,
  ChatMessage as ChatMessageRow,
} from "@prisma/client";
import { db } from "@/lib/db";
import type {
  Decision,
  DiffBlock,
  Mission,
  MissionLane,
  SettingsState,
  Skill,
  StoreConnection,
  WatchEvent,
} from "./data";
import { SEED_SETTINGS } from "./data";

// ─────────────────────────────────────────────────────────────────────────────
// R-C1 backend spine — response helpers + DB→UI transforms.
// The UI shapes in src/lib/product/data.ts are the contract; every transform
// below emits EXACTLY those shapes (keys present, optional keys only when the
// backing column is non-null). Server-only: imports the Prisma client.
// ─────────────────────────────────────────────────────────────────────────────

// ——— response envelopes ———

export function ok(data: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(error: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

export function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

// ——— small utilities ———

/** "HH:MMZ" UTC stamp — matches the client-side nowZ in store.ts. */
export function nowZ(): string {
  return new Date().toISOString().slice(11, 16) + "Z";
}

/** Random base36 suffix, n characters (worker ids like wkr-a7). */
export function rid(n: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < n; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Lowercase slug — same normalization the client store uses for ids. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Safe JSON.parse for array-shaped columns — never throws, falls back to []. */
export function parseJsonArray<T>(s: string | null | undefined): T[] {
  if (typeof s !== "string" || s.length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(s);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Objects recurse; arrays (and everything else) replace wholesale. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === undefined) return base;
  if (isPlainObject(base) && isPlainObject(patch)) {
    const out: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      out[key] = deepMerge(out[key], value);
    }
    return out as T;
  }
  return patch as T;
}

// ——— watch ring ———

/** Persist a watch event (id `e-<ts>`, ts nowZ) — the backend-side twin of the client pushEvent pattern. */
export async function pushWatchEvent(
  kind: string,
  actor: string,
  text: string,
): Promise<void> {
  await db.watchEvent.create({
    data: { id: `e-${Date.now()}`, ts: nowZ(), kind, actor, text },
  });
}

// ——— settings ———

/** Parse the singleton settings JSON; any parse failure falls back (merged over the seed defaults). */
export function parseSettings(
  raw: string | null | undefined,
  fallback: SettingsState = SEED_SETTINGS,
): SettingsState {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return fallback;
    return deepMerge(fallback, parsed);
  } catch {
    return fallback;
  }
}

// ——— DB → UI transforms (data.ts shapes EXACTLY) ———

export function toStoreUI(row: StoreRow): StoreConnection {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    platform: row.platform as StoreConnection["platform"],
    health: row.health as StoreConnection["health"],
    lastSync: row.lastSync,
    // lastAudit is not persisted (no column in the approved schema) — the
    // seed stores read "06:40Z" (the overnight audit stamp, watch event e-3),
    // so that value is emitted for display parity.
    lastAudit: "06:40Z",
    products: row.products,
    orders7d: row.orders7d,
    revenue7d: row.revenue7d,
    delta7d: row.delta7d,
    apiUsage: row.apiUsage,
    installedSkills: parseJsonArray<string>(row.installedSkills),
  };
}

export function toLaneUI(row: LaneRow): MissionLane {
  return {
    id: row.id,
    name: row.name,
    worker: row.worker,
    status: row.status as MissionLane["status"],
    progress: row.progress,
    evidence: parseJsonArray<string>(row.evidence),
  };
}

export function toMissionUI(row: MissionRow, lanes: LaneRow[]): Mission {
  return {
    id: row.id,
    title: row.title,
    brief: row.brief,
    stores: parseJsonArray<string>(row.stores),
    status: row.status as Mission["status"],
    eta: row.eta,
    started: row.started,
    lanes: lanes.map(toLaneUI),
    // groupId only when non-null — ungrouped missions omit the key entirely
    ...(row.groupId !== null ? { groupId: row.groupId } : {}),
  };
}

export function toDecisionUI(row: DecisionRow): Decision {
  return {
    id: row.id,
    kind: row.kind as Decision["kind"],
    title: row.title,
    // store id semantics — data.ts: "store: string; // store id"; the UI
    // resolves the display name via its storeName() lookup
    store: row.storeId,
    proposedBy: row.proposedBy,
    risk: row.risk as Decision["risk"],
    impact: row.impact,
    evidence: parseJsonArray<string>(row.evidence),
    detail: parseJsonArray<{ label: string; value: string }>(row.detail),
    expires: row.expires,
    // diffs/diffNote only when non-null
    ...(row.diffs !== null
      ? { diffs: parseJsonArray<DiffBlock>(row.diffs) }
      : {}),
    ...(row.diffNote !== null ? { diffNote: row.diffNote } : {}),
  };
}

export function toWatchUI(row: WatchEventRow): WatchEvent {
  return {
    id: row.id,
    ts: row.ts,
    kind: row.kind as WatchEvent["kind"],
    actor: row.actor,
    text: row.text,
  };
}

export function toSkillUI(row: SkillRow): Skill {
  return {
    id: row.id,
    name: row.name,
    glyph: row.glyph,
    tagline: row.blurb,
    watches: row.watches,
    acts: row.acts,
    risk: row.risk as Skill["risk"],
    events7d: row.events,
    installedOn: parseJsonArray<string>(row.installedOn),
  };
}

/** The chat bubble shape the client renders (store.ts ChatMessage minus the client-only plan-progress fields). */
export type ChatUI = {
  id: string;
  role: "merchant" | "agent";
  text: string;
  plan?: string[];
};

export function toChatUI(row: ChatMessageRow): ChatUI {
  return {
    id: row.id,
    role: row.role as ChatUI["role"],
    text: row.text,
    // plan only when non-null
    ...(row.plan !== null ? { plan: parseJsonArray<string>(row.plan) } : {}),
  };
}

/** Resolved-decision history entry — `at` is epoch ms, oldest-first (in-session append order). */
export type ResolvedDecisionUI = {
  decision: Decision;
  verdict: "approved" | "declined";
  at: number;
};
