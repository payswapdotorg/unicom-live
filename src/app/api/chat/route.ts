import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { errMessage, fail, ok } from "@/lib/product/api-helpers";
import { extractFirstJson, stripPlanSuffix, truncateSentences } from "@/lib/product/llm";

// POST /api/chat — the agent brain (R-C2). Persists the merchant message
// FIRST (its own id — never trusts one back from the client), grounds Atlas
// in a live DB block (stores / open decisions / active missions), replays the
// last 12 turns as history, and parses STRICT JSON {"reply","plan"} out of
// the model. Never trust the model: any parse failure degrades to raw text +
// empty plan; any SDK failure degrades to a stored fallback reply. No
// streaming — the UI owns its thinking state.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FALLBACK_TEXT =
  "I could not reach the model just now — your message is stored and nothing was lost. Give me a moment and ask again.";

const fmtMoney = (n: number): string => `$${n.toLocaleString("en-US")}`;

const healthWord = (h: string): string =>
  h === "attention"
    ? "needs attention"
    : h === "syncing"
      ? "initial sync in progress"
      : "healthy";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return fail("invalid JSON body");
    }
    const b = body as Record<string, unknown>;
    const message = typeof b.message === "string" ? b.message.trim() : "";
    if (!message) return fail("message is required");
    const planFirst = b.planFirst !== false; // default: plan first
    const context: string[] = Array.isArray(b.context)
      ? (b.context as unknown[])
          .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          .slice(0, 6)
      : [];

    // 1 — persist the merchant message first, with a server-minted id
    await db.chatMessage.create({
      data: { id: `c-${Date.now()}`, role: "merchant", text: message },
    });

    // 2 — grounding block, built FROM THE DB (never the client)
    const [storeRows, decisionRows, missionRows] = await Promise.all([
      db.store.findMany({ orderBy: { createdAt: "asc" } }),
      db.decision.findMany({
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
      }),
      db.mission.findMany({
        where: { status: { not: "done" } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
    const storeLines = storeRows.map(
      (s) =>
        `- ${s.name} — ${s.platform} · ${s.domain} · 7-day revenue ${fmtMoney(s.revenue7d)} (${s.delta7d >= 0 ? "+" : ""}${s.delta7d}% vs prior week) · ${s.products} products · health: ${healthWord(s.health)}`,
    );
    const decisionLines = decisionRows.map(
      (d) => `- [${d.id}] ${d.title} (${d.kind} · ${d.risk} risk)`,
    );
    const missionLines = missionRows.map(
      (m) => `- [${m.id}] ${m.title} — ${m.status}`,
    );

    // 3 — history: last 12 turns, oldest first; the newest IS this message
    const historyRows = await db.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    const history = [...historyRows].reverse().map((m) => ({
      role: m.role === "merchant" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));
    // pinned context rides on the current turn
    if (context.length > 0 && history.length > 0) {
      const last = history.length - 1;
      history[last] = {
        ...history[last],
        content: `${history[last].content}\n\n[Pinned context: ${context.join(" · ")}]`,
      };
    }

    const system = [
      "You are Atlas, the UNiCOM commerce operator — one agent running every connected store for a single merchant. Warm-professional, evidence-first, concise.",
      "Ground every claim in the WORKSPACE STATE below — never invent revenue, order counts, store names, or decisions. Risky actions (prices, publishing, refunds, emails, spend) are always packed as decisions for the merchant's approval; you never apply them silently.",
      "",
      "WORKSPACE STATE (live from the database):",
      `Stores:\n${storeLines.length ? storeLines.join("\n") : "- none connected"}`,
      `Open decisions awaiting the merchant:\n${decisionLines.length ? decisionLines.join("\n") : "- none"}`,
      `Active missions:\n${missionLines.length ? missionLines.join("\n") : "- none"}`,
      "",
      planFirst
        ? 'MODE — PLAN FIRST: the merchant wants a plan before anything runs. Open your reply with a short acknowledgement; the numbered plan (3-6 steps) goes in the "plan" array. Nothing executes until they approve it.'
        : 'MODE — ACT NOW: the merchant wants action. Open your reply with a short acknowledgement; execution proceeds as far as guardrails allow and anything risky is packed as a decision. The "plan" array carries the 3-6 steps you are executing.',
      "",
      'OUTPUT CONTRACT — respond with STRICT JSON only. No markdown fences, no text outside the JSON:\n{"reply": "<plain conversational text, 1-4 sentences, no markdown, no numbered steps>", "plan": ["<short imperative step>", "..."]}',
      'The "plan" array holds 3-6 short imperative steps. No other keys.',
    ].join("\n");

    // 4 — call the model (server-side only); any failure degrades below
    let raw = "";
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [{ role: "system", content: system }, ...history],
        thinking: { type: "disabled" },
      });
      const content = (
        completion as {
          choices?: { message?: { content?: unknown } }[];
        } | null
      )?.choices?.[0]?.message?.content;
      raw = typeof content === "string" ? content : "";
    } catch {
      raw = "";
    }

    // 5 — parse the output contract; never trust the model
    let text = "";
    let plan: string[] = [];
    const parsed = extractFirstJson(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const r = (parsed as { reply?: unknown }).reply;
      if (typeof r === "string" && r.trim().length > 0) {
        const stripped = stripPlanSuffix(r).trim();
        text = truncateSentences(stripped.length > 0 ? stripped : r, 900);
      }
      const p = (parsed as { plan?: unknown }).plan;
      if (Array.isArray(p)) {
        plan = p
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim())
          .slice(0, 6);
      }
    } else if (raw.trim().length > 0) {
      text = truncateSentences(stripPlanSuffix(raw), 900);
    }
    if (text.length === 0) text = FALLBACK_TEXT;

    // 6 — persist the agent reply, then return (no streaming)
    await db.chatMessage.create({
      data: {
        id: `c-${Date.now()}-a`,
        role: "agent",
        text,
        plan: JSON.stringify(plan),
      },
    });
    return ok({ text, plan });
  } catch (e) {
    return fail(errMessage(e), 500);
  }
}
