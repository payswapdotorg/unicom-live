"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  Database,
  Globe,
  Info,
  MonitorSmartphone,
  Pause,
  Plug,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConnectDialog } from "@/components/product/stores";
import { useProduct } from "@/lib/product/store";
import {
  AGENT_TONE_OPTIONS,
  AUTOMATION_SCHEDULES,
  HOOK_EVENTS,
  MODEL_CARDS,
  PERMISSION_FAMILIES,
  PERMISSION_POLICIES,
  platformOf,
  storeName,
  type AgentTone,
  type PermissionPolicy,
  type Verbosity,
} from "@/lib/product/data";

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
  const [tab, setTab] = useState<TabId>("general");
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
              {tab === "permissions" && <PermissionsTab />}
              {tab === "automations" && <AutomationsTab />}
              {tab === "commands" && <CommandsTab />}
              {tab === "hooks" && <HooksTab />}
              {tab === "mcp" && <McpTab />}
              {tab === "computer" && <ComputerTab />}
              {tab === "stores" && <StoresTab />}
              {tab === "notifications" && <NotificationsTab />}
              {tab === "data" && <DataTab />}
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

const REASONING_LABELS = ["", "snap", "quick", "steady", "thorough", "deep"];

function GeneralTab() {
  const { settings, setSettings, pushToast } = useProduct();

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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Model</CardTitle>
          <CardDescription>
            The brain every worker runs on. Switch anytime — missions pick it
            up on the next lane.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Model">
            {MODEL_CARDS.map((m) => {
              const active = settings.model === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setSettings({ model: m.id });
                    pushToast("Model switched", `${m.name} · ${m.tagline}.`);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary/60 bg-primary/[0.06] ring-2 ring-primary/25"
                      : "hover:border-primary/40 hover:bg-accent"
                  }`}
                >
                  <p className="font-mono text-sm font-semibold">{m.name}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {m.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reasoning effort</CardTitle>
          <CardDescription>
            How long the agent thinks before it speaks. Four is the sweet spot
            for commerce work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Slider
              value={[settings.reasoning]}
              min={1}
              max={5}
              step={1}
              onValueChange={(v) => setSettings({ reasoning: v[0] })}
              onValueCommit={(v) =>
                pushToast(
                  "Reasoning set",
                  `Effort ${v[0]} of 5 — ${REASONING_LABELS[v[0]]} mode.`,
                )
              }
              aria-label="Reasoning effort"
              className="flex-1"
            />
            <span className="w-14 shrink-0 rounded-md border bg-muted/50 py-1 text-center font-mono text-sm">
              {settings.reasoning}/5
            </span>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            {REASONING_LABELS.slice(1).map((l, i) => (
              <span key={l} className={settings.reasoning === i + 1 ? "text-primary" : undefined}>
                {i + 1} · {l}
              </span>
            ))}
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
