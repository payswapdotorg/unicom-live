// UNiCOM model catalog — the zcode desktop emergence (FE2, Task 9-foundation).
//
// Source of truth: payswap/zcode repo config/provider/zcode-builtin.json
// (revision 33, read-only reference at /home/z/repos/zcode). The catalog below
// was GENERATED from that file by scripts/gen-model-catalog.ts (template list +
// per-model capability rules resolved through the modelRules cascade,
// case-insensitive, later-rules-override). Regenerate with:
//   bun scripts/gen-model-catalog.ts > /tmp/catalog.ts
// and splice the two exported constants back in. Never hand-edit the data.
//
// This module is a LEAF: it must not import from data.ts/store.ts (they import
// from here). Everything the model surfaces need lives in this file.

// ——— Types ———

export type ModelApiFormat =
  | "anthropic-messages"
  | "openai-chat-completions"
  | "openai-responses";

export type ProviderAccess = "coding-plan" | "api-key";

export type ModelInput = "text" | "image" | "video" | "audio" | "pdf";

/** Capability rule for one model id (resolved from the zcode cascade). */
export type CatalogModel = {
  contextWindow: number;
  maxOutputTokens: number;
  inputs: ModelInput[];
  reasoning: string[];
  supportsToolCall: boolean;
};

/** A provider template from the zcode catalog (verbatim names + model lists). */
export type ProviderTemplate = {
  id: string;
  name: string;
  group: "Zhipu" | "Other";
  access: ProviderAccess;
  apiKeyManagementUrl: string;
  apiFormat: ModelApiFormat;
  baseUrl: string;
  logo: string;
  models: string[];
  enabledByDefault: string[];
};

/** A configured provider in workspace settings (persisted in the Setting JSON row). */
export type ModelProviderConfig = {
  id: string; // "zai" | "bigmodel" | "p-<ts>" for custom
  name: string;
  preset: boolean;
  templateId?: string;
  access: ProviderAccess;
  apiFormat: ModelApiFormat;
  baseUrl: string;
  apiKey: string; // "" = not set
  enabled: boolean;
  models: { id: string; enabled: boolean }[];
};

// ——— Defaults ———

/** zcode: new selections auto-complete at the model's HIGHEST reasoning level. */
export const DEFAULT_MODEL_ID = "GLM-5.3";
export const DEFAULT_EFFORT = "max";

/** Legacy console model ids → catalog ids (pre-FE2 persisted rows). */
export const LEGACY_MODEL_MAP: Record<string, string> = {
  "glm-4.7": "GLM-4.7",
  "glm-4.6": "GLM-4.6",
  "glm-4.7-air": "GLM-4.5-Air",
};

const FALLBACK_MODEL_RULE: CatalogModel = {
  contextWindow: 1_000_000,
  maxOutputTokens: 128_000,
  inputs: ["text"],
  reasoning: ["disabled", "enabled"],
  supportsToolCall: true,
};

// ——— Helpers ———

export function formatContextWindow(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

/** Capability rule for a model id; case-insensitive; never null. */
export function modelRuleFor(id: string): CatalogModel {
  if (CATALOG_MODELS[id]) return CATALOG_MODELS[id];
  const lower = id.toLowerCase();
  for (const [k, v] of Object.entries(CATALOG_MODELS)) {
    if (k.toLowerCase() === lower) return v;
  }
  return FALLBACK_MODEL_RULE;
}

export function isVisionModel(id: string): boolean {
  return modelRuleFor(id).inputs.includes("image");
}

/** zcode: /glm/i && /highspeed|flashx/i — the fast-tier models. */
export function isHighspeed(id: string): boolean {
  return /glm/i.test(id) && /highspeed|flashx/i.test(id);
}

/**
 * The effort that actually applies: the stored one when the model supports it,
 * else the model's HIGHEST level (zcode's auto-complete rule), else the default.
 */
export function effectiveEffort(modelId: string, effort: string): string {
  const levels = modelRuleFor(modelId).reasoning;
  if (levels.length === 0) return "—";
  if (effort && levels.includes(effort)) return effort;
  return levels[levels.length - 1];
}

export function templateById(id: string): ProviderTemplate | undefined {
  return PROVIDER_TEMPLATES.find((t) => t.id === id);
}

export type ProviderStatus = "ready" | "not-ready" | "disabled";

export function providerStatus(p: ModelProviderConfig): ProviderStatus {
  if (!p.enabled) return "disabled";
  if (p.access === "coding-plan") return "ready";
  return p.apiKey.trim().length > 0 ? "ready" : "not-ready";
}

function modelsFromTemplate(
  t: ProviderTemplate,
): { id: string; enabled: boolean }[] {
  return t.models.map((id) => ({
    id,
    enabled:
      t.enabledByDefault.length > 0
        ? t.enabledByDefault.includes(id)
        : false,
  }));
}

/** Provider config created from a catalog template (the Add-provider flow). */
export function providerFromTemplate(
  t: ProviderTemplate,
  id: string,
): ModelProviderConfig {
  return {
    id,
    name: t.name,
    preset: false,
    templateId: t.id,
    access: t.access,
    apiFormat: t.apiFormat,
    baseUrl: t.baseUrl,
    apiKey: "",
    enabled: true,
    models: modelsFromTemplate(t),
  };
}

/**
 * The seed provider set (also the fallback for legacy persisted rows with no
 * `models`): Z.ai on the Coding Plan (the connected mode — GLM-5.3 +
 * GLM-5.3-Flash enabled, exactly the zai-api template) and BigModel on the
 * standard API (the full 24-model lineup with the same two enabled, per the
 * zai/bigmodel-standard-api templateModelRules).
 */
export function defaultProviderConfigs(): ModelProviderConfig[] {
  const zai = templateById("zai-api");
  const bigmodel = templateById("bigmodel-standard-api");
  if (!zai || !bigmodel) return [];
  return [
    {
      id: "zai",
      name: "Z.ai",
      preset: true,
      templateId: "zai-api",
      access: "coding-plan",
      apiFormat: zai.apiFormat,
      baseUrl: zai.baseUrl,
      apiKey: "",
      enabled: true,
      models: modelsFromTemplate(zai),
    },
    {
      id: "bigmodel",
      name: "BigModel",
      preset: true,
      templateId: "bigmodel-standard-api",
      access: "api-key",
      apiFormat: bigmodel.apiFormat,
      baseUrl: bigmodel.baseUrl,
      apiKey: "",
      enabled: true,
      models: modelsFromTemplate(bigmodel),
    },
  ];
}

/**
 * Normalize model settings after hydrate (legacy rows carry the pre-FE2 shape:
 * narrow model ids, no effort, no models list). Pure + total — never throws.
 */
export function normalizeModelSettings(raw: {
  model?: unknown;
  effort?: unknown;
  models?: unknown;
}): { model: string; effort: string; models: ModelProviderConfig[] } {
  const rawModel = typeof raw.model === "string" ? raw.model.trim() : "";
  let model = DEFAULT_MODEL_ID;
  if (rawModel && Object.prototype.hasOwnProperty.call(CATALOG_MODELS, rawModel)) {
    // exact catalog id ("GLM-5.3")
    model = rawModel;
  } else if (rawModel && LEGACY_MODEL_MAP[rawModel]) {
    // legacy narrow id ("glm-4.7")
    model = LEGACY_MODEL_MAP[rawModel];
  } else if (rawModel) {
    // case-insensitive match ("glm-5.2" → "glm-5.2" exact/CI), else default
    const lower = rawModel.toLowerCase();
    model =
      Object.keys(CATALOG_MODELS).find((k) => k.toLowerCase() === lower) ??
      DEFAULT_MODEL_ID;
  }
  const effort =
    typeof raw.effort === "string" && raw.effort ? raw.effort : DEFAULT_EFFORT;
  let models: ModelProviderConfig[] = [];
  if (Array.isArray(raw.models)) {
    models = (raw.models as ModelProviderConfig[]).filter(
      (p) => p && typeof p.id === "string" && Array.isArray(p.models),
    );
  }
  if (models.length === 0) models = defaultProviderConfigs();
  return { model, effort, models };
}

// ——— Generated catalog (from zcode-builtin.json rev 33) ———

export const PROVIDER_TEMPLATES: ProviderTemplate[] =
[
  {
    "id": "zai-api",
    "name": "Z.ai Coding Plan",
    "group": "Zhipu",
    "access": "coding-plan",
    "apiKeyManagementUrl": "https://z.ai/manage-apikey/apikey-list",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://api.z.ai/api/anthropic",
    "logo": "zai",
    "models": [
      "GLM-5.3",
      "GLM-5.3-Flash"
    ],
    "enabledByDefault": [
      "GLM-5.3",
      "GLM-5.3-Flash"
    ]
  },
  {
    "id": "zai-standard-api",
    "name": "Z.ai API",
    "group": "Zhipu",
    "access": "api-key",
    "apiKeyManagementUrl": "https://z.ai/manage-apikey/apikey-list",
    "apiFormat": "openai-chat-completions",
    "baseUrl": "https://api.z.ai/api/paas/v4",
    "logo": "zai",
    "models": [
      "GLM-5.3",
      "GLM-5.3-Flash",
      "GLM-5V-Turbo",
      "GLM-5.1",
      "GLM-5.1-Highspeed",
      "GLM-5",
      "GLM-5-Turbo",
      "GLM-4.7",
      "GLM-4.7-FlashX",
      "GLM-4.7-Flash",
      "GLM-4.6",
      "GLM-4.5-Air",
      "GLM-4.5",
      "GLM-4.6V",
      "GLM-4.6V-Flash",
      "GLM-4.6V-FlashX",
      "GLM-4.1V-Thinking-FlashX",
      "GLM-4.1V-Thinking-Flash",
      "GLM-4-FlashX-250414",
      "GLM-4-Flash-250414",
      "GLM-4V-Flash",
      "codegeex-4",
      "charglm-4",
      "emohaa"
    ],
    "enabledByDefault": [
      "GLM-5.3",
      "GLM-5.3-Flash"
    ]
  },
  {
    "id": "bigmodel-api",
    "name": "BigModel Coding Plan",
    "group": "Zhipu",
    "access": "coding-plan",
    "apiKeyManagementUrl": "https://bigmodel.cn/coding-plan/personal/overview",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://open.bigmodel.cn/api/anthropic",
    "logo": "bigmodel",
    "models": [
      "GLM-5.3",
      "GLM-5.3-Flash"
    ],
    "enabledByDefault": [
      "GLM-5.3",
      "GLM-5.3-Flash"
    ]
  },
  {
    "id": "bigmodel-standard-api",
    "name": "BigModel API",
    "group": "Zhipu",
    "access": "api-key",
    "apiKeyManagementUrl": "https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
    "apiFormat": "openai-chat-completions",
    "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
    "logo": "bigmodel",
    "models": [
      "GLM-5.3",
      "GLM-5.3-Flash",
      "GLM-5V-Turbo",
      "GLM-5.1",
      "GLM-5.1-Highspeed",
      "GLM-5",
      "GLM-5-Turbo",
      "GLM-4.7",
      "GLM-4.7-FlashX",
      "GLM-4.7-Flash",
      "GLM-4.6",
      "GLM-4.5-Air",
      "GLM-4.5",
      "GLM-4.6V",
      "GLM-4.6V-Flash",
      "GLM-4.6V-FlashX",
      "GLM-4.1V-Thinking-FlashX",
      "GLM-4.1V-Thinking-Flash",
      "GLM-4-FlashX-250414",
      "GLM-4-Flash-250414",
      "GLM-4V-Flash",
      "codegeex-4",
      "charglm-4",
      "emohaa"
    ],
    "enabledByDefault": [
      "GLM-5.3",
      "GLM-5.3-Flash"
    ]
  },
  {
    "id": "moonshot-kimi",
    "name": "Kimi",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://platform.kimi.com/console/api-keys",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://api.moonshot.cn/anthropic",
    "logo": "moonshot-kimi",
    "models": [
      "kimi-k3",
      "kimi-k2.7-code",
      "kimi-k2.6",
      "kimi-k2.7-code-highspeed",
      "k3",
      "k3-256k"
    ],
    "enabledByDefault": [
      "kimi-k3",
      "kimi-k2.7-code",
      "kimi-k2.6"
    ]
  },
  {
    "id": "minimax",
    "name": "MiniMax",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://platform.minimaxi.com/console/access?tab=api-keys",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://api.minimaxi.com/anthropic",
    "logo": "minimax",
    "models": [
      "MiniMax-M3",
      "MiniMax-M2.7",
      "MiniMax-M2.7-highspeed",
      "MiniMax-M2.5",
      "MiniMax-M2.5-highspeed",
      "MiniMax-M2.1",
      "MiniMax-M2.1-highspeed",
      "MiniMax-M2"
    ],
    "enabledByDefault": [
      "MiniMax-M2.7",
      "MiniMax-M2.7-highspeed",
      "MiniMax-M3"
    ]
  },
  {
    "id": "deepseek",
    "name": "DeepSeek",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://platform.deepseek.com/api_keys",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://api.deepseek.com/anthropic",
    "logo": "deepseek",
    "models": [
      "deepseek-flash",
      "deepseek-v4-pro"
    ],
    "enabledByDefault": [
      "deepseek-v4-pro",
      "deepseek-flash"
    ]
  },
  {
    "id": "qwen-alibaba-model-studio-cn",
    "name": "Alibaba Cloud (China)",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://bailian.console.aliyun.com/cn-beijing?tab=model",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://dashscope.aliyuncs.com/apps/anthropic",
    "logo": "alibaba-model-studio",
    "models": [
      "qwen3.8-max",
      "qwen3.8-flash",
      "qwen3.7-max",
      "qwen3.7-plus",
      "qwen3.7-flash",
      "qwen3.6-plus",
      "qwen3.6-flash",
      "qwen3.5-plus",
      "qwen3.5-flash",
      "qwen3-max",
      "qwen-plus",
      "qwen-flash",
      "qwen3-vl-plus"
    ],
    "enabledByDefault": [
      "qwen3.8-max",
      "qwen3.8-flash"
    ]
  },
  {
    "id": "qwen-alibaba-model-studio-intl",
    "name": "Alibaba Cloud (Global)",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://modelstudio.console.aliyun.com/ap-southeast-1?tab=dashboard",
    "apiFormat": "openai-chat-completions",
    "baseUrl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    "logo": "alibaba-model-studio",
    "models": [
      "qwen3.8-max",
      "qwen3.8-flash",
      "qwen3.8-omni-flash",
      "qwen3.7-max",
      "qwen3.7-plus",
      "qwen3.7-flash",
      "qwen3.6-plus",
      "qwen3.6-flash",
      "qwen3.5-plus",
      "qwen3.5-flash",
      "qwen3-max",
      "qwen-plus",
      "qwen-flash",
      "qwen3-vl-plus"
    ],
    "enabledByDefault": [
      "qwen3.8-max",
      "qwen3.8-flash"
    ]
  },
  {
    "id": "xiaomi-mimo",
    "name": "Xiaomi MiMo API",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://platform.xiaomimimo.com/",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://api.xiaomimimo.com/anthropic",
    "logo": "xiaomi-mimo",
    "models": [
      "mimo-v2.6-pro",
      "mimo-v2.6-flash",
      "mimo-v2.5-pro",
      "mimo-v2.5"
    ],
    "enabledByDefault": [
      "mimo-v2.6-pro",
      "mimo-v2.6-flash",
      "mimo-v2.5-pro",
      "mimo-v2.5"
    ]
  },
  {
    "id": "xiaomi-mimo-token-plan",
    "name": "Xiaomi MiMo Token Plan",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://platform.xiaomimimo.com/",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://token-plan-cn.xiaomimimo.com/anthropic",
    "logo": "xiaomi-mimo",
    "models": [
      "mimo-v2.6-pro",
      "mimo-v2.6-flash"
    ],
    "enabledByDefault": [
      "mimo-v2.6-pro",
      "mimo-v2.6-flash"
    ]
  },
  {
    "id": "openai",
    "name": "OpenAI",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://platform.openai.com/api-keys",
    "apiFormat": "openai-responses",
    "baseUrl": "https://api.openai.com/v1",
    "logo": "openai",
    "models": [
      "gpt-6-astra",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
      "gpt-5.6",
      "gpt-5.4",
      "gpt-5.4-pro",
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5.3-codex"
    ],
    "enabledByDefault": [
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
      "gpt-6-astra"
    ]
  },
  {
    "id": "anthropic",
    "name": "Anthropic",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://console.anthropic.com/settings/keys",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://api.anthropic.com/v1",
    "logo": "anthropic",
    "models": [
      "claude-fable-5-1",
      "claude-fable-5",
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5-20251001"
    ],
    "enabledByDefault": [
      "claude-fable-5",
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5-20251001",
      "claude-fable-5-1"
    ]
  },
  {
    "id": "xai",
    "name": "xAI",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://console.x.ai",
    "apiFormat": "openai-responses",
    "baseUrl": "https://api.x.ai/v1",
    "logo": "xai",
    "models": [
      "grok-4.6",
      "grok-build-0.1",
      "grok-4.3"
    ],
    "enabledByDefault": [
      "grok-4.6",
      "grok-build-0.1"
    ]
  },
  {
    "id": "openrouter",
    "name": "OpenRouter",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://openrouter.ai/keys",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://openrouter.ai/api",
    "logo": "openrouter",
    "models": [
      "anthropic/claude-fable-5.1",
      "openai/gpt-6-astra",
      "openai/gpt-5.6-sol",
      "anthropic/claude-opus-5",
      "deepseek/deepseek-v4-pro",
      "moonshotai/kimi-k3",
      "z-ai/glm-5.3",
      "qwen/qwen3.8-max",
      "minimax/minimax-m3",
      "xiaomi/mimo-v2.5-pro",
      "x-ai/grok-4.6",
      "deepseek/deepseek-v4.1-flash",
      "qwen/qwen3.8-max-0902",
      "openai/gpt-5.6-terra",
      "openai/gpt-5.6-luna",
      "openai/gpt-5.6",
      "openai/gpt-5.4",
      "openai/gpt-5.4-pro",
      "openai/gpt-5.4-mini",
      "openai/gpt-5.4-nano",
      "openai/gpt-5.3-codex",
      "anthropic/claude-sonnet-5",
      "anthropic/claude-haiku-4.5",
      "anthropic/claude-opus-4.8",
      "anthropic/claude-opus-4.7",
      "anthropic/claude-opus-4.6",
      "anthropic/claude-opus-4.5",
      "anthropic/claude-sonnet-4.6",
      "anthropic/claude-sonnet-4.5",
      "deepseek/deepseek-v4-flash",
      "moonshotai/kimi-k2.7-code",
      "moonshotai/kimi-k2.6",
      "moonshotai/kimi-k2.5",
      "z-ai/glm-5.3-flash",
      "z-ai/glm-5.2",
      "z-ai/glm-5.1",
      "z-ai/glm-5v-turbo",
      "z-ai/glm-5",
      "z-ai/glm-5-turbo",
      "z-ai/glm-4.7",
      "z-ai/glm-4.7-flash",
      "z-ai/glm-4.6",
      "z-ai/glm-4.6v",
      "z-ai/glm-4.5-air",
      "z-ai/glm-4.5",
      "qwen/qwen3.8-flash",
      "qwen/qwen3.7-max",
      "qwen/qwen3.7-plus",
      "qwen/qwen3.7-flash",
      "qwen/qwen3.6-plus",
      "qwen/qwen3.6-flash",
      "qwen/qwen3.5-plus-20260420",
      "qwen/qwen3-vl-plus",
      "qwen/qwen3-vl-flash",
      "minimax/minimax-m2.7",
      "minimax/minimax-m2.5",
      "xiaomi/mimo-v2.5",
      "x-ai/grok-build-0.1",
      "x-ai/grok-4.3"
    ],
    "enabledByDefault": [
      "openai/gpt-5.6-sol",
      "anthropic/claude-opus-5",
      "deepseek/deepseek-v4-pro",
      "moonshotai/kimi-k3",
      "z-ai/glm-5.3",
      "qwen/qwen3.8-max",
      "minimax/minimax-m3",
      "xiaomi/mimo-v2.5-pro",
      "x-ai/grok-4.6",
      "openai/gpt-6-astra",
      "anthropic/claude-fable-5.1"
    ]
  },
  {
    "id": "opencode-go-chat",
    "name": "OpenCode Go (Chat)",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://opencode.ai/auth",
    "apiFormat": "openai-chat-completions",
    "baseUrl": "https://opencode.ai/zen/go/v1",
    "logo": "opencode",
    "models": [
      "glm-5.3-flash",
      "glm-5.3",
      "kimi-k3",
      "kimi-k2.7-code",
      "deepseek-v4.1-flash",
      "deepseek-v4-pro",
      "mimo-v2.5",
      "mimo-v2.5-pro",
      "glm-5.2",
      "glm-5.1",
      "kimi-k2.6",
      "deepseek-v4-flash",
      "deepseek-v4-flash-vision-exp",
      "hy4-preview",
      "hy3"
    ],
    "enabledByDefault": [
      "glm-5.3-flash",
      "glm-5.3",
      "kimi-k3",
      "kimi-k2.7-code",
      "deepseek-v4.1-flash",
      "deepseek-v4-pro",
      "mimo-v2.5",
      "mimo-v2.5-pro"
    ]
  },
  {
    "id": "opencode-go-messages",
    "name": "OpenCode Go (Anthropic)",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://opencode.ai/auth",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://opencode.ai/zen/go/v1",
    "logo": "opencode",
    "models": [
      "minimax-m3",
      "qwen3.8-max",
      "qwen3.8-flash",
      "minimax-m2.7",
      "minimax-m2.5",
      "qwen3.7-max",
      "qwen3.7-plus",
      "qwen3.6-plus"
    ],
    "enabledByDefault": [
      "minimax-m3",
      "qwen3.8-max",
      "qwen3.8-flash"
    ]
  },
  {
    "id": "opencode-go-responses",
    "name": "OpenCode Go (Responses)",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://opencode.ai/auth",
    "apiFormat": "openai-responses",
    "baseUrl": "https://opencode.ai/zen/go/v1",
    "logo": "opencode",
    "models": [
      "gpt-5.6-luna",
      "grok-4.6"
    ],
    "enabledByDefault": [
      "gpt-5.6-luna",
      "grok-4.6"
    ]
  },
  {
    "id": "opencode-zen-responses",
    "name": "OpenCode Zen (Responses)",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://opencode.ai/auth",
    "apiFormat": "openai-responses",
    "baseUrl": "https://opencode.ai/zen/v1",
    "logo": "opencode",
    "models": [
      "gpt-6-astra",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
      "gpt-5.5",
      "gpt-5.5-pro",
      "gpt-5.4",
      "gpt-5.4-pro",
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5.3-codex",
      "gpt-5.3-codex-spark",
      "gpt-5.2",
      "gpt-5.1"
    ],
    "enabledByDefault": [
      "gpt-5.6-sol",
      "gpt-6-astra"
    ]
  },
  {
    "id": "opencode-zen-messages",
    "name": "OpenCode Zen (Anthropic)",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://opencode.ai/auth",
    "apiFormat": "anthropic-messages",
    "baseUrl": "https://opencode.ai/zen/v1",
    "logo": "opencode",
    "models": [
      "claude-fable-5-1",
      "claude-fable-5",
      "qwen3.7-max",
      "qwen3.6-plus",
      "qwen3.5-plus",
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5",
      "claude-opus-4-8",
      "claude-opus-4-7",
      "claude-opus-4-6",
      "claude-opus-4-5",
      "claude-sonnet-4-6",
      "claude-sonnet-4-5",
      "qwen3.7-plus"
    ],
    "enabledByDefault": [
      "claude-fable-5",
      "qwen3.7-max",
      "qwen3.6-plus",
      "qwen3.5-plus",
      "claude-fable-5-1"
    ]
  },
  {
    "id": "opencode-zen-chat",
    "name": "OpenCode Zen (Chat)",
    "group": "Other",
    "access": "api-key",
    "apiKeyManagementUrl": "https://opencode.ai/auth",
    "apiFormat": "openai-chat-completions",
    "baseUrl": "https://opencode.ai/zen/v1",
    "logo": "opencode",
    "models": [
      "kimi-k3",
      "minimax-m3",
      "deepseek-v4-pro",
      "glm-5.2",
      "big-pickle",
      "mimo-v2.5-free",
      "hy3-free",
      "ling-3.0-flash-fin-free",
      "nemotron-3-ultra-free",
      "muse-spark-1.2-contributor-free",
      "minimax-m2.7",
      "deepseek-v4-flash",
      "glm-5.1",
      "nemotron-3.5-lightning-free"
    ],
    "enabledByDefault": [
      "kimi-k3",
      "minimax-m3",
      "deepseek-v4-pro",
      "glm-5.2",
      "big-pickle",
      "mimo-v2.5-free",
      "hy3-free",
      "ling-3.0-flash-fin-free",
      "nemotron-3-ultra-free",
      "muse-spark-1.2-contributor-free"
    ]
  }
];

export const CATALOG_MODELS: Record<string, CatalogModel> =
{
  "GLM-4-Flash-250414": {
    "contextWindow": 131072,
    "maxOutputTokens": 16384,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4-FlashX-250414": {
    "contextWindow": 131072,
    "maxOutputTokens": 16384,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.1V-Thinking-Flash": {
    "contextWindow": 65536,
    "maxOutputTokens": 32768,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.1V-Thinking-FlashX": {
    "contextWindow": 65536,
    "maxOutputTokens": 32768,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.5": {
    "contextWindow": 131072,
    "maxOutputTokens": 98304,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.5-Air": {
    "contextWindow": 131072,
    "maxOutputTokens": 98304,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.6": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.6V": {
    "contextWindow": 131072,
    "maxOutputTokens": 32768,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.6V-Flash": {
    "contextWindow": 131072,
    "maxOutputTokens": 32768,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.6V-FlashX": {
    "contextWindow": 131072,
    "maxOutputTokens": 32768,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.7": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.7-Flash": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4.7-FlashX": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-4V-Flash": {
    "contextWindow": 16384,
    "maxOutputTokens": 1024,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-5": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-5-Turbo": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-5.1": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-5.1-Highspeed": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "GLM-5.3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "GLM-5.3-Flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "video",
      "pdf"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "GLM-5V-Turbo": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "MiniMax-M2": {
    "contextWindow": 204800,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "MiniMax-M2.1": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "MiniMax-M2.1-highspeed": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "MiniMax-M2.5": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "MiniMax-M2.5-highspeed": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "MiniMax-M2.7": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "MiniMax-M2.7-highspeed": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "MiniMax-M3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 32000,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-fable-5.1": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-haiku-4.5": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-opus-4.5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-opus-4.6": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-opus-4.7": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-opus-4.8": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-opus-5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-sonnet-4.5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-sonnet-4.6": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "anthropic/claude-sonnet-5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "big-pickle": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "charglm-4": {
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-fable-5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "claude-fable-5-1": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "claude-haiku-4-5": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-haiku-4-5-20251001": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-opus-4-5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-opus-4-6": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-opus-4-7": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-opus-4-8": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-opus-5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "claude-sonnet-4-5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-sonnet-4-6": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "claude-sonnet-5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "codegeex-4": {
    "contextWindow": 131072,
    "maxOutputTokens": 32768,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "deepseek-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 384000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "deepseek-v4-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 384000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "deepseek-v4-flash-vision-exp": {
    "contextWindow": 1000000,
    "maxOutputTokens": 384000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "deepseek-v4-pro": {
    "contextWindow": 1000000,
    "maxOutputTokens": 384000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "deepseek-v4.1-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 384000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "deepseek/deepseek-v4-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 384000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "deepseek/deepseek-v4-pro": {
    "contextWindow": 1000000,
    "maxOutputTokens": 384000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "deepseek/deepseek-v4.1-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 384000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "emohaa": {
    "contextWindow": 8192,
    "maxOutputTokens": 4096,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "glm-5.1": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "glm-5.2": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "glm-5.3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "glm-5.3-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "video",
      "pdf"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "gpt-5.1": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "gpt-5.2": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "gpt-5.3-codex": {
    "contextWindow": 400000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "gpt-5.3-codex-spark": {
    "contextWindow": 400000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "gpt-5.4": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "gpt-5.4-mini": {
    "contextWindow": 400000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "gpt-5.4-nano": {
    "contextWindow": 400000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "gpt-5.4-pro": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "gpt-5.5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "gpt-5.5-pro": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "gpt-5.6": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "gpt-5.6-luna": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "gpt-5.6-sol": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "gpt-5.6-terra": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "gpt-6-astra": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "grok-4.3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "grok-4.6": {
    "contextWindow": 500000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "grok-build-0.1": {
    "contextWindow": 256000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "hy3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "hy3-free": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "hy4-preview": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "k3": {
    "contextWindow": 1048576,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "k3-256k": {
    "contextWindow": 262144,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "kimi-k2.6": {
    "contextWindow": 262144,
    "maxOutputTokens": 98304,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "kimi-k2.7-code": {
    "contextWindow": 262144,
    "maxOutputTokens": 98304,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "enabled"
    ],
    "supportsToolCall": true
  },
  "kimi-k2.7-code-highspeed": {
    "contextWindow": 262144,
    "maxOutputTokens": 98304,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "enabled"
    ],
    "supportsToolCall": true
  },
  "kimi-k3": {
    "contextWindow": 1048576,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "ling-3.0-flash-fin-free": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "mimo-v2.5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video",
      "audio"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "mimo-v2.5-free": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video",
      "audio"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "mimo-v2.5-pro": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "mimo-v2.6-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video",
      "audio"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "mimo-v2.6-pro": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video",
      "audio"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "minimax-m2.5": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "minimax-m2.7": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "minimax-m3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 32000,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "minimax/minimax-m2.5": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "minimax/minimax-m2.7": {
    "contextWindow": 204800,
    "maxOutputTokens": 32000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "minimax/minimax-m3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 32000,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "moonshotai/kimi-k2.5": {
    "contextWindow": 262144,
    "maxOutputTokens": 98304,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "moonshotai/kimi-k2.6": {
    "contextWindow": 262144,
    "maxOutputTokens": 98304,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "moonshotai/kimi-k2.7-code": {
    "contextWindow": 262144,
    "maxOutputTokens": 98304,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "enabled"
    ],
    "supportsToolCall": true
  },
  "moonshotai/kimi-k3": {
    "contextWindow": 1048576,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "muse-spark-1.2-contributor-free": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "nemotron-3-ultra-free": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "nemotron-3.5-lightning-free": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.3-codex": {
    "contextWindow": 400000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.4": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.4-mini": {
    "contextWindow": 400000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.4-nano": {
    "contextWindow": 400000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.4-pro": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.6": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.6-luna": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.6-sol": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-5.6-terra": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "openai/gpt-6-astra": {
    "contextWindow": 1050000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "pdf"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "qwen-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 32768,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen-plus": {
    "contextWindow": 1000000,
    "maxOutputTokens": 32768,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3-vl-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3-vl-plus": {
    "contextWindow": 262144,
    "maxOutputTokens": 32768,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.5-plus-20260420": {
    "contextWindow": 1000000,
    "maxOutputTokens": 65536,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.6-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 65536,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.6-plus": {
    "contextWindow": 1000000,
    "maxOutputTokens": 65536,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.7-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.7-max": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.7-plus": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.8-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "low",
      "medium",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.8-max": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "low",
      "medium",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "qwen/qwen3.8-max-0902": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "low",
      "medium",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "qwen3-max": {
    "contextWindow": 262144,
    "maxOutputTokens": 65536,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3-vl-plus": {
    "contextWindow": 262144,
    "maxOutputTokens": 32768,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3.5-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 65536,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3.5-plus": {
    "contextWindow": 1000000,
    "maxOutputTokens": 65536,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3.6-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 65536,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3.6-plus": {
    "contextWindow": 1000000,
    "maxOutputTokens": 65536,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3.7-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3.7-max": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3.7-plus": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "qwen3.8-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "low",
      "medium",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "qwen3.8-max": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "low",
      "medium",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "qwen3.8-omni-flash": {
    "contextWindow": 65536,
    "maxOutputTokens": 16384,
    "inputs": [
      "text",
      "image",
      "video",
      "audio"
    ],
    "reasoning": [
      "none",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
      "max"
    ],
    "supportsToolCall": true
  },
  "x-ai/grok-4.3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "x-ai/grok-4.6": {
    "contextWindow": 500000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "low",
      "medium",
      "high",
      "xhigh"
    ],
    "supportsToolCall": true
  },
  "x-ai/grok-build-0.1": {
    "contextWindow": 256000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "xiaomi/mimo-v2.5": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video",
      "audio"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "xiaomi/mimo-v2.5-pro": {
    "contextWindow": 1000000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-4.5": {
    "contextWindow": 131072,
    "maxOutputTokens": 98304,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-4.5-air": {
    "contextWindow": 131072,
    "maxOutputTokens": 98304,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-4.6": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-4.6v": {
    "contextWindow": 131072,
    "maxOutputTokens": 32768,
    "inputs": [
      "text",
      "image"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-4.7": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-4.7-flash": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-5": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-5-turbo": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-5.1": {
    "contextWindow": 200000,
    "maxOutputTokens": 64000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-5.2": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "disabled",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-5.3": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-5.3-flash": {
    "contextWindow": 1000000,
    "maxOutputTokens": 128000,
    "inputs": [
      "text",
      "image",
      "video",
      "pdf"
    ],
    "reasoning": [
      "low",
      "high",
      "max"
    ],
    "supportsToolCall": true
  },
  "z-ai/glm-5v-turbo": {
    "contextWindow": 200000,
    "maxOutputTokens": 131072,
    "inputs": [
      "text",
      "image",
      "video"
    ],
    "reasoning": [
      "disabled",
      "enabled"
    ],
    "supportsToolCall": true
  }
};
