"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CalendarClock,
  ChartColumn,
  ChevronDown,
  ChevronRight,
  Database,
  EllipsisVertical,
  Eye,
  EyeOff,
  Globe,
  Info,
  Lock,
  MonitorSmartphone,
  Package,
  Pause,
  Pencil,
  Plug,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Terminal,
  Trash2,
  TriangleAlert,
  Unplug,
  UserRound,
  Webhook,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConnectDialog } from "@/components/product/stores";
import { ModelPicker } from "@/components/product/model-picker";
import { useProduct } from "@/lib/product/store";
import {
  AGENT_TONE_OPTIONS,
  AUTOMATION_SCHEDULES,
  HOOK_EVENTS,
  PERMISSION_FAMILIES,
  PERMISSION_POLICIES,
  platformOf,
  storeName,
  type AgentTone,
  type PermissionPolicy,
  type Verbosity,
} from "@/lib/product/data";
import {
  CATALOG_MODELS,
  PROVIDER_TEMPLATES,
  effectiveEffort,
  formatContextWindow,
  isVisionModel,
  modelRuleFor,
  providerFromTemplate,
  providerStatus,
  templateById,
  type CatalogModel,
  type ModelApiFormat,
  type ModelInput,
  type ModelProviderConfig,
  type ProviderStatus,
  type ProviderTemplate,
} from "@/lib/product/models";

// Settings — the zcode control surfaces (redesign §7-4d): identity, the
// approval matrix, automations, slash commands, hooks, MCP servers, computer
// use, store connections, notifications, data, and the danger zone.
// Everything the agent may do is shaped here; nothing here is decorative.
// The 12-tab inventory and every control are frozen — this pass restyles the
// scaffold, the tab chrome and the cards to the calmer discipline only.

/** Thin custom scrollbar for bounded lists (the long-list law). */
const THIN_SCROLL =
  "[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5";

const TABS = [
  {
    id: "general",
    label: "General",
    icon: SlidersHorizontal,
    title: "General",
    desc: "Who the agent is, which brain it runs on, and how much it says.",
  },
  {
    id: "models",
    label: "Models",
    icon: Package,
    title: "Model settings",
    desc: "The brains your missions think with — configured once, available everywhere work is dispatched.",
  },
  {
    id: "permissions",
    label: "Permissions",
    icon: ShieldCheck,
    title: "Permissions",
    desc: "The approval matrix — what the agent may do alone.",
  },
  {
    id: "automations",
    label: "Automations",
    icon: CalendarClock,
    title: "Automations",
    desc: "Skills that wake up on a schedule and sweep your stores.",
  },
  {
    id: "commands",
    label: "Commands",
    icon: Terminal,
    title: "Commands",
    desc: "Your slash palette — short names, real prompt bodies.",
  },
  {
    id: "hooks",
    label: "Hooks",
    icon: Webhook,
    title: "Hooks",
    desc: "When X happens, do Y — guarantees bolted onto the agent loop.",
  },
  {
    id: "mcp",
    label: "MCP",
    icon: Plug,
    title: "MCP servers",
    desc: "The toolbelt — platform servers the agent may call.",
  },
  {
    id: "computer",
    label: "Computer use",
    icon: MonitorSmartphone,
    title: "Computer use",
    desc: "The browser fence — off means the agent never touches one.",
  },
  {
    id: "stores",
    label: "Stores",
    icon: Store,
    title: "Stores",
    desc: "The connection manager — sync, heal, or revoke access.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    title: "Notifications",
    desc: "What reaches you, and when.",
  },
  {
    id: "data",
    label: "Data & privacy",
    icon: Database,
    title: "Data & privacy",
    desc: "Retention, redaction, and your evidence export.",
  },
  {
    id: "usage",
    label: "Usage",
    icon: ChartColumn,
    title: "Usage",
    desc: "What the ring actually did — counted from the local record, never estimated.",
  },
  {
    id: "danger",
    label: "Danger zone",
    icon: TriangleAlert,
    title: "Danger zone",
    desc: "Big red switches. Each one asks twice.",
  },
  {
    id: "about",
    label: "About",
    icon: Info,
    title: "About",
    desc: "What you're running, and where it came from.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsSection() {
  // FE2: the active tab lives in the store (settingsTab) so the palette and
  // the model picker can deep-link into Model settings.
  const settingsTab = useProduct((s) => s.settingsTab);
  const setSettingsTab = useProduct((s) => s.setSettingsTab);
  const tab = (TABS.find((t) => t.id === settingsTab)?.id ??
    "general") as TabId;
  const setTab = (id: TabId) => setSettingsTab(id);
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="flex flex-col gap-6">
      {/* Scaffold (§5) */}
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          UNiCOM Commerce Workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every guard, every schedule, every tool — the whole operating
          contract lives here.
        </p>
      </header>

      {/* Mobile: sticky horizontal chip strip — the shell's scroll-row
          pattern; quieter selected treatment (accent surface, not brand fill) */}
      <nav
        aria-label="Settings sections"
        className="sticky top-[calc(3.5rem+2rem)] z-30 -mx-4 border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:-mx-6 sm:px-6 lg:hidden"
      >
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "true" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                tab === t.id
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
        {/* Desktop: sticky tab rail — same selected treatment as the shell
            sidebar (accent surface contrast, no brand-fill blocks) */}
        <nav
          aria-label="Settings sections"
          className="hidden lg:block"
        >
          <div
            className={`sticky top-[calc(3.5rem+2rem)] flex max-h-[calc(100vh-7rem)] flex-col gap-1 overflow-y-auto pr-1 ${THIN_SCROLL}`}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "true" : undefined}
                className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  tab === t.id
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4 shrink-0" />
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Panel */}
        <div className="mt-6 min-w-0 lg:mt-0">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <TabHeader title={current.title} desc={current.desc} />
            <div className="space-y-6">
              {tab === "general" && <GeneralTab />}
              {tab === "models" && <ModelsTab />}
              {tab === "permissions" && <PermissionsTab />}
              {tab === "automations" && <AutomationsTab />}
              {tab === "commands" && <CommandsTab />}
              {tab === "hooks" && <HooksTab />}
              {tab === "mcp" && <McpTab />}
              {tab === "computer" && <ComputerTab />}
              {tab === "stores" && <StoresTab />}
              {tab === "notifications" && <NotificationsTab />}
              {tab === "data" && <DataTab />}
              {tab === "usage" && <UsageTab />}
              {tab === "danger" && <DangerTab />}
              {tab === "about" && <AboutTab />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ——— shared in-file pieces ———

function TabHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <header className="mb-5 flex flex-col gap-1">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </header>
  );
}

function SwitchRow({
  id,
  label,
  helper,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  helper?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        {helper && (
          <p className="text-[11px] leading-snug text-muted-foreground">
            {helper}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

function ToggleChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        pressed
          ? "border-primary/60 bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ——— General ———


function GeneralTab() {
  const { settings, setSettings, setSettingsTab, pushToast } = useProduct();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" />
            Agent identity
          </CardTitle>
          <CardDescription>
            The name your agent answers to, and the voice it speaks in.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="agent-name" className="text-xs font-medium">
              Agent name
            </Label>
            <Input
              id="agent-name"
              value={settings.agentName}
              onChange={(e) => setSettings({ agentName: e.target.value })}
              placeholder="Atlas"
            />
            <p className="text-[11px] text-muted-foreground">
              Shows up in the Commander chat, the morning brief, and every
              watch event it authors.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent-tone" className="text-xs font-medium">
              Voice
            </Label>
            <Select
              value={settings.agentTone}
              onValueChange={(v) => {
                setSettings({ agentTone: v as AgentTone });
                const label = AGENT_TONE_OPTIONS.find(
                  (t) => t.id === v,
                )?.label;
                pushToast("Voice updated", `The agent now speaks ${label?.toLowerCase()}.`);
              }}
            >
              <SelectTrigger id="agent-tone" className="w-full">
                <SelectValue placeholder="Pick a voice" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_TONE_OPTIONS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Warm professional is the house voice — kind, but it doesn&apos;t
              waste your morning.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Default model</CardTitle>
            <CardDescription>
              New missions start with this brain — set the default and its
              effort in Model settings.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            className="h-11 shrink-0 px-3 text-primary"
            onClick={() => setSettingsTab("models")}
          >
            Manage
            <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border bg-muted/50 px-3 py-1.5 font-mono text-sm">
              {settings.model}
            </span>
            <span className="rounded-md border bg-muted/50 px-3 py-1.5 font-mono text-sm text-muted-foreground">
              {effectiveEffort(settings.model, settings.effort)} effort
            </span>
            {isVisionModel(settings.model) && (
              <span className="rounded-md border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                Vision
              </span>
            )}
            <span className="rounded-md border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              {formatContextWindow(modelRuleFor(settings.model).contextWindow)}
              context
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Verbosity</CardTitle>
          <CardDescription>
            How much the agent says when it reports back.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Verbosity">
            {(
              [
                { id: "terse", label: "Terse", hint: "headlines only" },
                { id: "balanced", label: "Balanced", hint: "the default" },
                { id: "detailed", label: "Detailed", hint: "full evidence" },
              ] as { id: Verbosity; label: string; hint: string }[]
            ).map((v) => {
              const active = settings.verbosity === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setSettings({ verbosity: v.id });
                    pushToast("Verbosity updated", `${v.label} — ${v.hint}.`);
                  }}
                  className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    active
                      ? "border-primary/60 bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {v.label}
                  <span className="text-[10px] font-normal opacity-70">
                    {v.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ——— Models (FE2: the zcode ModelProviderSection, commerce) ———

const API_FORMAT_LABEL: Record<ModelApiFormat, string> = {
  "anthropic-messages": "Anthropic messages",
  "openai-chat-completions": "Chat completions (/v1/chat/completions)",
  "openai-responses": "Responses (/responses)",
};

const PROVIDER_STATUS_DOT: Record<ProviderStatus, string> = {
  ready: "bg-emerald-500",
  "not-ready": "bg-amber-500",
  disabled: "bg-muted-foreground/40",
};

const PROVIDER_STATUS_LABEL: Record<ProviderStatus, string> = {
  ready: "Ready",
  "not-ready": "Not ready",
  disabled: "Disabled",
};

function ProviderLogoTile({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-xs font-semibold"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ModelsTab() {
  const { settings, setSettings, pushToast } = useProduct();
  const [selectedId, setSelectedId] = useState(settings.models[0]?.id ?? "");
  const [addingProvider, setAddingProvider] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [modelDialog, setModelDialog] = useState<
    { mode: "add" } | { mode: "edit"; modelId: string } | null
  >(null);
  const [deleteProvider, setDeleteProvider] = useState<string | null>(null);

  const providers = settings.models;
  const selected =
    providers.find((p) => p.id === selectedId) ?? providers[0] ?? null;

  const persist = (next: ModelProviderConfig[]) =>
    setSettings({ models: next });

  const updateProvider = (id: string, patch: Partial<ModelProviderConfig>) =>
    persist(providers.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const setModelEnabled = (pid: string, mid: string, enabled: boolean) =>
    persist(
      providers.map((p) =>
        p.id === pid
          ? {
              ...p,
              models: p.models.map((m) =>
                m.id === mid ? { ...m, enabled } : m,
              ),
            }
          : p,
      ),
    );

  const testModel = (p: ModelProviderConfig, mid: string) => {
    const status = providerStatus(p);
    pushToast("Testing " + p.name + " / " + mid, "A connectivity probe…");
    window.setTimeout(() => {
      if (status === "ready") {
        pushToast(p.name + " / " + mid + " connected", "The probe came back clean.");
      } else {
        pushToast(
          "Failed to connect to " + p.name + " / " + mid,
          status === "disabled"
            ? "Enable the provider first."
            : "Set the API key first.",
        );
      }
    }, 600);
  };

  const addFromTemplate = (t: ProviderTemplate) => {
    const id = "p-" + Date.now().toString(36);
    const next = [...providers, providerFromTemplate(t, id)];
    persist(next);
    setSelectedId(id);
    setAddingProvider(false);
    pushToast(t.name + " added", "Configure its access to make it ready.");
  };

  const addCustomProvider = () => {
    const id = "p-" + Date.now().toString(36);
    const next: ModelProviderConfig[] = [
      ...providers,
      {
        id,
        name: "New provider",
        preset: false,
        access: "api-key",
        apiFormat: "openai-chat-completions",
        baseUrl: "",
        apiKey: "",
        enabled: true,
        models: [],
      },
    ];
    persist(next);
    setSelectedId(id);
    setAddingProvider(false);
    pushToast("New provider added", "Name it, point it at a Base URL, add models.");
  };

  const removeProvider = (id: string) => {
    const target = providers.find((p) => p.id === id);
    persist(providers.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(providers[0]?.id ?? "");
    setDeleteProvider(null);
    pushToast("Provider deleted", target?.name + " is off the workspace.");
  };

  const keyUrl = selected?.templateId
    ? templateById(selected.templateId)?.apiKeyManagementUrl
    : undefined;

  // ——— Add-provider template picker pane (zcode ProviderTemplatePicker) ———
  if (addingProvider) {
    const zhipu = PROVIDER_TEMPLATES.filter((t) => t.group === "Zhipu");
    const other = PROVIDER_TEMPLATES.filter((t) => t.group === "Other");
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="h-11 -ml-2 px-3"
          onClick={() => setAddingProvider(false)}
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to provider details
        </Button>
        <h3 className="text-base font-semibold">Add provider</h3>
        {[
          { label: "Zhipu", list: zhipu },
          { label: "Other", list: other },
        ].map((group) => (
          <section key={group.label} aria-label={group.label + " providers"}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {group.label}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.label === "Other" && (
                <button
                  type="button"
                  onClick={addCustomProvider}
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-8 items-center justify-center rounded-md border bg-muted/50">
                    <Plus aria-hidden className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">
                    Create custom provider
                  </span>
                </button>
              )}
              {group.list.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addFromTemplate(t)}
                  className="flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ProviderLogoTile name={t.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {t.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {t.models.length} models ·{" "}
                      {t.access === "coding-plan" ? "Coding Plan" : "API key"}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // ——— The split panel ———
  return (
    <>
      {/* Default model — the picker ↔ settings bridge */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Default model</CardTitle>
          <CardDescription>
            New missions start with the default. Change it per mission in the
            composer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModelPicker
            value={{
              providerId: "",
              modelId: settings.model,
              effort: settings.effort,
            }}
            onChange={(v) => {
              setSettings({ model: v.modelId, effort: v.effort });
              pushToast(
                "Default model set",
                v.modelId + " · " + effectiveEffort(v.modelId, v.effort) + " effort.",
              );
            }}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-semibold">Providers</p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label="Refresh model settings"
              onClick={() =>
                pushToast(
                  "Model settings refreshed",
                  "Read back from the workspace record.",
                )
              }
            >
              <RefreshCw aria-hidden className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setAddingProvider(true)}
            >
              <Plus aria-hidden className="h-4 w-4" />
              Add provider
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-[224px_minmax(0,1fr)]">
          {/* Rail */}
          <div
            className={`max-h-[26rem] overflow-y-auto border-b bg-muted/20 p-2 md:max-h-[36rem] md:border-b-0 md:border-r ${THIN_SCROLL}`}
            role="listbox"
            aria-label="Model providers"
          >
            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Providers
            </p>
            {providers
              .filter((p) => p.preset)
              .map((p) => (
                <ProviderRailRow
                  key={p.id}
                  provider={p}
                  active={selected?.id === p.id}
                  onSelect={() => setSelectedId(p.id)}
                />
              ))}
            {providers.some((p) => !p.preset) && (
              <>
                <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Custom providers
                </p>
                {providers
                  .filter((p) => !p.preset)
                  .map((p) => (
                    <ProviderRailRow
                      key={p.id}
                      provider={p}
                      active={selected?.id === p.id}
                      onSelect={() => setSelectedId(p.id)}
                    />
                  ))}
              </>
            )}
          </div>

          {/* Detail */}
          <div
            className={`max-h-[36rem] overflow-y-auto p-4 sm:p-5 ${THIN_SCROLL}`}
          >
            {selected ? (
              <ProviderDetail
                provider={selected}
                showKey={showKey}
                onToggleShowKey={() => setShowKey((v) => !v)}
                onRename={(name) => updateProvider(selected.id, { name })}
                onToggleEnabled={(enabled) =>
                  updateProvider(selected.id, { enabled })
                }
                onChange={(patch) => updateProvider(selected.id, patch)}
                onModelEnabled={(mid, enabled) =>
                  setModelEnabled(selected.id, mid, enabled)
                }
                onTest={testModel}
                onEditModel={(mid) => setModelDialog({ mode: "edit", modelId: mid })}
                onAddModel={() => setModelDialog({ mode: "add" })}
                onDeleteModel={(mid) => {
                  updateProvider(selected.id, {
                    models: selected.models.filter((m) => m.id !== mid),
                  });
                  pushToast("Model removed", mid + " is off this provider.");
                }}
                onRequestDelete={() => setDeleteProvider(selected.id)}
                keyUrl={keyUrl}
              />
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No providers yet — add one to configure models.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Add / edit model dialog — remounts fresh per open (the 4-c law) */}
      {modelDialog && selected && (
        <ModelDialog
          key={
            modelDialog.mode === "edit" ? "edit-" + modelDialog.modelId : "add"
          }
          dialog={modelDialog}
          provider={selected}
          onClose={() => setModelDialog(null)}
          onSave={(mid, rule) => {
            const exists = selected.models.some((m) => m.id === mid);
            const models = exists
              ? selected.models.map((m) => (m.id === mid ? { ...m } : m))
              : [...selected.models, { id: mid, enabled: true }];
            // edit persists capability overrides by keeping the id; the catalog
            // rule stays the source of truth for badges.
            persist(
              providers.map((p) =>
                p.id === selected.id ? { ...p, models } : p,
              ),
            );
            pushToast(
              exists ? "Model settings saved" : "Model added",
              mid + " · " + formatContextWindow(rule.contextWindow) + " context.",
            );
            setModelDialog(null);
          }}
        />
      )}

      {/* Delete provider confirm — zcode verbatim */}
      <AlertDialog
        open={deleteProvider !== null}
        onOpenChange={(v) => !v && setDeleteProvider(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete provider "{providers.find((p) => p.id === deleteProvider)?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the custom provider configuration. Related edits on
              the current settings page will not be restored automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteProvider && removeProvider(deleteProvider)}
            >
              Delete provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProviderRailRow({
  provider,
  active,
  onSelect,
}: {
  provider: ModelProviderConfig;
  active: boolean;
  onSelect: () => void;
}) {
  const status = providerStatus(provider);
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? "bg-accent" : "hover:bg-accent/50"
      }`}
    >
      <ProviderLogoTile name={provider.name} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {provider.name}
      </span>
      <span
        aria-hidden
        title={PROVIDER_STATUS_LABEL[status]}
        className={`size-2 shrink-0 rounded-full ${PROVIDER_STATUS_DOT[status]}`}
      />
    </button>
  );
}

function ProviderDetail({
  provider,
  showKey,
  onToggleShowKey,
  onRename,
  onToggleEnabled,
  onChange,
  onModelEnabled,
  onTest,
  onEditModel,
  onAddModel,
  onDeleteModel,
  onRequestDelete,
  keyUrl,
}: {
  provider: ModelProviderConfig;
  showKey: boolean;
  onToggleShowKey: () => void;
  onRename: (name: string) => void;
  onToggleEnabled: (v: boolean) => void;
  onChange: (patch: Partial<ModelProviderConfig>) => void;
  onModelEnabled: (mid: string, enabled: boolean) => void;
  onTest: (p: ModelProviderConfig, mid: string) => void;
  onEditModel: (mid: string) => void;
  onAddModel: () => void;
  onDeleteModel: (mid: string) => void;
  onRequestDelete: () => void;
  keyUrl?: string;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(provider.name);
  const template = provider.templateId
    ? templateById(provider.templateId)
    : undefined;
  const catalogIds = new Set(template?.models ?? []);

  return (
    <div className="space-y-5">
      {/* Header: name + enable + kebab */}
      <div className="flex flex-wrap items-center gap-3">
        <ProviderLogoTile name={provider.name} />
        {editingName ? (
          <Input
            value={nameDraft}
            autoFocus
            aria-label="Provider name"
            className="h-11 w-56 font-medium"
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                onRename(nameDraft.trim() || provider.name);
                setEditingName(false);
              }
              if (e.key === "Escape") setEditingName(false);
            }}
            onBlur={() => {
              onRename(nameDraft.trim() || provider.name);
              setEditingName(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!provider.preset) {
                setNameDraft(provider.name);
                setEditingName(true);
              }
            }}
            className="rounded-md px-1 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={provider.preset ? provider.name : "Rename provider"}
          >
            {provider.name}
          </button>
        )}
        <span
          className={`ml-auto flex items-center gap-2 text-xs ${provider.enabled ? "text-muted-foreground" : "text-muted-foreground"}`}
        >
          <Switch
            id={"provider-enabled-" + provider.id}
            checked={provider.enabled}
            onCheckedChange={onToggleEnabled}
            aria-label={provider.enabled ? "Disable provider" : "Enable provider"}
          />
          <label
            htmlFor={"provider-enabled-" + provider.id}
            className="cursor-pointer"
          >
            {provider.enabled ? "Enabled" : "Disabled"}
          </label>
        </span>
        {!provider.preset && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label="Provider actions"
              >
                <EllipsisVertical aria-hidden className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setNameDraft(provider.name);
                  setEditingName(true);
                }}
              >
                <Pencil aria-hidden className="h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={onRequestDelete}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Connection */}
      <section aria-label="Connection" className="space-y-3">
        <h4 className="text-sm font-semibold">Connection</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={"baseurl-" + provider.id}>Base URL</Label>
            {provider.preset ? (
              <p className="flex min-h-11 items-center gap-2 rounded-md border bg-muted/40 px-3 font-mono text-xs text-muted-foreground">
                <Lock aria-hidden className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{provider.baseUrl}</span>
                <span className="shrink-0">(read only)</span>
              </p>
            ) : (
              <Input
                id={"baseurl-" + provider.id}
                value={provider.baseUrl}
                placeholder="https://api.example.com/v1"
                className="h-11 font-mono text-xs"
                onChange={(e) => onChange({ baseUrl: e.target.value })}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={"apiformat-" + provider.id}>API format</Label>
            <Select
              value={provider.apiFormat}
              onValueChange={(v) => onChange({ apiFormat: v as ModelApiFormat })}
            >
              <SelectTrigger id={"apiformat-" + provider.id} className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(API_FORMAT_LABEL) as ModelApiFormat[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {API_FORMAT_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Access */}
      <section aria-label="Access" className="space-y-3">
        <h4 className="text-sm font-semibold">Access</h4>
        {provider.access === "coding-plan" ? (
          <div className="rounded-lg border bg-accent/40 p-3 text-sm">
            Coding Plan connected — GLM-5.3 and GLM-5.3-Flash included.
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={"apikey-" + provider.id}>API key</Label>
              {keyUrl && (
                <a
                  href={keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Get API key
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <div className="relative">
              <Input
                id={"apikey-" + provider.id}
                type={showKey ? "text" : "password"}
                value={provider.apiKey}
                placeholder="Enter API key"
                className="h-11 pr-12 font-mono text-xs"
                onChange={(e) => onChange({ apiKey: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 size-9"
                aria-label={showKey ? "Hide API key" : "Show API key"}
                onClick={onToggleShowKey}
              >
                {showKey ? (
                  <EyeOff aria-hidden className="h-4 w-4" />
                ) : (
                  <Eye aria-hidden className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Stored in this workspace only — never rendered in evidence.
            </p>
          </div>
        )}
      </section>

      {/* Model list */}
      <section aria-label="Model list" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Model list</h4>
          <Button variant="outline" className="h-11" onClick={onAddModel}>
            <Plus aria-hidden className="h-4 w-4" />
            Add model
          </Button>
        </div>
        {provider.models.length === 0 ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-dashed p-4">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No models are configured. Add a model to use it in missions.
            </p>
          </div>
        ) : (
          <ul
            className={`max-h-[26rem] divide-y overflow-y-auto rounded-xl border ${THIN_SCROLL}`}
          >
            {provider.models.map((m) => {
              const rule = modelRuleFor(m.id);
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium">
                    {m.id}
                  </span>
                  <span
                    title={"Context window: " + formatContextWindow(rule.contextWindow)}
                    className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {formatContextWindow(rule.contextWindow)}
                  </span>
                  {isVisionModel(m.id) && (
                    <span className="flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <Eye aria-hidden className="h-3 w-3" />
                      Vision
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={"Test " + m.id}
                    title="Test model"
                    onClick={() => onTest(provider, m.id)}
                  >
                    <Unplug aria-hidden className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={"Edit " + m.id}
                    title="Edit model settings"
                    onClick={() => onEditModel(m.id)}
                  >
                    <Pencil aria-hidden className="h-4 w-4" />
                  </Button>
                  {!catalogIds.has(m.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 text-destructive hover:text-destructive"
                      aria-label={"Delete " + m.id}
                      title="Delete"
                      onClick={() => onDeleteModel(m.id)}
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </Button>
                  )}
                  <Switch
                    id={"model-enabled-" + provider.id + "-" + m.id}
                    checked={m.enabled}
                    onCheckedChange={(v) => onModelEnabled(m.id, v)}
                    aria-label={m.enabled ? "Disable" : "Enable"}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/** The Add/Edit model dialog — zcode's Smart configuration, commerce. */
function ModelDialog({
  dialog,
  provider,
  onClose,
  onSave,
}: {
  dialog: { mode: "add" } | { mode: "edit"; modelId: string };
  provider: ModelProviderConfig | null;
  onClose: () => void;
  onSave: (modelId: string, rule: CatalogModel) => void;
}) {
  const [smart, setSmart] = useState(true);
  const [modelId, setModelId] = useState(
    dialog.mode === "edit" ? dialog.modelId : "",
  );
  const seed = modelId ? modelRuleFor(modelId) : null;
  const [contextWindow, setContextWindow] = useState(
    seed ? String(seed.contextWindow) : "",
  );
  const [maxOutput, setMaxOutput] = useState(
    seed ? String(seed.maxOutputTokens) : "",
  );
  const [inputs, setInputs] = useState<ModelInput[]>(
    seed ? seed.inputs : ["text"],
  );
  const [caps, setCaps] = useState<string[]>(
    seed?.supportsToolCall ? ["Tool calls"] : [],
  );
  const [levels, setLevels] = useState(
    seed ? seed.reasoning.join(", ") : "",
  );
  const [error, setError] = useState("");
  const [matched, setMatched] = useState(
    !!modelId && CATALOG_MODELS[modelId] !== undefined,
  );

  if (!provider) return null;

  const applySmart = (id: string) => {
    setModelId(id);
    if (!smart) return;
    const rule = modelRuleFor(id);
    setContextWindow(String(rule.contextWindow));
    setMaxOutput(String(rule.maxOutputTokens));
    setInputs(rule.inputs);
    setCaps(rule.supportsToolCall ? ["Tool calls"] : []);
    setLevels(rule.reasoning.join(", "));
    setMatched(CATALOG_MODELS[id] !== undefined);
  };

  const save = () => {
    const id = modelId.trim();
    if (!id) {
      setError("Model ID is required");
      return;
    }
    const ctx = Number(contextWindow);
    if (!Number.isFinite(ctx) || ctx <= 0 || !Number.isInteger(ctx)) {
      setError("Context window must be a positive integer");
      return;
    }
    const out = Number(maxOutput);
    if (!Number.isFinite(out) || out <= 0 || !Number.isInteger(out)) {
      setError("Max output tokens must be a positive integer");
      return;
    }
    onSave(id, { ...modelRuleFor(id), contextWindow: ctx, maxOutputTokens: out });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {dialog.mode === "edit" ? "Edit model settings" : "Add model"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit the context window for this model.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SwitchRow
            id="smart-config"
            label="Smart configuration"
            helper="Matches recommended configuration using the model ID, Base URL, and API format. When you manually change a setting, that setting becomes manually managed."
            checked={smart}
            onCheckedChange={(v) => setSmart(v)}
          />
          {matched && smart && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles aria-hidden className="h-3 w-3" />
              Smart configuration matched for this model
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="model-id">Model ID</Label>
            <Input
              id="model-id"
              value={modelId}
              placeholder="e.g. GLM-4.6"
              className="h-11 font-mono text-xs"
              readOnly={dialog.mode === "edit"}
              onChange={(e) => applySmart(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="model-ctx">Context window</Label>
              <Input
                id="model-ctx"
                value={contextWindow}
                inputMode="numeric"
                placeholder="200000"
                className="h-11 font-mono text-xs"
                onChange={(e) => {
                  setSmart(false);
                  setContextWindow(e.target.value.replace(/[^0-9]/g, ""));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model-out">Max output tokens</Label>
              <Input
                id="model-out"
                value={maxOutput}
                inputMode="numeric"
                placeholder="131072"
                className="h-11 font-mono text-xs"
                onChange={(e) => {
                  setSmart(false);
                  setMaxOutput(e.target.value.replace(/[^0-9]/g, ""));
                }}
              />
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="min-h-11 text-sm font-medium text-primary hover:underline">
              Advanced settings
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Input types</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["text", "image", "video", "audio", "pdf"] as ModelInput[]).map(
                    (t) => {
                      const on = inputs.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={on}
                          disabled={t === "text"}
                          onClick={() =>
                            setInputs(
                              on
                                ? inputs.filter((x) => x !== t)
                                : [...inputs, t],
                            )
                          }
                          className={`min-h-11 rounded-full border px-3.5 text-sm capitalize transition-colors ${
                            on
                              ? "border-primary/40 bg-accent font-medium text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent/50"
                          } ${t === "text" ? "opacity-70" : ""}`}
                        >
                          {t}
                          {t === "text" && " (required)"}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Model capabilities</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Tool calls",
                    "Structured output",
                    "Native web search",
                    "Mid-conversation system messages",
                  ].map((c) => {
                    const on = caps.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setCaps(on ? caps.filter((x) => x !== c) : [...caps, c])
                        }
                        className={`min-h-11 rounded-full border px-3.5 text-sm transition-colors ${
                          on
                            ? "border-primary/40 bg-accent font-medium text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/50"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model-levels">
                  Reasoning levels (low to high)
                </Label>
                <Input
                  id="model-levels"
                  value={levels}
                  placeholder="disabled, enabled"
                  className="h-11 font-mono text-xs"
                  onChange={(e) => {
                    setSmart(false);
                    setLevels(e.target.value);
                  }}
                />
                {levels.trim() && (
                  <p className="flex flex-wrap gap-1.5 pt-1">
                    {levels
                      .split(",")
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .map((l) => (
                        <span
                          key={l}
                          className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {l}
                        </span>
                      ))}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => {
              const id = dialog.mode === "edit" ? dialog.modelId : "";
              const rule = id ? modelRuleFor(id) : null;
              setModelId(id);
              setSmart(true);
              setContextWindow(rule ? String(rule.contextWindow) : "");
              setMaxOutput(rule ? String(rule.maxOutputTokens) : "");
              setInputs(rule ? rule.inputs : ["text"]);
              setCaps(rule?.supportsToolCall ? ["Tool calls"] : []);
              setLevels(rule ? rule.reasoning.join(", ") : "");
              setError("");
            }}
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            Reset form
          </Button>
          <Button variant="outline" className="h-11" onClick={onClose}>
            Cancel
          </Button>
          <Button className="h-11" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——— Usage (FE2: honest, live-derived from the workspace record) ———

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function UsageTab() {
  const watchEvents = useProduct((s) => s.watchEvents);
  const missions = useProduct((s) => s.missions);
  const resolved = useProduct((s) => s.resolved);
  const chat = useProduct((s) => s.chat);
  const skills = useProduct((s) => s.skills);
  const settings = useProduct((s) => s.settings);

  // 8 weeks × 7 days of event counts (createdAt day buckets, oldest → newest).
  const days = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of watchEvents) {
      if (!e.createdAt) continue; // undated demo seeds never paint the record
      const d = new Date(e.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      counts.set(d.toISOString().slice(0, 10), (counts.get(d.toISOString().slice(0, 10)) ?? 0) + 1);
    }
    const out: { key: string; label: string; count: number }[] = [];
    const today = new Date();
    for (let i = 55; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        key,
        label: WEEKDAYS[d.getUTCDay()],
        count: counts.get(key) ?? 0,
      });
    }
    return out;
  }, [watchEvents]);

  const max = Math.max(...days.map((d) => d.count), 1);
  const busiest = days.reduce(
    (best, d) => (d.count > best.count ? d : best),
    { label: "", count: 0 } as { label: string; count: number },
  );
  const approved = resolved.filter((r) => r.verdict === "approved").length;
  const declined = resolved.length - approved;
  const running = missions.filter((m) => m.status === "running").length;
  const actorCounts = new Map<string, number>();
  for (const e of watchEvents) {
    actorCounts.set(e.actor, (actorCounts.get(e.actor) ?? 0) + 1);
  }
  const topActor = [...actorCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const enabledModels = settings.models.reduce(
    (n, p) => n + (p.enabled ? p.models.filter((m) => m.enabled).length : 0),
    0,
  );

  const tiles: { label: string; value: string; hint?: string }[] = [
    {
      label: "Busiest day",
      value: busiest.count > 0 ? busiest.label : "—",
      hint:
        busiest.count > 0 ? `about ${busiest.count} events` : "no events yet",
    },
    {
      label: "Missions run",
      value: String(missions.length),
      hint: `${running} running`,
    },
    {
      label: "Decisions handled",
      value: String(resolved.length),
      hint: `${approved} approved · ${declined} declined`,
    },
    { label: "Chat turns", value: String(chat.length), hint: "with the agent" },
    {
      label: "Most active actor",
      value: topActor ? topActor[0] : "—",
      hint: topActor ? `${topActor[1]} events` : "the record starts with the first",
    },
    {
      label: "Skills on watch",
      value: String(skills.length),
      hint: "capability packs installed",
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mission activity</CardTitle>
          <CardDescription>
            Built from the local ring record.{" "}
            {busiest.count > 0 &&
              `The busiest day was ${busiest.label}, with about ${busiest.count} events.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="img"
            aria-label="Watch events per day over the last eight weeks"
            className="grid grid-flow-col grid-rows-7 gap-1"
          >
            {days.map((d) => (
              <span
                key={d.key}
                title={`${d.key} · ${d.count} event${d.count === 1 ? "" : "s"}`}
                className={`size-4 rounded-[3px] border ${
                  d.count === 0
                    ? "bg-muted/50"
                    : d.count / max > 0.66
                      ? "bg-primary/70"
                      : d.count / max > 0.33
                        ? "bg-primary/40"
                        : "bg-primary/15"
                }`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Less</span>
            <span className="size-3 rounded-[3px] bg-muted/50" />
            <span className="size-3 rounded-[3px] bg-primary/15" />
            <span className="size-3 rounded-[3px] bg-primary/40" />
            <span className="size-3 rounded-[3px] bg-primary/70" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.label}
              </p>
              <p className="mt-1.5 truncate font-mono text-lg font-semibold">
                {t.value}
              </p>
              {t.hint && (
                <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Model access</CardTitle>
          <CardDescription>
            The workspace's current model posture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
              Coding Plan · Z.ai
            </span>
            <span className="rounded-md border bg-muted/50 px-3 py-1.5 font-mono text-xs">
              default {settings.model}
            </span>
            <span className="rounded-md border bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground">
              {effectiveEffort(settings.model, settings.effort)} effort
            </span>
            <span className="rounded-md border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              {enabledModels} models enabled across{" "}
              {settings.models.filter((p) => p.enabled).length} providers
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Quota syncing lands with the billing connector — nothing is
            estimated here.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

// ——— Permissions ———

function PermissionsTab() {
  const { settings, setPermission } = useProduct();

  return (
    <>
      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">The approval matrix.</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              <span className="font-mono text-primary">auto</span> — the agent
              acts alone, evidence logged.{" "}
              <span className="font-mono text-primary">ask</span> — it packs a
              decision and waits for your checkbox.{" "}
              <span className="font-mono text-primary">block</span> — never,
              even if you ask mid-mission.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {/* header row */}
            <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,96px)] items-center border-b bg-muted/50">
              <p className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Family
              </p>
              {PERMISSION_POLICIES.map((p) => (
                <p
                  key={p.id}
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {p.label}
                </p>
              ))}
            </div>
            {/* family rows — each row is one RadioGroup so the three cells
                behave as a proper radio set */}
            {PERMISSION_FAMILIES.map((f) => (
              <RadioGroup
                key={f.id}
                value={settings.permissions[f.id]}
                onValueChange={(v) =>
                  setPermission(f.id, v as PermissionPolicy)
                }
                className="grid grid-cols-[minmax(0,1fr)_repeat(3,96px)] items-stretch border-b last:border-b-0"
                aria-label={f.label}
              >
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {f.description}
                  </p>
                </div>
                {PERMISSION_POLICIES.map((p) => {
                  const active = settings.permissions[f.id] === p.id;
                  return (
                    <label
                      key={p.id}
                      htmlFor={`perm-${f.id}-${p.id}`}
                      className={`flex min-h-11 cursor-pointer items-center justify-center border-l transition-colors ${
                        active
                          ? "bg-primary/[0.08]"
                          : "hover:bg-accent"
                      }`}
                    >
                      <RadioGroupItem
                        value={p.id}
                        id={`perm-${f.id}-${p.id}`}
                        className={active ? "" : "opacity-60"}
                      />
                      <span className="sr-only">
                        {p.label} — {p.hint}
                      </span>
                    </label>
                  );
                })}
              </RadioGroup>
            ))}
          </div>
        </div>
      </Card>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Store reads default to auto — watching is the whole point. Everything
        that touches money or customers defaults to ask. That&apos;s the
        contract: autonomy where it&apos;s safe, a checkbox where it isn&apos;t.
      </p>
    </>
  );
}

// ——— Automations ———

function AutomationsTab() {
  const { settings, toggleAutomation } = useProduct();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Scheduled sweeps</CardTitle>
            <CardDescription>
              Each one wakes a skill on a clock. Evidence lands in the watch
              feed either way.
            </CardDescription>
          </div>
          <Button className="h-11" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New automation
          </Button>
        </CardHeader>
        <CardContent
          className={`max-h-96 space-y-1.5 overflow-y-auto pr-1 ${THIN_SCROLL}`}
        >
          {settings.automations.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No automations yet — schedule a skill sweep and let the night
              shift do itself.
            </p>
          )}
          {settings.automations.map((a) => (
            <div
              key={a.id}
              className="flex min-h-11 items-center gap-3 rounded-lg border bg-card px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-muted-foreground">
                  <span className="text-primary">{a.schedule}</span>
                  <span>· {a.stores.length} store{a.stores.length === 1 ? "" : "s"}</span>
                  <span>· {a.skill}</span>
                </p>
              </div>
              <Switch
                id={`auto-${a.id}`}
                checked={a.enabled}
                onCheckedChange={() => toggleAutomation(a.id)}
                aria-label={`${a.name} schedule toggle`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <NewAutomationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function NewAutomationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addAutomation, stores, skills } = useProduct();
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState(AUTOMATION_SCHEDULES[0]);
  const [picked, setPicked] = useState<string[]>([]);
  const [skill, setSkill] = useState(skills[0]?.id ?? "");

  const reset = () => {
    setName("");
    setSchedule(AUTOMATION_SCHEDULES[0]);
    setPicked([]);
    setSkill(skills[0]?.id ?? "");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New automation</DialogTitle>
          <DialogDescription>
            A skill, a clock, and the stores it sweeps. You can pause it any
            time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="auto-name" className="text-xs font-medium">
              Name
            </Label>
            <Input
              id="auto-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning price sweep"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auto-schedule" className="text-xs font-medium">
              Schedule
            </Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger id="auto-schedule" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTOMATION_SCHEDULES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-medium">Stores</legend>
            {stores.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No stores connected.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stores.map((s) => (
                  <ToggleChip
                    key={s.id}
                    pressed={picked.includes(s.id)}
                    onClick={() =>
                      setPicked((p) =>
                        p.includes(s.id)
                          ? p.filter((x) => x !== s.id)
                          : [...p, s.id],
                      )
                    }
                  >
                    <span
                      className={`font-mono text-xs font-bold ${platformOf(s.platform).tint}`}
                      aria-hidden
                    >
                      {platformOf(s.platform).glyph}
                    </span>
                    {s.name}
                  </ToggleChip>
                ))}
              </div>
            )}
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="auto-skill" className="text-xs font-medium">
              Skill
            </Label>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger id="auto-skill" className="w-full">
                <SelectValue placeholder="Pick a skill" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((sk) => (
                  <SelectItem key={sk.id} value={sk.id}>
                    {sk.glyph} {sk.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || picked.length === 0 || !skill}
            onClick={() => {
              addAutomation({
                name: name.trim(),
                schedule,
                stores: picked,
                skill,
              });
              reset();
              onOpenChange(false);
            }}
          >
            Create automation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——— Commands ———

function CommandsTab() {
  const { settings, toggleCommand } = useProduct();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Slash palette</CardTitle>
            <CardDescription>
              Type the name in the Commander chat; the body is the real prompt
              the agent expands.
            </CardDescription>
          </div>
          <Button className="h-11" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New command
          </Button>
        </CardHeader>
        <CardContent
          className={`grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 ${THIN_SCROLL}`}
        >
          {settings.commands.map((c) => (
            <div
              key={c.id}
              className="flex min-h-11 flex-col rounded-lg border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-primary">
                  {c.name}
                </p>
                <Switch
                  id={`cmd-${c.id}`}
                  checked={c.enabled}
                  onCheckedChange={() => toggleCommand(c.id)}
                  aria-label={`${c.name} command toggle`}
                />
              </div>
              <p className="mt-1 text-xs leading-snug text-foreground/80">
                {c.description}
              </p>
              <Collapsible className="mt-2">
                <CollapsibleTrigger className="flex min-h-11 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Prompt body
                  <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="mt-1.5 whitespace-pre-wrap rounded-md border bg-muted/50 p-2.5 font-mono text-[11px] leading-relaxed text-foreground/80">
                    {c.body}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </CardContent>
      </Card>

      <NewCommandDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function NewCommandDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addCommand } = useProduct();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");

  const reset = () => {
    setName("");
    setDescription("");
    setBody("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New command</DialogTitle>
          <DialogDescription>
            A short name for the palette, and the real prompt body behind it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cmd-name" className="text-xs font-medium">
              Name
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-primary">/</span>
              <Input
                id="cmd-name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value.replace(/^\/+/, "").replace(/\s+/g, "-"))
                }
                placeholder="restock-report"
                className="font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              The slash is added for you — you&apos;re writing{" "}
              <span className="font-mono">/{name || "name"}</span>.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cmd-desc" className="text-xs font-medium">
              Description
            </Label>
            <Input
              id="cmd-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One line, shown in the palette"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cmd-body" className="text-xs font-medium">
              Prompt body
            </Label>
            <Textarea
              id="cmd-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="The full instruction the agent expands when the command fires…"
              rows={5}
              className="font-mono text-[12px]"
            />
            <p className="text-[11px] text-muted-foreground">
              <span className="font-mono">{"{stores}"}</span> is replaced with
              the stores in scope at call time.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || !body.trim()}
            onClick={() => {
              addCommand({
                name,
                description: description.trim() || "Custom command",
                body: body.trim(),
              });
              reset();
              onOpenChange(false);
            }}
          >
            Create command
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——— Hooks ———

function HooksTab() {
  const { settings, toggleHook } = useProduct();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">When → does</CardTitle>
            <CardDescription>
              Guarantees bolted onto the agent loop — they run before/after
              the named event, no matter which skill fired it.
            </CardDescription>
          </div>
          <Button className="h-11" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New hook
          </Button>
        </CardHeader>
        <CardContent
          className={`max-h-96 space-y-1.5 overflow-y-auto pr-1 ${THIN_SCROLL}`}
        >
          {settings.hooks.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No hooks armed — the agent loop runs bare.
            </p>
          )}
          {settings.hooks.map((h) => (
            <div
              key={h.id}
              className="flex min-h-11 items-center gap-3 rounded-lg border bg-card px-3 py-2"
            >
              <span className="shrink-0 rounded-full border border-primary/40 bg-primary/[0.06] px-2.5 py-1 font-mono text-[10px] text-primary">
                {h.event}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                →
              </span>
              <p className="min-w-0 flex-1 truncate text-xs text-foreground/85">
                {h.action}
              </p>
              <Switch
                id={`hook-${h.id}`}
                checked={h.enabled}
                onCheckedChange={() => toggleHook(h.id)}
                aria-label={`Hook on ${h.event} toggle`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <NewHookDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function NewHookDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addHook } = useProduct();
  const [event, setEvent] = useState(HOOK_EVENTS[0]);
  const [action, setAction] = useState("");

  const reset = () => {
    setEvent(HOOK_EVENTS[0]);
    setAction("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New hook</DialogTitle>
          <DialogDescription>
            Pick the moment, name the guarantee. Hooks fire every time —
            that&apos;s the point.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hook-event" className="text-xs font-medium">
              When
            </Label>
            <Select value={event} onValueChange={setEvent}>
              <SelectTrigger id="hook-event" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOOK_EVENTS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hook-action" className="text-xs font-medium">
              Does
            </Label>
            <Input
              id="hook-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. attach margin evidence to the decision"
            />
            <p className="text-[11px] text-muted-foreground">
              One clear instruction, present tense — “attach”, “log”,
              “notify”.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!action.trim()}
            onClick={() => {
              addHook({ event, action: action.trim() });
              reset();
              onOpenChange(false);
            }}
          >
            Arm hook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——— MCP ———

const MCP_STATUS: Record<
  "connected" | "idle" | "error",
  { dot: string; text: string; label: string }
> = {
  connected: {
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "connected",
  },
  idle: {
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    label: "idle",
  },
  error: {
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    label: "error",
  },
};

function McpTab() {
  const { settings, reconnectMcp, toggleMcp } = useProduct();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Tool servers</CardTitle>
            <CardDescription>
              Model Context Protocol servers — each one is a set of tools the
              agent may call, scoped to the stores you name.
            </CardDescription>
          </div>
          <Button className="h-11" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add server
          </Button>
        </CardHeader>
        <CardContent
          className={`grid max-h-96 gap-3 overflow-y-auto pr-1 md:grid-cols-2 ${THIN_SCROLL}`}
        >
          {settings.mcp.map((srv) => {
            const st = MCP_STATUS[srv.status];
            return (
              <div
                key={srv.id}
                className={`flex flex-col rounded-lg border bg-card p-3 ${
                  srv.status === "error" ? "border-red-500/40" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-mono text-sm font-medium">
                    {srv.name}
                  </p>
                  <span
                    className={`flex shrink-0 items-center gap-1.5 text-[10px] font-medium ${st.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${st.dot}`} aria-hidden />
                    {st.label}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {srv.tools} tool{srv.tools === 1 ? "" : "s"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {srv.scope.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground">
                      no stores in scope
                    </span>
                  ) : (
                    srv.scope.map((sid) => (
                      <Badge
                        key={sid}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {storeName(sid)}
                      </Badge>
                    ))
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  {srv.status === "error" ? (
                    <Button
                      variant="outline"
                      className="h-11 border-red-500/50 text-red-600 dark:text-red-400"
                      onClick={() => reconnectMcp(srv.id)}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Reconnect
                    </Button>
                  ) : (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      mcp · {srv.id}
                    </span>
                  )}
                  <Switch
                    id={`mcp-${srv.id}`}
                    checked={srv.enabled}
                    onCheckedChange={() => toggleMcp(srv.id)}
                    aria-label={`${srv.name} server toggle`}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AddMcpDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function AddMcpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addMcpServer, stores } = useProduct();
  const [name, setName] = useState("");
  const [scope, setScope] = useState<string[]>([]);

  const reset = () => {
    setName("");
    setScope([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add MCP server</DialogTitle>
          <DialogDescription>
            Register a server by name — it lands idle until the first
            handshake, then the tool count fills in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mcp-name" className="text-xs font-medium">
              Server name
            </Label>
            <Input
              id="mcp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. squarespace-mcp"
              className="font-mono"
            />
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-medium">
              Scope <span className="text-muted-foreground">(optional)</span>
            </legend>
            {stores.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No stores connected — the server starts unscoped.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stores.map((s) => (
                  <ToggleChip
                    key={s.id}
                    pressed={scope.includes(s.id)}
                    onClick={() =>
                      setScope((p) =>
                        p.includes(s.id)
                          ? p.filter((x) => x !== s.id)
                          : [...p, s.id],
                      )
                    }
                  >
                    {s.name}
                  </ToggleChip>
                ))}
              </div>
            )}
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              addMcpServer(name.trim(), scope);
              reset();
              onOpenChange(false);
            }}
          >
            Add server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——— Computer use ———

function ComputerTab() {
  const { settings, setComputerUse, pushToast } = useProduct();
  const cu = settings.computerUse;
  const [domain, setDomain] = useState("");

  const addDomain = () => {
    const d = domain.trim().toLowerCase();
    if (!d || !cu.enabled) return;
    if (cu.allowedDomains.includes(d)) {
      pushToast("Already allowed", `${d} is on the list.`);
      return;
    }
    setComputerUse({ allowedDomains: [...cu.allowedDomains, d] });
    setDomain("");
    pushToast("Domain allowed", `${d} — the agent may browse it.`);
  };

  return (
    <>
      <Card
        className={
          cu.enabled
            ? "border-primary/50 bg-primary/[0.04]"
            : "border-dashed"
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MonitorSmartphone className="h-4 w-4 text-primary" />
              Computer use
            </CardTitle>
            <Switch
              id="cu-master"
              checked={cu.enabled}
              onCheckedChange={(v) => {
                setComputerUse({ enabled: v });
                pushToast(
                  v ? "Computer use armed" : "Computer use disarmed",
                  v
                    ? "The agent may browse the allowed domains — headless, evidence-screened."
                    : "Off means the agent never touches a browser. Full stop.",
                );
              }}
              aria-label="Computer use master switch"
            />
          </div>
          <CardDescription>
            The fence around the browser. While this is off, the agent
            never touches a browser — even if a task looks like it needs one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div
            className={`space-y-1 ${cu.enabled ? "" : "pointer-events-none opacity-50"}`}
          >
            <SwitchRow
              id="cu-headless"
              label="Headless mode"
              helper="Runs the browser invisibly — no window, same evidence."
              checked={cu.headless}
              onCheckedChange={(v) => {
                setComputerUse({ headless: v });
                pushToast(
                  v ? "Headless on" : "Headless off",
                  v
                    ? "The browser runs invisible — nothing appears on your screen."
                    : "A visible browser window opens when the agent browses.",
                );
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Allowed domains
          </CardTitle>
          <CardDescription>
            The allow-list is the whole fence: nothing outside these domains
            ever loads, headless or not.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className={`space-y-3 ${cu.enabled ? "" : "pointer-events-none opacity-50"}`}
          >
            <div className="flex gap-2">
              <Input
                id="cu-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDomain();
                  }
                }}
                placeholder="admin.shopify.com"
                className="font-mono text-[13px]"
                aria-label="New allowed domain"
              />
              <Button
                variant="outline"
                onClick={addDomain}
                disabled={!cu.enabled}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Allow
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cu.allowedDomains.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Nothing allowed yet — with an empty list, computer use has
                  nowhere to go.
                </p>
              ) : (
                cu.allowedDomains.map((d) => (
                  <span
                    key={d}
                    className="flex min-h-11 items-center gap-1.5 rounded-full border bg-card py-1 pl-3 pr-1.5 font-mono text-[11px]"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => {
                        setComputerUse({
                          allowedDomains: cu.allowedDomains.filter(
                            (x) => x !== d,
                          ),
                        });
                        pushToast("Domain removed", `${d} is off the list.`);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Remove ${d}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
          {!cu.enabled && (
            <p className="rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
              Domain management is locked while computer use is off — flip the
              master switch above to edit the fence.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ——— Stores ———

function StoresTab() {
  const { stores, syncStore, reconnectStore, syncAllStores } = useProduct();
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Connection manager</CardTitle>
            <CardDescription>
              The same ring as the Stores section — sync, heal, or revoke,
              one row per store.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-11"
              variant="outline"
              onClick={syncAllStores}
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Sync all
            </Button>
            <Button className="h-11" onClick={() => setConnectOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Connect store
            </Button>
          </div>
        </CardHeader>
        <CardContent
          className={`max-h-96 space-y-1.5 overflow-y-auto pr-1 ${THIN_SCROLL}`}
        >
          {stores.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No stores connected — the ring is quiet. Connect one and the
              watch starts immediately.
            </p>
          )}
          {stores.map((s) => {
            const p = platformOf(s.platform);
            return (
              <div
                key={s.id}
                className="flex min-h-11 flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm font-semibold ${p.tint}`}
                  aria-hidden
                >
                  {p.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        s.health === "healthy"
                          ? "bg-primary"
                          : s.health === "syncing"
                            ? "bg-amber-500"
                            : "bg-destructive"
                      }`}
                      aria-hidden
                    />
                    {s.health} · synced {s.lastSync}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    className="h-11 w-11"
                    onClick={() => syncStore(s.id)}
                    aria-label={`Sync ${s.name}`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  {s.health !== "healthy" && (
                    <Button
                      variant="ghost"
                      className="h-11 w-11"
                      onClick={() => reconnectStore(s.id)}
                      aria-label={`Reconnect ${s.name}`}
                    >
                      <Plug className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <RevokeStoreDialog storeName={s.name} storeId={s.id} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </>
  );
}

function RevokeStoreDialog({
  storeName: name,
  storeId,
}: {
  storeName: string;
  storeId: string;
}) {
  const { revokeStore } = useProduct();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 w-11 text-destructive hover:text-destructive"
          aria-label={`Revoke ${name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Access tokens are destroyed and the store leaves the watch ring
            immediately. Its missions pause and its skills unplug. You can
            reconnect any time — the catalog re-syncs in about a minute.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep connected</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => revokeStore(storeId)}
          >
            Revoke access
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ——— Notifications ———

function NotificationsTab() {
  const { settings, setNotifications, pushToast } = useProduct();
  const n = settings.notifications;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">What reaches you</CardTitle>
        <CardDescription>
          Quiet by default, loud where it matters — the brief, the watch, and
          the decisions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="brief-time" className="text-xs font-medium">
            Today&apos;s brief lands at
          </Label>
          <Input
            id="brief-time"
            type="time"
            value={n.morningBriefTime}
            onChange={(e) =>
              setNotifications({ morningBriefTime: e.target.value })
            }
            onBlur={() =>
              pushToast(
                "Brief time set",
                `Today's brief now lands at ${n.morningBriefTime}.`,
              )
            }
            className="w-36 font-mono"
          />
        </div>
        <div className="divide-y">
          <SwitchRow
            id="ntf-brief"
            label="Today's brief"
            helper="The overnight report — checks, numbers, what needs you."
            checked={n.morningBriefEnabled}
            onCheckedChange={(v) => {
              setNotifications({ morningBriefEnabled: v });
              pushToast(
                v ? "Today's brief on" : "Today's brief off",
                v
                  ? `Lands daily at ${n.morningBriefTime}.`
                  : "No daily report — the watch still runs.",
              );
            }}
          />
          <SwitchRow
            id="ntf-watch"
            label="Watch digest"
            helper="A roll-up of the watch feed, batched so it never nags."
            checked={n.watchDigest}
            onCheckedChange={(v) => {
              setNotifications({ watchDigest: v });
              pushToast(
                v ? "Watch digest on" : "Watch digest off",
                v
                  ? "Anomalies and heals, batched into one line."
                  : "The watch feed stays in the app.",
              );
            }}
          />
          <SwitchRow
            id="ntf-decisions"
            label="Decision alerts"
            helper="The moment a decision packet lands on your desk."
            checked={n.decisionAlerts}
            onCheckedChange={(v) => {
              setNotifications({ decisionAlerts: v });
              pushToast(
                v ? "Decision alerts on" : "Decision alerts off",
                v
                  ? "You'll hear about every packet the second it's packed."
                  : "Decisions wait quietly in the queue.",
              );
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ——— Data & privacy ———

function DataTab() {
  const { settings, setDataSettings, pushToast } = useProduct();
  const d = settings.data;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Evidence retention</CardTitle>
          <CardDescription>
            How long the raw trail — watch events, run logs, diffs — stays
            hot before it rolls off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Evidence retention"
          >
            {(
              [
                { days: 30, label: "30 days", hint: "light" },
                { days: 60, label: "60 days", hint: "measured" },
                { days: 90, label: "90 days", hint: "deep archive" },
              ] as { days: number; label: string; hint: string }[]
            ).map((r) => {
              const active = d.retentionDays === r.days;
              return (
                <button
                  key={r.days}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setDataSettings({ retentionDays: r.days });
                    pushToast("Retention set", `${r.label} — ${r.hint}.`);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary/60 bg-primary/[0.06] ring-2 ring-primary/25"
                      : "hover:border-primary/40 hover:bg-accent"
                  }`}
                >
                  <p className="font-mono text-sm font-semibold">{r.label}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {r.hint}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Privacy</CardTitle>
          <CardDescription>
            The agent works for you, not for your customers&apos; data.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <SwitchRow
            id="pii-redaction"
            label="Redact customer PII in evidence"
            helper="Names, emails, and addresses are masked before anything is logged or shown."
            checked={d.piiRedaction}
            onCheckedChange={(v) => {
              setDataSettings({ piiRedaction: v });
              pushToast(
                v ? "PII redaction on" : "PII redaction off",
                v
                  ? "Evidence chips stay masked — keep this on unless you have a reason."
                  : "Raw customer data may appear in evidence. Careful here.",
              );
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Evidence export</CardTitle>
          <CardDescription>
            A signed bundle of everything the agent did — runs, diffs,
            decisions — packed for your records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="h-11"
            onClick={() =>
              pushToast(
                "Export queued",
                "Evidence bundle will land in your email.",
              )
            }
          >
            Export evidence bundle
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

// ——— Danger zone ———

function DangerTab() {
  const { pauseAllMissions, disconnectAllStores, resetWorkspace, missions } =
    useProduct();
  const running = missions.filter((m) => m.status === "running").length;

  return (
    <>
      <Card className="border-l-[3px] border-l-amber-500">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Pause all missions
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every running lane snaps to in-review and its mission drops to
              awaiting-you. Nothing acts until you release it.{" "}
              {running} running right now.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-11 shrink-0 border-amber-500/50 text-amber-700 dark:text-amber-400"
              >
                Pause everything
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Pause all missions?</AlertDialogTitle>
                <AlertDialogDescription>
                  All {running} running mission{running === 1 ? "" : "s"} pull
                  back to awaiting-your-approval. Workers stop mid-lane;
                  evidence so far is kept. You release them one by one.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Never mind</AlertDialogCancel>
                <AlertDialogAction
                  className="border-amber-500/50 bg-amber-500 text-amber-950 hover:bg-amber-500/90"
                  onClick={pauseAllMissions}
                >
                  Pause everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Unplug className="h-4 w-4 text-destructive" />
              Disconnect all stores
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tokens destroyed across the whole ring. The watch goes quiet,
              skills unplug, missions pause.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-11 shrink-0 border-destructive/50 text-destructive hover:text-destructive"
              >
                Disconnect all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Disconnect every store?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  All access tokens are destroyed immediately. The watch ring
                  empties, installed skills stay configured but idle.
                  Reconnecting re-syncs each catalog in about a minute.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Never mind</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={disconnectAllStores}
                >
                  Disconnect everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <RotateCcw className="h-4 w-4 text-destructive" />
              Reset workspace
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Everything back to the seed state — stores, missions,
              decisions, chat, settings, the lot.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="h-11 shrink-0">
                Reset workspace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Reset the whole workspace?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This clears every change you&apos;ve made — connected
                  stores, resolved decisions, chat history, settings — and
                  restores the seeded demo morning. There is no undo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Never mind</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={resetWorkspace}
                >
                  Reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}

// ——— About ———

function AboutTab() {
  const [sessionId] = useState(
    () => `web-${Math.random().toString(16).slice(2, 8)}`,
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">UNiCOM console</CardTitle>
          <CardDescription>
            The multi-store command center — one ring, every agent, all
            evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Version
              </p>
              <p className="mt-1 font-mono text-sm">v0.2.0</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Session
              </p>
              <p className="mt-1 truncate font-mono text-sm">{sessionId}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Build channel
              </p>
              <p className="mt-1">
                <Badge
                  variant="outline"
                  className="border-amber-500/50 font-mono text-[10px] text-amber-600 dark:text-amber-400"
                >
                  development
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            UNiCOM grew out of{" "}
            <span className="font-mono text-foreground/80">zcode</span> — the
            resident agent platform that ran this very rebuild. Every surface
            here mirrors a proven zcode capability: the watch feed is the
            resident heartbeat loop, missions are multi-agent orchestration
            with lanes and workers, decisions are the approval frontier, and
            evidence chips are the evidence-first review discipline. Same
            DNA, commerce edition.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
