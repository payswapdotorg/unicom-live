import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/product/seed";
import { errMessage, fail, ok, toWatchUI } from "@/lib/product/api-helpers";

// GET /api/watch — the watch ring, latest 60 desc.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const events = await db.watchEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    return ok({ events: events.map(toWatchUI) });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
