import { db } from "@/lib/db";
import {
  errMessage,
  fail,
  ok,
  pushWatchEvent,
  toMissionUI,
} from "@/lib/product/api-helpers";

// GET /api/missions/[id] · PATCH /api/missions/[id] {action:"pause"|"resume"}
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const mission = await db.mission.findUnique({
      where: { id },
      include: { lanes: { orderBy: { id: "asc" } } },
    });
    if (!mission) return fail("mission not found", 404);
    return ok({ mission: toMissionUI(mission, mission.lanes) });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return fail("invalid JSON body");
    }
    const { action } = body as Record<string, unknown>;
    const mission = await db.mission.findUnique({ where: { id } });
    if (!mission) return fail("mission not found", 404);

    if (action === "pause") {
      await db.lane.updateMany({
        where: { missionId: id, status: "running" },
        data: { status: "in-review" },
      });
      const row = await db.mission.update({
        where: { id },
        data: { status: "awaiting-approval", eta: "paused by you" },
      });
      await pushWatchEvent("review", "you", `Mission paused — ${mission.title}`);
      const lanes = await db.lane.findMany({
        where: { missionId: id },
        orderBy: { id: "asc" },
      });
      return ok({ mission: toMissionUI(row, lanes) });
    }

    if (action === "resume") {
      await db.lane.updateMany({
        where: { missionId: id, status: "in-review" },
        data: { status: "running" },
      });
      const row = await db.mission.update({
        where: { id },
        data: { status: "running", eta: "executing" },
      });
      const lanes = await db.lane.findMany({
        where: { missionId: id },
        orderBy: { id: "asc" },
      });
      return ok({ mission: toMissionUI(row, lanes) });
    }

    return fail("action must be 'pause' or 'resume'");
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
