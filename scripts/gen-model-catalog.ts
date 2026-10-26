// One-off FE2 generator (TL, Task 9-foundation).
// Parses /home/z/repos/zcode/config/provider/zcode-builtin.json (READ-ONLY source)
// and emits PROVIDER_TEMPLATES + resolved CATALOG_MODELS for src/lib/product/models.ts.
// Rule semantics: ordered cascade — walk modelRules in file order, deep-merge each
// matching rule's config (later = more specific = overrides).
// Run: bun /home/z/my-project/scripts/gen-model-catalog.ts > /tmp/catalog.ts
export {};

declare const Bun: {
  file(path: string): { json(): Promise<any> };
};

const SRC = "/home/z/repos/zcode/config/provider/zcode-builtin.json";
const raw: any = await Bun.file(SRC).json();

const cfg = raw.config;
const templates = cfg.providerConfigRules.templateRules;

// ——— enabled-by-template (templateModelRules: {templateId, modelId, config.enabled}) ———
const enabledByTemplate: Record<string, string[]> = {};
for (const r of cfg.modelConfigRules.templateModelRules ?? []) {
  if (r.config?.enabled === false) continue;
  (enabledByTemplate[r.templateId] ??= []).push(r.modelId);
}

// ——— templateModelRules may only list ENABLED models; also collect disabled lists
// for reference (not emitted).
const disabledByTemplate: Record<string, string[]> = {};
for (const r of cfg.modelConfigRules.templateModelRules ?? []) {
  if (r.config?.enabled !== false) continue;
  (disabledByTemplate[r.templateId] ??= []).push(r.modelId);
}

// ——— resolve a model id through the modelRules cascade ———
type Resolved = {
  contextWindow: number;
  maxOutputTokens: number;
  inputs: string[];
  reasoning: string[];
  supportsToolCall: boolean;
};
const rules = cfg.modelConfigRules.modelRules ?? [];

function deepMerge(acc: any, src: any) {
  for (const k of Object.keys(src ?? {})) {
    const v = src[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      acc[k] = acc[k] && typeof acc[k] === "object" && !Array.isArray(acc[k]) ? acc[k] : {};
      deepMerge(acc[k], v);
    } else {
      acc[k] = v;
    }
  }
}

function resolveModel(id: string): Resolved {
  const acc: any = {};
  for (const r of rules) {
    if (new RegExp(r.modelMatch, "i").test(id)) deepMerge(acc, r.config ?? {});
  }
  const p = acc.properties ?? {};
  const inputs: string[] = [];
  if (p.inputFormat?.supportsText !== false) inputs.push("text");
  if (p.inputFormat?.supportsImage) inputs.push("image");
  if (p.inputFormat?.supportsVideo) inputs.push("video");
  if (p.inputFormat?.supportsAudio) inputs.push("audio");
  if (p.inputFormat?.supportsPdf) inputs.push("pdf");
  return {
    contextWindow: p.contextWindow ?? 0,
    maxOutputTokens: acc.optionSpecs?.maxOutputTokens?.max ?? 0,
    inputs,
    reasoning: acc.optionSpecs?.reasoningLevel?.values ?? [],
    supportsToolCall: p.supportsToolCall ?? true,
  };
}

// ——— templates out ———
const out = templates.map((t) => ({
  id: t.templateId,
  name: t.templateNameMap["en-US"],
  group:
    t.templateId.startsWith("zai-") || t.templateId.startsWith("bigmodel-")
      ? "Zhipu"
      : "Other",
  access:
    t.config.access.type === "zhipu-coding-plan-api-key"
      ? "coding-plan"
      : "api-key",
  apiKeyManagementUrl: t.config.access.apiKeyManagementUrl ?? "",
  apiFormat: t.config.api.type,
  baseUrl: t.config.api.baseUrl,
  logo: t.config.logo?.key ?? "zai",
  models: t.config.builtinModelIds,
  enabledByDefault: enabledByTemplate[t.templateId] ?? [],
}));
console.log("export const PROVIDER_TEMPLATES: ProviderTemplate[] =");
console.log(JSON.stringify(out, null, 2) + ";");

// ——— resolved catalog for every model id across all templates ———
const ids = new Set<string>();
for (const t of out) for (const m of t.models) ids.add(m);
const catalog: Record<string, Resolved> = {};
for (const id of [...ids].sort()) catalog[id] = resolveModel(id);
console.log("\nexport const CATALOG_MODELS: Record<string, CatalogModel> =");
console.log(JSON.stringify(catalog, null, 2) + ";");

// stderr diagnostics
console.error(
  JSON.stringify(
    {
      templates: out.length,
      uniqueModels: ids.size,
      disabledCounts: Object.fromEntries(
        Object.entries(disabledByTemplate).map(([k, v]) => [k, v.length]),
      ),
      spot: {
        "GLM-5.3": catalog["GLM-5.3"],
        "GLM-5.3-Flash": catalog["GLM-5.3-Flash"],
        "GLM-5.1": catalog["GLM-5.1"],
        "GLM-4.6V": catalog["GLM-4.6V"],
        "charglm-4": catalog["charglm-4"],
        "kimi-k3": catalog["kimi-k3"],
        "MiniMax-M3": catalog["MiniMax-M3"],
        "deepseek-v4-pro": catalog["deepseek-v4-pro"],
        "gpt-5.6": catalog["gpt-5.6"],
        "claude-opus-5": catalog["claude-opus-5"],
        "qwen3.8-max": catalog["qwen3.8-max"],
      },
    },
    null,
    2,
  ),
);
