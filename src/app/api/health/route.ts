import { NextResponse } from "next/server";

// TL-owned liveness ping. Not owned by any lane — do not modify.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "unicom-console",
    ts: new Date().toISOString(),
  });
}
