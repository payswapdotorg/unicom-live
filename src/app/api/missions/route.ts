import { db } from "@/lib/db";
import {
  errMessage,
  fail,
  nowZ,
  ok,
  pushWatchEvent,
  rid,
  toMissionUI,
} from "@/lib/product/api-helpers";

// POST /api/missions — dispatch a mission from the New Task composer.
// Creates the mission + its single "Plan formation" lane + a dispatch event.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return fail("invalid JSON body");
    }
    const b = body as Record<string, unknown>;

    const title = typeof b.title === "string" ? b.title.trim() : "";
    if (!title) return fail("title is required");
    const brief =
      typeof b.brief === "string" && b.brief.trim().length > 0
        ? b.brief.trim()
        : title;

    if (
      !Array.isArray(b.stores) ||
      b.stores.length === 0 ||
      !b.stores.every((s) => typeof s === "string")
    ) {
      return fail("stores must be a non-empty array of store ids");
    }
    const storeIds = [...new Set(b.stores as string[])]; // dedup
    const found = await db.store.findMany({
      where: { id: { in: storeIds } },
    });
    if (found.length !== storeIds.length) {
      const missing = storeIds.filter((sid) => !found.some((f) => f.id === sid));
      return fail(`unknown store ids: ${missing.join(", ")}`);
    }

    let autonomy: "plan" | "act" = "plan";
    if (b.autonomy === "act") autonomy = "act";
    else if (b.autonomy !== undefined && b.autonomy !== "plan") {
      return fail("autonomy must be 'plan' or 'act'");
    }

    // guardrails: 4 booleans, default all on
    const g =
      typeof b.guardrails === "object" && b.guardrails !== null
        ? (b.guardrails as Record<string, unknown>)
        : {};
    const guardrails = {
      prices: g.prices !== undefined ? g.prices === true : true,
      publishing: g.publishing !== undefined ? g.publishing === true : true,
      data: g.data !== undefined ? g.data === true : true,
      spend: g.spend !== undefined ? g.spend === true : true,
    };

    // "" (ungrouped) and "__new__" (client creates the group locally) → null
    let groupId: string | null = null;
    if (
      typeof b.groupId === "string" &&
      b.groupId !== "" &&
      b.groupId !== "__new__"
    ) {
      groupId = b.groupId;
    }

    const ts = Date.now();
    const mission = await db.mission.create({
      data: {
        id: `m-${ts}`,
        title,
        brief,
        stores: JSON.stringify(storeIds),
        status: "running",
        eta: "plan forming",
        started: nowZ(),
        groupId,
      },
    });
    const lane = await db.lane.create({
      data: {
        id: `l-${ts}`,
        missionId: mission.id,
        name: "Plan formation",
        worker: `wkr-${rid(2)}`,
        status: "running",
        progress: 8,
        evidence: JSON.stringify(["plan forming…"]),
      },
    });

    const guardCount = Object.values(guardrails).filter(Boolean).length;
    await pushWatchEvent(
      "dispatch",
      "you",
      `Mission dispatched — ${storeIds.length} store${storeIds.length > 1 ? "s" : ""} · ${autonomy === "plan" ? "plan-first" : "act-now"} · ${guardCount === 4 ? "all guardrails on" : `${guardCount} of 4 guardrails on`}`,
    );
    return ok({ mission: toMissionUI(mission, [lane]) });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
