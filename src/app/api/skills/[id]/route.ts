import { db } from "@/lib/db";
import {
  errMessage,
  fail,
  ok,
  parseJsonArray,
  pushWatchEvent,
  toSkillUI,
} from "@/lib/product/api-helpers";

// PATCH /api/skills/[id] {storeId} — toggle a skill's install on a store;
// Skill.installedOn and Store.installedSkills stay in sync via $transaction.
// Installs (not removes) announce themselves in the watch ring.
export const dynamic = "force-dynamic";

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
    const { storeId } = body as Record<string, unknown>;
    if (typeof storeId !== "string" || storeId.length === 0) {
      return fail("storeId is required");
    }

    const skill = await db.skill.findUnique({ where: { id } });
    if (!skill) return fail("skill not found", 404);
    const store = await db.store.findUnique({ where: { id: storeId } });
    if (!store) return fail("unknown store", 400);

    const skillInstalls = parseJsonArray<string>(skill.installedOn);
    const storeSkills = parseJsonArray<string>(store.installedSkills);
    const has = skillInstalls.includes(storeId);
    const nextSkillInstalls = has
      ? skillInstalls.filter((x) => x !== storeId)
      : [...skillInstalls, storeId];
    const nextStoreSkills = has
      ? storeSkills.filter((x) => x !== skill.id)
      : [...storeSkills, skill.id];

    const [updated] = await db.$transaction([
      db.skill.update({
        where: { id },
        data: { installedOn: JSON.stringify(nextSkillInstalls) },
      }),
      db.store.update({
        where: { id: storeId },
        data: { installedSkills: JSON.stringify(nextStoreSkills) },
      }),
    ]);

    if (!has) {
      await pushWatchEvent(
        "dispatch",
        skill.id,
        `${skill.name} installed on ${store.name}`,
      );
    }
    return ok({ skill: toSkillUI(updated) });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
