"use client";

// UNiCOM client state (zustand).
//
// R-C2 (live wiring): hydrate() swaps the mock seeds for the persisted DB
// state on boot — never blocking first paint (mock seeds render instantly,
// live data swaps in when it lands). Every mutation is dual-path: a live API
// call with a byte-equivalent local fallback, so demo mode (backend
// unreachable) behaves exactly like the UI-only phase. Settings mutations
// persist fire-and-forget (pushSettingsLive) with the local optimistic apply
// staying instant.
//
// R-B2 (zcode depth): plan-mode chat (plans hold at step 0 until approved),
// @-context on sendChat, and the c-1 overnight-findings message with an
// inline diff preview linking to the decision.
//
// R-B1 (zcode emergence): adds the settings model, project groups and the
// new-task draft, plus the launch pipeline (draft → running mission →
// dispatch watch event → missions section). Base behavior is untouched.
import { create } from "zustand";
import {
  type Decision,
  type DiffBlock,
  type Mission,
  type PermissionFamily,
  type PermissionPolicy,
  type ProjectGroup,
  type SettingsState,
  type Skill,
  type StoreConnection,
  type WatchEvent,
  LINEN_THROW_DIFF,
  PERMISSION_FAMILIES,
  SEED_DECISIONS,
  SEED_GROUPS,
  SEED_MISSIONS,
  SEED_SETTINGS,
  SEED_SKILLS,
  SEED_STORES,
  SEED_WATCH_EVENTS,
} from "./data";

export type Section =
  | "command"
  | "stores"
  | "missions"
  | "chat"
  | "decisions"
  | "watch"
  | "skills"
  | "newtask"
  | "settings";

// ——— New task: the draft the composer edits ———

export type TaskDraft = {
  goal: string;
  stores: string[]; // store ids in scope
  skills: string[]; // skill ids to involve
  groupId: string; // "" ungrouped | group id | "__new__"
  newGroupName: string;
  autonomy: "plan" | "act";
  guardrails: {
    prices: boolean;
    publishing: boolean;
    data: boolean;
    spend: boolean;
  };
  context: string[]; // CONTEXT_OPTIONS ids
};

const freshDraft = (storeIds: string[]): TaskDraft => ({
  goal: "",
  stores: storeIds,
  skills: [],
  groupId: "",
  newGroupName: "",
  autonomy: "plan",
  guardrails: { prices: true, publishing: true, data: true, spend: true },
  context: ["morning-brief"],
});

export const INITIAL_DRAFT: TaskDraft = freshDraft(
  SEED_STORES.map((s) => s.id),
);

type ResolvedDecision = {
  decision: Decision;
  verdict: "approved" | "declined";
  at: number;
};

export type ChatMessage = {
  id: string;
  role: "merchant" | "agent";
  text: string;
  plan?: string[];
  planDone?: number;
  // R-B2 plan-mode: false = the plan holds at step 0 until you approve it
  planApproved?: boolean;
  evidence?: string[];
  // R-B2: inline evidence — a diff preview + a jump link (c-1 carries these)
  diff?: DiffBlock;
  diffLink?: { label: string; section: Section };
};

// ——— R-C2: live wiring helpers ———

/** The /api/hydrate envelope (data fields ride alongside ok:true). */
type HydratePayload = {
  stores: StoreConnection[];
  missions: Mission[];
  decisions: Decision[];
  resolvedDecisions: ResolvedDecision[];
  watchEvents: WatchEvent[];
  skills: Skill[];
  settings: SettingsState;
  chat: {
    id: string;
    role: "merchant" | "agent";
    text: string;
    plan?: string[];
  }[];
};

/** Fetch a relative API path; resolve the parsed body when the envelope says
 *  ok, throw otherwise (error message from the envelope when present). */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as
    | (T & { ok?: boolean; error?: string })
    | null;
  if (!body || body.ok !== true) {
    throw new Error(body?.error ?? `request failed: ${path}`);
  }
  return body;
}

/** Fire-and-forget settings persistence — the local optimistic apply stays
 *  instant; a failure leaves local state as the UI truth (demo semantics). */
function pushSettingsLive(live: boolean, patch: object): void {
  if (!live) return;
  void api("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  }).catch(() => {
    /* transient failure — local state remains the UI truth */
  });
}

interface ProductState {
  section: Section;
  stores: StoreConnection[];
  connecting: { platform: string; step: number } | null;
  missions: Mission[];
  decisions: Decision[];
  resolved: ResolvedDecision[];
  skills: Skill[];
  watchEvents: WatchEvent[];
  chat: ChatMessage[];
  chatThinking: boolean;
  toastQueue: { title: string; desc: string }[];
  // R-C2 — live wiring
  live: boolean;
  hydrating: boolean;
  // R-B1
  settings: SettingsState;
  groups: ProjectGroup[];
  draft: TaskDraft;

  setSection: (s: Section) => void;
  startConnect: (platform: string) => void;
  advanceConnect: () => void;
  finishConnect: (store: Omit<StoreConnection, "installedSkills">) => void;
  cancelConnect: () => void;
  resolveDecision: (id: string, verdict: "approved" | "declined") => void;
  toggleSkill: (skillId: string, storeId: string) => void;
  sendChat: (text: string, planFirst?: boolean, context?: string[]) => void;
  approvePlan: (msgId: string) => void;
  tickPlan: (msgId: string) => void;
  pushToast: (title: string, desc: string) => void;
  // R-C2 — boot hydration (mock seeds paint instantly; live data swaps in)
  hydrate: () => Promise<void>;
  // R-B1 actions — settings
  setSettings: (partial: Partial<SettingsState>) => void;
  setPermission: (family: PermissionFamily, policy: PermissionPolicy) => void;
  toggleAutomation: (id: string) => void;
  addAutomation: (a: {
    name: string;
    schedule: string;
    stores: string[];
    skill: string;
  }) => void;
  toggleCommand: (id: string) => void;
  addCommand: (c: {
    name: string;
    description: string;
    body: string;
  }) => void;
  toggleHook: (id: string) => void;
  addHook: (h: { event: string; action: string }) => void;
  reconnectMcp: (id: string) => void;
  toggleMcp: (id: string) => void;
  addMcpServer: (name: string, scope?: string[]) => void;
  setComputerUse: (partial: Partial<SettingsState["computerUse"]>) => void;
  setNotifications: (partial: Partial<SettingsState["notifications"]>) => void;
  setDataSettings: (partial: Partial<SettingsState["data"]>) => void;
  // R-B1 actions — stores (settings connection manager)
  syncStore: (id: string) => void;
  syncAllStores: () => void;
  reconnectStore: (id: string) => void;
  revokeStore: (id: string) => void;
  // R-B1 actions — danger zone
  pauseAllMissions: () => void;
  disconnectAllStores: () => void;
  resetWorkspace: () => void;
  // R-B1 actions — new task
  setDraft: (partial: Partial<TaskDraft>) => void;
  resetDraft: () => void;
  launchTask: () => void;
}

const CONNECT_STEPS = 3;

const nowZ = () => new Date().toISOString().slice(11, 16) + "Z";

const seedChat = (): ChatMessage[] => [
  {
    id: "c-0",
    role: "agent",
    text: "Morning. All three stores are connected and green — Mountain Reads self-healed a rate-limit at 07:04Z, nothing needs you urgently. Ask me anything, or say things like “reprice the linen throw” or “why did Etsy jump 24%?”",
  },
  {
    id: "c-1",
    role: "agent",
    text: "While you were away, Price Sentinel packed the overnight findings into decision d-1 — the reprice bundle is ready for your review.",
    diff: LINEN_THROW_DIFF,
    diffLink: { label: "Open decision d-1", section: "decisions" },
  },
];

export const useProduct = create<ProductState>((set, get) => ({
  section: "command",
  stores: SEED_STORES,
  connecting: null,
  missions: SEED_MISSIONS,
  decisions: SEED_DECISIONS,
  resolved: [],
  skills: SEED_SKILLS,
  watchEvents: SEED_WATCH_EVENTS,
  chat: seedChat(),
  chatThinking: false,
  toastQueue: [],
  live: false,
  hydrating: false,
  settings: structuredClone(SEED_SETTINGS),
  groups: SEED_GROUPS,
  draft: INITIAL_DRAFT,

  setSection: (section) => set({ section }),

  startConnect: (platform) =>
    set({ connecting: { platform, step: 0 } }),

  advanceConnect: () =>
    set((s) => {
      if (!s.connecting) return {};
      const step = Math.min(s.connecting.step + 1, CONNECT_STEPS);
      return { connecting: { ...s.connecting, step } };
    }),

  finishConnect: (store) => {
    // Shared apply — byte-equivalent to the mock behavior, parameterized by
    // whichever store object won (server-minted on success, passed on failure).
    const apply = (final: StoreConnection) => {
      set((s) => ({
        stores: [...s.stores, final],
        connecting: null,
        watchEvents: [
          {
            id: `e-${Date.now()}`,
            ts: nowZ(),
            kind: "heal" as const,
            actor: "connector",
            text: `${final.name} connected — initial catalog sync queued (${final.products} products)`,
          },
          ...s.watchEvents,
        ],
      }));
      get().pushToast("Store connected", `${final.name} joined the watch ring.`);
    };
    const fallback = () => apply({ ...store, installedSkills: [] });
    // LIVE: the server mints the id + plausible metrics; on failure the
    // passed store applies locally with installedSkills [] (today's behavior).
    api<{ store: StoreConnection }>("/api/stores", {
      method: "POST",
      body: JSON.stringify({
        name: store.name,
        domain: store.domain,
        platform: store.platform,
      }),
    })
      .then((r) => (r.store ? apply(r.store) : fallback()))
      .catch(fallback);
  },

  cancelConnect: () => set({ connecting: null }),

  resolveDecision: (id, verdict) => {
    const d = get().decisions.find((x) => x.id === id);
    if (!d) return;
    // local apply first — the checkbox never blocks on the network
    set((s) => ({
      decisions: s.decisions.filter((x) => x.id !== id),
      resolved: [...s.resolved, { decision: d, verdict, at: Date.now() }],
      watchEvents: [
        {
          id: `e-${Date.now()}`,
          ts: nowZ(),
          kind: "review" as const,
          actor: "you",
          text: `${verdict === "approved" ? "Approved" : "Declined"} — ${d.title}`,
        },
        ...s.watchEvents,
      ],
    }));
    get().pushToast(
      verdict === "approved" ? "Decision approved" : "Decision declined",
      d.title,
    );
    if (get().live) {
      void api(`/api/decisions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ verdict }),
      }).catch(() => {});
    }
  },

  toggleSkill: (skillId, storeId) => {
    const skill = get().skills.find((s) => s.id === skillId);
    const store = get().stores.find((s) => s.id === storeId);
    if (!skill || !store) return;
    const has = skill.installedOn.includes(storeId);
    // local apply — instant, identical in live and demo mode
    set((s) => ({
      skills: s.skills.map((sk) =>
        sk.id === skillId
          ? {
              ...sk,
              installedOn: has
                ? sk.installedOn.filter((x) => x !== storeId)
                : [...sk.installedOn, storeId],
            }
          : sk,
      ),
      stores: s.stores.map((st) =>
        st.id === storeId
          ? {
              ...st,
              installedSkills: has
                ? st.installedSkills.filter((x) => x !== skillId)
                : [...st.installedSkills, skillId],
            }
          : st,
      ),
      watchEvents: has
        ? s.watchEvents
        : [
            {
              id: `e-${Date.now()}`,
              ts: nowZ(),
              kind: "dispatch" as const,
              actor: skillId,
              text: `${skill.name} installed on ${store.name} — initial sweep queued`,
            },
            ...s.watchEvents,
          ],
    }));
    get().pushToast(
      has ? "Skill removed" : "Skill installed",
      `${skill.name} ${has ? "removed from" : "installed on"} ${store.name}.`,
    );
    if (get().live) {
      void api(`/api/skills/${skillId}`, {
        method: "PATCH",
        body: JSON.stringify({ storeId }),
      }).catch(() => {});
    }
  },

  sendChat: (text, planFirst = true, context) => {
    const id = `c-${Date.now()}`;
    set((s) => ({
      chat: [...s.chat, { id, role: "merchant" as const, text }],
      chatThinking: true,
    }));
    // LIVE brain: the server persists the exchange, grounds Atlas in the DB
    // and returns {text, plan}. planFirst=true → the plan holds at step 0
    // (planApproved: false); act-now → it ticks (planApproved: true). On
    // failure the local mock reply behavior runs unchanged.
    api<{ text: string; plan: string[] }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: text, planFirst, context }),
    })
      .then((r) => {
        set((s) => ({
          chat: [
            ...s.chat,
            {
              id: `${id}-a`,
              role: "agent" as const,
              text: r.text,
              ...(r.plan && r.plan.length > 0
                ? {
                    plan: r.plan,
                    planDone: 0,
                    planApproved: planFirst ? false : true,
                    evidence: [],
                  }
                : {}),
            },
          ],
          chatThinking: false,
        }));
      })
      .catch(() => {
        // local mock reply — today's behavior, byte-equivalent
        setTimeout(() => {
          const ctx = context?.length
            ? ` Context pinned — ${context.join(" · ")}.`
            : "";
          set((s) => ({
            chat: [
              ...s.chat,
              {
                id: `${id}-a`,
                role: "agent" as const,
                text: planFirst
                  ? `On it.${ctx} Here's my plan — nothing acts until you approve it.`
                  : `On it.${ctx} Here's my plan — I'll report evidence as each step lands.`,
                plan: [
                  "Pull the last 30 days across your connected stores",
                  "Identify the SKU / listing in question",
                  "Draft the change as a decision packet for you",
                  "Attach evidence (diff, model, confidence)",
                ],
                planDone: 0,
                planApproved: planFirst ? false : true,
                evidence: [],
              },
            ],
            chatThinking: false,
          }));
        }, 700);
      });
  },

  approvePlan: (msgId) => {
    set((s) => ({
      chat: s.chat.map((m) =>
        m.id === msgId && m.plan && m.planApproved === false
          ? { ...m, planApproved: true }
          : m,
      ),
    }));
    get().pushToast(
      "Plan approved — execution continues",
      "The agent is working the plan — evidence lands as each step completes.",
    );
  },

  tickPlan: (msgId) =>
    set((s) => ({
      chat: s.chat.map((m) =>
        m.id === msgId &&
          m.plan &&
          m.planDone !== undefined &&
          m.planApproved !== false
          ? { ...m, planDone: Math.min(m.planDone + 1, m.plan.length) }
          : m,
      ),
    })),

  pushToast: (title, desc) =>
    set((s) => ({ toastQueue: [...s.toastQueue, { title, desc }] })),

  // ——— R-C2: boot hydration ———

  hydrate: async () => {
    if (get().hydrating) return;
    set({ hydrating: true });
    try {
      const data = await api<HydratePayload>("/api/hydrate");
      set((s) => ({
        stores: data.stores,
        missions: data.missions,
        decisions: data.decisions,
        resolved: data.resolvedDecisions,
        watchEvents: data.watchEvents,
        skills: data.skills,
        settings: data.settings,
        // The DB persists text+plan only — re-attach the c-1 inline evidence
        // (diff preview + jump link), and settle past sessions' agent plans
        // as approved + complete so history never pulses at step 0.
        chat: data.chat.map((m) => {
          const enriched: ChatMessage = { ...m };
          if (m.id === "c-1") {
            enriched.diff = LINEN_THROW_DIFF;
            enriched.diffLink = {
              label: "Open decision d-1",
              section: "decisions",
            };
          }
          if (m.role === "agent" && m.plan && m.plan.length > 0) {
            enriched.planApproved = true;
            enriched.planDone = m.plan.length;
          }
          return enriched;
        }),
        // re-scope the draft to the live store set (revoked stores drop out)
        draft: { ...s.draft, stores: data.stores.map((st) => st.id) },
        live: true,
        hydrating: false,
      }));
    } catch {
      // Backend unreachable — the mock seeds stay on screen, live stays
      // false, and every mutation runs on its local fallback.
      set({ live: false, hydrating: false });
      get().pushToast(
        "Backend unreachable",
        "Running on demo data — changes stay in this session",
      );
    }
  },

  // ——— R-B1: settings ———

  setSettings: (partial) => {
    set((s) => ({ settings: { ...s.settings, ...partial } }));
    pushSettingsLive(get().live, partial);
  },

  setPermission: (family, policy) => {
    const label =
      PERMISSION_FAMILIES.find((f) => f.id === family)?.label ?? family;
    set((s) => ({
      settings: {
        ...s.settings,
        permissions: { ...s.settings.permissions, [family]: policy },
      },
    }));
    pushSettingsLive(get().live, { permissions: { [family]: policy } });
    get().pushToast("Permission updated", `${label} → ${policy}.`);
  },

  toggleAutomation: (id) => {
    const a = get().settings.automations.find((x) => x.id === id);
    if (!a) return;
    const automations = get().settings.automations.map((x) =>
      x.id === id ? { ...x, enabled: !x.enabled } : x,
    );
    set((s) => ({ settings: { ...s.settings, automations } }));
    pushSettingsLive(get().live, { automations });
    get().pushToast(
      a.enabled ? "Automation paused" : "Automation armed",
      `${a.name} · ${a.schedule}.`,
    );
  },

  addAutomation: ({ name, schedule, stores, skill }) => {
    const automations = [
      ...get().settings.automations,
      {
        id: `a-${Date.now()}`,
        name,
        schedule,
        stores,
        skill,
        enabled: true,
      },
    ];
    set((s) => ({ settings: { ...s.settings, automations } }));
    pushSettingsLive(get().live, { automations });
    get().pushToast("Automation created", `${name} · ${schedule}.`);
  },

  toggleCommand: (id) => {
    const c = get().settings.commands.find((x) => x.id === id);
    if (!c) return;
    const commands = get().settings.commands.map((x) =>
      x.id === id ? { ...x, enabled: !x.enabled } : x,
    );
    set((s) => ({ settings: { ...s.settings, commands } }));
    pushSettingsLive(get().live, { commands });
    get().pushToast(
      c.enabled ? "Command disabled" : "Command enabled",
      `${c.name} ${c.enabled ? "left the palette." : "joined the palette."}`,
    );
  },

  addCommand: ({ name, description, body }) => {
    const nm = name.trim().startsWith("/") ? name.trim() : `/${name.trim()}`;
    const commands = [
      ...get().settings.commands,
      {
        id: `cmd-${Date.now()}`,
        name: nm,
        description,
        body,
        enabled: true,
      },
    ];
    set((s) => ({ settings: { ...s.settings, commands } }));
    pushSettingsLive(get().live, { commands });
    get().pushToast("Command created", `${nm} added to the palette.`);
  },

  toggleHook: (id) => {
    const h = get().settings.hooks.find((x) => x.id === id);
    if (!h) return;
    const hooks = get().settings.hooks.map((x) =>
      x.id === id ? { ...x, enabled: !x.enabled } : x,
    );
    set((s) => ({ settings: { ...s.settings, hooks } }));
    pushSettingsLive(get().live, { hooks });
    get().pushToast(
      h.enabled ? "Hook disarmed" : "Hook armed",
      `When ${h.event} → ${h.action}.`,
    );
  },

  addHook: ({ event, action }) => {
    const hooks = [
      ...get().settings.hooks,
      { id: `h-${Date.now()}`, event, action, enabled: true },
    ];
    set((s) => ({ settings: { ...s.settings, hooks } }));
    pushSettingsLive(get().live, { hooks });
    get().pushToast("Hook added", `When ${event} → ${action}.`);
  },

  reconnectMcp: (id) => {
    const srv = get().settings.mcp.find((x) => x.id === id);
    if (!srv || srv.status !== "error") return;
    const mcp = get().settings.mcp.map((x) =>
      x.id === id
        ? { ...x, status: "connected" as const }
        : x,
    );
    set((s) => ({ settings: { ...s.settings, mcp } }));
    pushSettingsLive(get().live, { mcp });
    get().pushToast(
      "Server reconnected",
      `${srv.name} is back — ${srv.tools} tools live.`,
    );
  },

  toggleMcp: (id) => {
    const srv = get().settings.mcp.find((x) => x.id === id);
    if (!srv) return;
    const mcp = get().settings.mcp.map((x) =>
      x.id === id ? { ...x, enabled: !x.enabled } : x,
    );
    set((s) => ({ settings: { ...s.settings, mcp } }));
    pushSettingsLive(get().live, { mcp });
    get().pushToast(
      srv.enabled ? "Server disabled" : "Server enabled",
      `${srv.name} ${srv.enabled ? "unplugged from the agent pool." : "plugged back in."}`,
    );
  },

  addMcpServer: (name, scope = []) => {
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "server";
    const mcp = [
      ...get().settings.mcp,
      {
        id: `mcp-${slug}`,
        name,
        status: "idle" as const,
        tools: 0,
        scope,
        enabled: true,
      },
    ];
    set((s) => ({ settings: { ...s.settings, mcp } }));
    pushSettingsLive(get().live, { mcp });
    get().pushToast(
      "Server added",
      `${name} registered — idle until first handshake.`,
    );
  },

  setComputerUse: (partial) => {
    set((s) => ({
      settings: {
        ...s.settings,
        computerUse: { ...s.settings.computerUse, ...partial },
      },
    }));
    pushSettingsLive(get().live, { computerUse: partial });
  },

  setNotifications: (partial) => {
    set((s) => ({
      settings: {
        ...s.settings,
        notifications: { ...s.settings.notifications, ...partial },
      },
    }));
    pushSettingsLive(get().live, { notifications: partial });
  },

  setDataSettings: (partial) => {
    set((s) => ({
      settings: { ...s.settings, data: { ...s.settings.data, ...partial } },
    }));
    pushSettingsLive(get().live, { data: partial });
  },

  // ——— R-B1: stores (settings connection manager) ———

  syncStore: (id) => {
    const store = get().stores.find((s) => s.id === id);
    if (!store) return;
    set((s) => ({
      stores: s.stores.map((x) =>
        x.id === id ? { ...x, lastSync: "just now" } : x,
      ),
      watchEvents: [
        {
          id: `e-${Date.now()}`,
          ts: nowZ(),
          kind: "heartbeat" as const,
          actor: "sync-engine",
          text: `${store.name} synced — catalog fresh as of now`,
        },
        ...s.watchEvents,
      ],
    }));
    get().pushToast("Store synced", `${store.name} — catalog refresh landed.`);
    if (get().live) {
      void api(`/api/stores/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "sync" }),
      }).catch(() => {});
    }
  },

  syncAllStores: () => {
    const n = get().stores.length;
    if (n === 0) {
      get().pushToast("Nothing to sync", "No stores are connected right now.");
      return;
    }
    set((s) => ({
      stores: s.stores.map((x) => ({ ...x, lastSync: "just now" })),
      watchEvents: [
        {
          id: `e-${Date.now()}`,
          ts: nowZ(),
          kind: "dispatch" as const,
          actor: "you",
          text: `Sync queued for ${n} stores — full catalog refresh running`,
        },
        ...s.watchEvents,
      ],
    }));
    get().pushToast("Sync queued", `Sync queued for ${n} stores.`);
  },

  reconnectStore: (id) => {
    const store = get().stores.find((s) => s.id === id);
    if (!store) return;
    set((s) => ({
      stores: s.stores.map((x) =>
        x.id === id ? { ...x, health: "healthy" as const } : x,
      ),
      watchEvents: [
        {
          id: `e-${Date.now()}`,
          ts: nowZ(),
          kind: "heal" as const,
          actor: "connector",
          text: `${store.name} reconnected — connection healthy again`,
        },
        ...s.watchEvents,
      ],
    }));
    get().pushToast("Store reconnected", `${store.name} is healthy again.`);
    if (get().live) {
      void api(`/api/stores/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reconnect" }),
      }).catch(() => {});
    }
  },

  revokeStore: (id) => {
    const store = get().stores.find((s) => s.id === id);
    if (!store) return;
    set((s) => ({
      stores: s.stores.filter((x) => x.id !== id),
      watchEvents: [
        {
          id: `e-${Date.now()}`,
          ts: nowZ(),
          kind: "review" as const,
          actor: "you",
          text: `${store.name} revoked — access tokens destroyed`,
        },
        ...s.watchEvents,
      ],
    }));
    get().pushToast("Store revoked", `${store.name} left the ring.`);
    if (get().live) {
      void api(`/api/stores/${id}`, { method: "DELETE" }).catch(() => {});
    }
  },

  // ——— R-B1: danger zone ———

  pauseAllMissions: () => {
    const runningIds = get()
      .missions.filter((m) => m.status === "running")
      .map((m) => m.id);
    const touched = runningIds.length;
    set((s) => ({
      missions: s.missions.map((m) => {
        if (m.status !== "running") return m;
        return {
          ...m,
          status: "awaiting-approval" as const,
          eta: "paused — awaiting you",
          lanes: m.lanes.map((l) =>
            l.status === "running"
              ? { ...l, status: "in-review" as const }
              : l,
          ),
        };
      }),
      watchEvents: [
        {
          id: `e-${Date.now()}`,
          ts: nowZ(),
          kind: "review" as const,
          actor: "you",
          text: `All missions paused — ${touched} running mission${touched === 1 ? "" : "s"} now awaiting you`,
        },
        ...s.watchEvents,
      ],
    }));
    get().pushToast(
      "Missions paused",
      touched === 0
        ? "Nothing was running — the board is already quiet."
        : `${touched} mission${touched === 1 ? "" : "s"} pulled back to awaiting-you. Nothing acts until you release it.`,
    );
    // live: persist each pause (PATCH per running mission — no bulk route)
    if (get().live) {
      for (const mid of runningIds) {
        void api(`/api/missions/${mid}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "pause" }),
        }).catch(() => {});
      }
    }
  },

  disconnectAllStores: () => {
    const ids = get().stores.map((s) => s.id);
    set((s) => ({
      stores: [],
      watchEvents: [
        {
          id: `e-${Date.now()}`,
          ts: nowZ(),
          kind: "review" as const,
          actor: "you",
          text: `All stores disconnected — the ring is quiet`,
        },
        ...s.watchEvents,
      ],
    }));
    get().pushToast(
      "All stores disconnected",
      "Tokens destroyed. Reconnect any time — the catalog re-syncs in a minute.",
    );
    // live: persist each disconnect (DELETE per store — no bulk route)
    if (get().live) {
      for (const id of ids) {
        void api(`/api/stores/${id}`, { method: "DELETE" }).catch(() => {});
      }
    }
  },

  // No reset route exists — resetWorkspace is local-only (restores the seed
  // state in this session); re-hydration (reload → GET /api/hydrate) is the
  // recovery path back to the server's persisted truth.
  resetWorkspace: () => {
    set({
      stores: SEED_STORES,
      connecting: null,
      missions: SEED_MISSIONS,
      decisions: SEED_DECISIONS,
      resolved: [],
      skills: SEED_SKILLS,
      watchEvents: SEED_WATCH_EVENTS,
      chat: seedChat(),
      chatThinking: false,
      settings: structuredClone(SEED_SETTINGS),
      groups: SEED_GROUPS,
      draft: freshDraft(SEED_STORES.map((s) => s.id)),
    });
    get().pushToast(
      "Workspace reset",
      "Back to the seed state — a fresh morning.",
    );
  },

  // ——— R-B1: new task ———

  setDraft: (partial) => set((s) => ({ draft: { ...s.draft, ...partial } })),

  resetDraft: () =>
    set((s) => ({ draft: freshDraft(s.stores.map((x) => x.id)) })),

  launchTask: () => {
    const { draft, groups, pushToast } = get();
    const goal = draft.goal.trim();
    if (!goal) {
      pushToast(
        "Not ready to launch",
        "Describe the job first — even one sentence is enough.",
      );
      return;
    }
    if (draft.stores.length === 0) {
      pushToast(
        "Not ready to launch",
        "Pick at least one store — the task needs somewhere to run.",
      );
      return;
    }

    const ts = Date.now();
    let groupId: string | undefined = draft.groupId || undefined;
    // what the API receives: for "__new__" the client has already minted the
    // group id locally, so the server stores that (never the "__new__" token)
    let outgoingGroupId = draft.groupId || "";
    let groupsNext = groups;
    if (draft.groupId === "__new__") {
      const g: ProjectGroup = {
        id: `grp-${ts}`,
        name: draft.newGroupName.trim() || "Untitled group",
        tint: "bg-primary",
        blurb: "Created from the New Task page",
      };
      groupsNext = [...groups, g];
      groupId = g.id;
      outgoingGroupId = g.id;
    }

    const guardCount = Object.values(draft.guardrails).filter(Boolean).length;
    const scopeCount = draft.stores.length;
    const autonomy = draft.autonomy;

    // Shared apply — the server-minted mission and the local mock both land
    // here (prepend, group, dispatch event, draft reset, missions section).
    const applyMission = (mission: Mission) => {
      set((s) => ({
        missions: [mission, ...s.missions],
        groups: groupsNext,
        draft: freshDraft(s.stores.map((x) => x.id)),
        watchEvents: [
          {
            id: `e-${Date.now()}`,
            ts: nowZ(),
            kind: "dispatch" as const,
            actor: "orchestrator",
            text: `Mission dispatched — ${scopeCount} store${scopeCount > 1 ? "s" : ""} · ${autonomy === "plan" ? "plan-first" : "act-now"} · ${guardCount === 4 ? "all guardrails on" : `${guardCount} of 4 guardrails on`}`,
          },
          ...s.watchEvents,
        ],
        section: "missions",
      }));
      pushToast(
        "Mission launched",
        "Plan forming — first evidence lands in a moment.",
      );
    };

    // LIVE: the server mints the mission (+ dispatch event), then the plan
    // brain (LLM lanes, heuristic fallback server-side) swaps in the real
    // lanes. Any POST failure → the local mock mission, exactly as today.
    api<{ mission: Mission }>("/api/missions", {
      method: "POST",
      body: JSON.stringify({
        title: goal.slice(0, 80),
        brief: goal,
        stores: [...draft.stores],
        groupId: outgoingGroupId,
        autonomy,
        guardrails: { ...draft.guardrails },
      }),
    })
      .then((r) => {
        applyMission(r.mission);
        // plan formation — silent catch: the mission simply keeps its
        // Plan-formation lane if this leg fails
        return api<{ mission: Mission }>(`/api/missions/${r.mission.id}/plan`, {
          method: "POST",
        })
          .then((p) => {
            set((s) => ({
              missions: s.missions.map((m) =>
                m.id === p.mission.id ? p.mission : m,
              ),
            }));
          })
          .catch(() => {});
      })
      .catch(() => {
        // local mock mission — today's behavior, byte-equivalent
        applyMission({
          id: `m-${ts}`,
          title: goal.slice(0, 80),
          brief: goal,
          stores: [...draft.stores],
          status: "running",
          eta: "plan forming",
          started: nowZ(),
          groupId,
          lanes: [
            {
              id: `l-${ts}`,
              name: "Plan formation",
              worker: `wkr-${Math.floor(10 + Math.random() * 90)}`,
              status: "running",
              progress: 8,
              evidence: ["plan forming…"],
            },
          ],
        });
      });
  },
}));
