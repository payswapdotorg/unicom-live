// ─────────────────────────────────────────────────────────────────────────────
// R-C2 — shared model-output parsing. Never trust the model: every helper is
// defensive and total (never throws, always returns something usable).
// Server-side companion of the two LLM brains (/api/chat, /api/missions/[id]/plan).
// ─────────────────────────────────────────────────────────────────────────────

/** Strip ``` / ```json fences from raw model output. */
function stripFences(raw: string): string {
  return raw.replace(/```[a-zA-Z0-9_-]*\s*/g, "").replace(/```/g, "");
}

/**
 * Extract the first balanced `{...}` object from raw model output (fences
 * stripped first), string/escape-aware. Returns the parsed value, or null
 * when there is no balanced object or it does not parse. Never throws.
 */
export function extractFirstJson(raw: string): unknown {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const s = stripFences(raw);
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === "}") {
      if (depth > 0) {
        depth -= 1;
        if (depth === 0 && start !== -1) {
          try {
            return JSON.parse(s.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Drop a trailing "Plan:" enumeration ("Plan:" / "My plan:" / "The plan:",
 * optionally markdown-bolded) when the model appends one to otherwise clean
 * prose. Only strips when the marker starts a line — inline mentions survive.
 */
export function stripPlanSuffix(text: string): string {
  const cut = text.search(
    /(?:^|\n)[ \t]*\*{0,2}[ \t]*(?:(?:my|the)[ \t]+)?plan[ \t]*\*{0,2}[ \t]*:/i,
  );
  if (cut === -1) return text;
  return text.slice(0, cut);
}

/**
 * Cut text at a sentence boundary at or before `max` characters; hard-cuts
 * at `max` when the window holds no sentence end. Decimals like "3.14" are
 * not boundaries (the dot must be followed by whitespace or end-of-text).
 */
export function truncateSentences(text: string, max = 900): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max);
  const closers = "\"'”’)]»";
  for (let i = head.length - 1; i >= 0; i -= 1) {
    const ch = head[i];
    if (ch === "." || ch === "!" || ch === "?") {
      let j = i + 1;
      while (j < head.length && closers.includes(head[j])) j += 1;
      if (j >= head.length || /\s/.test(head[j])) {
        return head.slice(0, j).trim();
      }
    }
  }
  return head.trim();
}
