import { db } from "@/lib/db";
import {
  errMessage,
  fail,
  ok,
  pushWatchEvent,
  slugify,
  toStoreUI,
} from "@/lib/product/api-helpers";
import { PLATFORMS } from "@/lib/product/data";

// POST /api/stores — connect a store. id = slugify(name); plausible metrics
// when absent; heals into the watch ring via a connector event.
export const dynamic = "force-dynamic";

const PLATFORM_IDS = new Set<string>(PLATFORMS.map((p) => p.id));

function optionalNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return fail("invalid JSON body");
    }
    const { name, domain, platform, products, orders7d, revenue7d, delta7d, apiUsage } =
      body as Record<string, unknown>;

    if (typeof name !== "string" || name.trim().length === 0) {
      return fail("name is required");
    }
    if (typeof domain !== "string" || domain.trim().length === 0) {
      return fail("domain is required");
    }
    if (typeof platform !== "string" || !PLATFORM_IDS.has(platform)) {
      return fail(
        `platform must be one of: ${PLATFORMS.map((p) => p.id).join(" | ")}`,
      );
    }

    const id = slugify(name);
    if (!id) return fail("name must contain at least one letter or digit");
    const existing = await db.store.findUnique({ where: { id } });
    if (existing) return fail("a store with that name is already connected", 409);

    // plausible metrics when absent
    const productsN =
      optionalNumber(products) ?? 40 + Math.floor(Math.random() * 60);
    const ordersN =
      optionalNumber(orders7d) ?? 8 + Math.floor(Math.random() * 24);
    const revenueN =
      optionalNumber(revenue7d) ??
      Math.round(ordersN * (30 + Math.random() * 50)); // orders × AOV 30-80
    const deltaN =
      optionalNumber(delta7d) ?? Math.round((Math.random() * 20 - 5) * 10) / 10; // −5..+15, one decimal
    const apiN = optionalNumber(apiUsage) ?? 0;

    const row = await db.store.create({
      data: {
        id,
        name: name.trim(),
        domain: domain.trim(),
        platform,
        health: "syncing",
        lastSync: "just now",
        products: Math.round(productsN),
        orders7d: Math.round(ordersN),
        revenue7d: revenueN,
        delta7d: deltaN,
        apiUsage: Math.round(apiN),
        installedSkills: "[]",
      },
    });
    await pushWatchEvent(
      "heal",
      "connector",
      `${row.name} connected — initial catalog sync queued (${row.products} products)`,
    );
    return ok({ store: toStoreUI(row) });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
