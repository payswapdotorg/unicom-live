import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import {
  errMessage,
  fail,
  ok,
  parseJsonArray,
  pushWatchEvent,
  rid,
  toMissionUI,
} from "@/lib/product/api-helpers";
import { extractFirstJson } from "@/lib/product/llm";

// POST /api/missions/[id]/plan — LLM plan formation (R-C2). The mission's
// title/brief/store scope go to the model, which returns 3-4 lanes as STRICT
// JSON {"lanes":[{"name","evidence"}]} — imperative names ≤60 chars, 1-2 short
// evidence strings each. Statuses are assigned deterministically: every lane
// done except the LAST, which runs at 25%. FAIL-SOFT: any SDK error, empty
// output, bad JSON, or too few usable lanes falls back to the heuristic
// 3-lane generator below — this endpoint never 500s just because the model
// is down.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type LaneDef = { name: string; evidence: string[] };

/** The heuristic 3-lane generator (the pre-LLM behavior, kept verbatim as the fallback brain). */
function heuristicLanes(names: string[]): LaneDef[] {
  return [
    {
      name: names.length
        ? `Data pull across ${names.join(", ")}`
        : "Data pull across connected stores",
      evidence: ["catalog + orders snapshot sealed"],
    },
    {
      name: "Analysis + drafting",
      evidence: ["findings ranked by impact"],
    },
    {
      name: "Pack high-impact changes as decisions",
      evidence: ["decision bundle forming"],
    },
  ];
}

/** Ask the model for 3-4 grounded lanes; null on ANY failure (never throws). */
async function llmLanes(
  title: string,
  brief: string,
  storeNames: string[],
): Promise<LaneDef[] | null> {
  try {
    const zai = await ZAI.create();
    // NOTE: the endpoint rejects a system-only messages array (error 1214) —
    // the mission block rides as the user turn, mirroring /api/chat's shape.
    const system = [
      "You are the planning brain of Atlas, the UNiCOM commerce operator. You break merchant missions into execution lanes (parallel workstreams).",
      "Rules:",
      '- Respond with 3-4 lanes. Lane names are imperative, start with a verb, and are at most 60 characters (e.g. "Pull 30 days of orders across the stores in scope").',
      '- Each lane carries 1-2 short evidence strings — what a finished lane seals (e.g. "orders + catalog snapshot sealed").',
      "- Lanes must be concrete and grounded in the mission brief; no generic filler.",
      "",
      'OUTPUT CONTRACT — respond with STRICT JSON only — no markdown fences, no prose:\n{"lanes":[{"name":"...","evidence":["..."]}]}',
    ].join("\n");
    const user = [
      "Break this mission into lanes:",
      `Mission: "${title}"`,
      `Brief: ${brief}`,
      `Stores in scope: ${storeNames.length ? storeNames.join(", ") : "none connected"}`,
    ].join("\n");
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      thinking: { type: "disabled" },
    });
    const content = (
      completion as {
        choices?: { message?: { content?: unknown } }[];
      } | null
    )?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) return null;

    const parsed = extractFirstJson(content);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const lanesInput = (parsed as { lanes?: unknown }).lanes;
    if (!Array.isArray(lanesInput)) return null;
    const lanes: LaneDef[] = [];
    for (const lane of lanesInput) {
      if (typeof lane !== "object" || lane === null) continue;
      const name =
        typeof (lane as { name?: unknown }).name === "string"
          ? ((lane as { name: string }).name).trim()
          : "";
      if (name.length === 0) continue;
      const evidence = Array.isArray((lane as { evidence?: unknown }).evidence)
        ? ((lane as { evidence: unknown[] }).evidence)
            .filter((e): e is string => typeof e === "string" && e.trim().length > 0)
            .map((e) => e.trim())
            .slice(0, 2)
        : [];
      lanes.push({
        name: name.slice(0, 60),
        evidence: evidence.length > 0 ? evidence : ["evidence pending"],
      });
    }
    if (lanes.length < 3) return null; // too few usable lanes → fallback
    return lanes.slice(0, 4); // model overshot → keep the first 4
  } catch {
    return null;
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const mission = await db.mission.findUnique({ where: { id } });
    if (!mission) return fail("mission not found", 404);

    const storeIds = parseJsonArray<string>(mission.stores);
    const storeRows = storeIds.length
      ? await db.store.findMany({ where: { id: { in: storeIds } } })
      : [];
    const names = storeIds.map(
      (sid) => storeRows.find((s) => s.id === sid)?.name ?? sid,
    );

    // LLM brain first; heuristic generator as the fail-soft fallback
    const laneDefs =
      (await llmLanes(mission.title, mission.brief, names)) ?? heuristicLanes(names);

    // Plan-formation lane is replaced by the real plan
    await db.lane.deleteMany({
      where: { missionId: id, name: "Plan formation" },
    });

    const ts = Date.now();
    await Promise.all(
      laneDefs.map((d, i) =>
        db.lane.create({
          data: {
            id: `l-${ts}-${i}`,
            missionId: id,
            name: d.name,
            worker: `wkr-${rid(2)}`,
            // deterministic: all done except the LAST lane, running at 25%
            status: i === laneDefs.length - 1 ? "running" : "done",
            progress: i === laneDefs.length - 1 ? 25 : 100,
            evidence: JSON.stringify(d.evidence),
          },
        }),
      ),
    );

    const row = await db.mission.update({
      where: { id },
      data: { eta: "executing", status: "running" },
    });
    await pushWatchEvent(
      "dispatch",
      "orchestrator",
      `Plan formed for ${mission.title} — ${laneDefs.length} lanes running`,
    );
    const lanes = await db.lane.findMany({
      where: { missionId: id },
      orderBy: { id: "asc" },
    });
    return ok({ mission: toMissionUI(row, lanes) });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
