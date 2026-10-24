import { db } from "@/lib/db";
import {
  deepMerge,
  errMessage,
  fail,
  ok,
  parseSettings,
} from "@/lib/product/api-helpers";
import { SEED_SETTINGS } from "@/lib/product/data";

// GET /api/settings · PATCH /api/settings {patch} — deep-merge patch onto the
// parsed current settings, upsert the singleton, return the full state.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await db.setting.findUnique({ where: { id: "singleton" } });
    return ok({ settings: parseSettings(row?.data, SEED_SETTINGS) });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return fail("invalid JSON body");
    }
    const { patch } = body as Record<string, unknown>;
    if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
      return fail("patch must be an object");
    }

    const row = await db.setting.findUnique({ where: { id: "singleton" } });
    const current = parseSettings(row?.data, SEED_SETTINGS);
    const merged = deepMerge(current, patch);
    await db.setting.upsert({
      where: { id: "singleton" },
      update: { data: JSON.stringify(merged) },
      create: { id: "singleton", data: JSON.stringify(merged) },
    });
    return ok({ settings: merged });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
