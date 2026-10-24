import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/product/seed";
import {
  errMessage,
  fail,
  ok,
  parseSettings,
  toChatUI,
  toDecisionUI,
  toMissionUI,
  toSkillUI,
  toStoreUI,
  toWatchUI,
  type ResolvedDecisionUI,
} from "@/lib/product/api-helpers";
import { SEED_SETTINGS, SEED_SKILLS } from "@/lib/product/data";

// GET /api/hydrate — the boot contract. Seeds first, then loads every
// collection in parallel and emits UI-shaped payloads (data.ts types).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const [stores, missions, decisions, resolvedRows, watchEvents, skills, settingRow, chat] =
      await Promise.all([
        db.store.findMany({ orderBy: { createdAt: "asc" } }),
        db.mission.findMany({
          orderBy: { createdAt: "desc" },
          include: { lanes: { orderBy: { id: "asc" } } },
        }),
        db.decision.findMany({
          where: { resolved: false },
          orderBy: { createdAt: "desc" },
        }),
        db.decision.findMany({
          where: { resolved: true },
          orderBy: { resolvedAt: "desc" },
          take: 12,
        }),
        db.watchEvent.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
        db.skill.findMany(),
        db.setting.findUnique({ where: { id: "singleton" } }),
        db.chatMessage.findMany({ orderBy: { createdAt: "asc" } }),
      ]);

    // Resolved history: query is newest-first; the UI appends in-session, so
    // reverse to OLDEST-FIRST for display.
    const resolvedDecisions: ResolvedDecisionUI[] = resolvedRows
      .map((r) => ({
        decision: toDecisionUI(r),
        verdict: (r.verdict === "approved" ? "approved" : "declined") as
          | "approved"
          | "declined",
        at: r.resolvedAt ? r.resolvedAt.getTime() : 0,
      }))
      .reverse();

    // Skills: no createdAt column — SEED_SKILLS catalog order, non-seeds
    // appended alphabetically by name.
    const catalog = SEED_SKILLS.map((s) => s.id);
    const orderedSkills = [...skills].sort((a, b) => {
      const ia = catalog.indexOf(a.id);
      const ib = catalog.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return ok({
      stores: stores.map(toStoreUI),
      missions: missions.map((m) => toMissionUI(m, m.lanes)),
      decisions: decisions.map(toDecisionUI),
      resolvedDecisions,
      watchEvents: watchEvents.map(toWatchUI),
      skills: orderedSkills.map(toSkillUI),
      settings: parseSettings(settingRow?.data, SEED_SETTINGS),
      chat: chat.map(toChatUI),
    });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
