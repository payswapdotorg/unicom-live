import { db } from "@/lib/db";
import { errMessage, fail, ok, pushWatchEvent } from "@/lib/product/api-helpers";

// PATCH /api/decisions/[id] {verdict:"approved"|"declined"} — resolve a
// decision; the resolution lands in the watch ring as a review event.
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
    const { verdict } = body as Record<string, unknown>;
    if (verdict !== "approved" && verdict !== "declined") {
      return fail("verdict must be 'approved' or 'declined'");
    }
    const decision = await db.decision.findUnique({ where: { id } });
    if (!decision) return fail("decision not found", 404);

    await db.decision.update({
      where: { id },
      data: { resolved: true, verdict, resolvedAt: new Date() },
    });
    await pushWatchEvent(
      "review",
      "you",
      `${verdict === "approved" ? "Approved" : "Declined"} — ${decision.title}`,
    );
    return ok();
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
