import { db } from "@/lib/db";
import {
  errMessage,
  fail,
  ok,
  pushWatchEvent,
  toStoreUI,
} from "@/lib/product/api-helpers";

// PATCH /api/stores/[id] {action:"sync"|"reconnect"} · DELETE /api/stores/[id]
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
    const { action } = body as Record<string, unknown>;
    const store = await db.store.findUnique({ where: { id } });
    if (!store) return fail("store not found", 404);

    if (action === "sync") {
      const row = await db.store.update({
        where: { id },
        data: { lastSync: "just now" },
      });
      await pushWatchEvent(
        "heartbeat",
        "inventory-sync",
        `${store.name} synced — ${store.products} products checked`,
      );
      return ok({ store: toStoreUI(row) });
    }

    if (action === "reconnect") {
      const row = await db.store.update({
        where: { id },
        data: { health: "healthy" },
      });
      await pushWatchEvent(
        "heal",
        "connector",
        `${store.name} reconnected — connection healthy again`,
      );
      return ok({ store: toStoreUI(row) });
    }

    return fail("action must be 'sync' or 'reconnect'");
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const store = await db.store.findUnique({ where: { id } });
    if (!store) return fail("store not found", 404);
    await db.store.delete({ where: { id } });
    await pushWatchEvent("review", "you", `${store.name} disconnected`);
    return ok();
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
