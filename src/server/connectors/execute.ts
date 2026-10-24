// UNiCOM Console — decision execution seam (BASE STUB).
//
// ⚠️ C1 OWNS THIS FILE and replaces the stub body in work/c1-connectors with
// the registry-backed implementation: load the store → decrypt its credential
// → route payload.op to the adapter (Wave 1: "price_change" → applyPriceChange;
// demo stores simulate deterministically and always succeed).
//
// C3 (governance) imports ONLY this signature — never the registry directly.
// The signature below is FROZEN; C1 must keep it byte-compatible.

export type ExecutionResult = { ok: true } | { ok: false; error: string };

export type DecisionPayloadInput = {
  storeId: string | null;
  payload: unknown; // parsed Decision.payload JSON, e.g. { op: "price_change", remoteId: "8841", priceCents: 7900 }
};

export async function executeDecisionPayload(
  input: DecisionPayloadInput,
): Promise<ExecutionResult> {
  // BASE STUB — deterministic simulation so C3's approve flow is testable
  // before the connector registry lands. C1 replaces this entire body.
  if (!input.storeId) {
    return { ok: false, error: "decision has no target store" };
  }
  if (
    !input.payload ||
    typeof input.payload !== "object" ||
    !("op" in input.payload)
  ) {
    return { ok: false, error: "decision payload is not a write op" };
  }
  return { ok: true };
}
