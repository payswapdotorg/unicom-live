"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Hand,
  Lightbulb,
  Loader2,
  MailPlus,
  PackagePlus,
  PenLine,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ModelPicker } from "@/components/product/model-picker";
import { useProduct, type TaskDraft } from "@/lib/product/store";
import {
  CONTEXT_OPTIONS,
  GUARDRAILS,
  TASK_TEMPLATES,
  platformOf,
  type GuardrailKey,
} from "@/lib/product/data";
import { effectiveEffort } from "@/lib/product/models";

// New task — the zcode draft experience, commerce-translated (FE2 §1.4).
// One centered column: a time-greeting empty state over the UNiCOM ring-mark
// watermark, the composer card (scope strip + goal textarea + toolbar with
// mode switch, model picker, and the ArrowUp launch), an honest armed-reason
// helper line, and the suggested-mission chips. The old page's template
// tiles / Scope / Project / Autonomy / Guardrail cards and the sticky Mission
// preview are ABSORBED here — every TaskDraft field stays live, and launch
// still rides the store's existing launchTask() (toasts + mission creation +
// navigation untouched). Prefills from the Overview intake and outcome
// shortcuts land in the textarea through the shared draft.goal state.

// ——— The zcode 6-slot greeting machine (boundaries 5/9/12/14/18/23, UTC) ———

function greetingForHour(h: number): string {
  if (h >= 5 && h < 9) return "Morning, ready when you are";
  if (h >= 9 && h < 12) return "Morning, how can I help?";
  if (h >= 12 && h < 14) return "Noon break?";
  if (h >= 14 && h < 18) return "Good afternoon! Leave the rest to me.";
  if (h >= 18 && h < 23) return "Evening, nice work today";
  return "It's late—remember to take care of yourself.";
}

const GREETING_BOUNDARIES = [5, 9, 12, 14, 18, 23];

/**
 * Mount-gated time greeting (the hydration law): SSR renders nothing, the
 * effect computes the slot on mount, and a setTimeout re-renders at the next
 * UTC boundary (cleaned up on unmount).
 */
function useTimeGreeting(): string | null {
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const now = new Date();
      setGreeting(greetingForHour(now.getUTCHours()));
      const h = now.getUTCHours();
      const next = GREETING_BOUNDARIES.find((b) => b > h) ?? 5 + 24;
      const nextAt = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        next,
      );
      timer = setTimeout(tick, Math.max(nextAt - Date.now(), 60_000));
    };
    tick();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);
  return greeting;
}

// ——— Execution mode catalog (the zcode permission radio, commerce) ———

const MODES: {
  id: TaskDraft["mode"];
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    id: "confirm",
    label: "Ask before changes",
    desc: "Writes pack decisions for your approval.",
    icon: Hand,
  },
  {
    id: "autonomous",
    label: "Autonomous",
    desc: "Acts alone inside your permission matrix.",
    icon: ShieldCheck,
  },
  {
    id: "full",
    label: "Full access",
    desc: "Runs with fewer confirmations.",
    icon: ShieldAlert,
  },
];

// ——— Suggested missions: the 4 TASK_TEMPLATES + two honest extras ———

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "tpl-reprice": Target,
  "tpl-refresh": PenLine,
  "tpl-carts": MailPlus,
  "tpl-audit": ClipboardList,
};

const SUGGESTED_MISSIONS: { id: string; label: string; icon: LucideIcon; goal: string }[] =
  [
    ...TASK_TEMPLATES.map((t) => ({
      id: t.id,
      label: t.title,
      icon: TEMPLATE_ICONS[t.id] ?? Target,
      goal: t.goal,
    })),
    {
      id: "s-restock",
      label: "Restock best-sellers before the weekend",
      icon: PackagePlus,
      goal: "Check 28-day sales velocity across my stores and draft restock orders for every SKU trending below a 10-day cover — pack the orders as decisions.",
    },
    {
      id: "s-failed",
      label: "Audit this week's failed orders",
      icon: CircleAlert,
      goal: "Pull every failed or cancelled order from the last 7 days across my stores, group them by failure reason, and draft the recovery steps with evidence.",
    },
  ];

const THIN_SCROLL =
  "[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5";

const HEALTH_DOT: Record<string, string> = {
  healthy: "bg-emerald-500",
  attention: "bg-amber-500",
  syncing: "bg-muted-foreground/50",
};

// ——— Small shared bits ———

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
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
      className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
        pressed
          ? "border-primary/40 bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:border-foreground/25 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ——— The draft page ———

export function NewTaskSection() {
  const {
    draft,
    setDraft,
    resetDraft,
    launchTask,
    stores,
    skills,
    groups,
    settings,
    pushToast,
  } = useProduct();

  const [scopeOpen, setScopeOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // The greeting renders only after mount (hydration law).
  const greeting = useTimeGreeting();

  // Autofocus on mount, desktop pointers only — no mobile keyboard popup.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus();
    }
  }, []);

  // zcode auto-grow: the input follows its content up to max-h-56, then scrolls.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 224)}px`;
  }, [draft.goal]);

  const goalOk = draft.goal.trim().length > 0;
  const storesOk = draft.stores.length > 0;
  const ready = goalOk && storesOk;
  const emptyDraft = !goalOk;

  const mode = MODES.find((m) => m.id === draft.mode) ?? MODES[0];
  const group =
    draft.groupId === "__new__"
      ? undefined
      : groups.find((g) => g.id === draft.groupId);

  // The effective model pair (draft choice, else the workspace default).
  const effectiveModel = draft.model || settings.model;
  const effectiveEffortLabel = effectiveEffort(
    effectiveModel,
    draft.effort || settings.effort,
  );

  const scopeLabel = !storesOk
    ? "Select scope"
    : `${draft.stores.length} store${draft.stores.length === 1 ? "" : "s"}${
        draft.skills.length > 0
          ? ` · ${draft.skills.length} skill${draft.skills.length === 1 ? "" : "s"}`
          : ""
      }`;

  // "Start over" shows only when the draft carries a real change.
  const draftDirty =
    draft.goal.trim() !== "" ||
    draft.skills.length > 0 ||
    draft.groupId !== "" ||
    draft.newGroupName.trim() !== "" ||
    draft.autonomy !== "plan" ||
    draft.mode !== "confirm" ||
    draft.model !== "" ||
    draft.effort !== "" ||
    draft.context.length !== 1 ||
    draft.context[0] !== "morning-brief" ||
    !draft.guardrails.prices ||
    !draft.guardrails.publishing ||
    !draft.guardrails.data ||
    !draft.guardrails.spend ||
    draft.stores.length !== stores.length;

  const toggleStore = (id: string) => {
    const has = draft.stores.includes(id);
    if (has && draft.stores.length === 1) {
      pushToast(
        "Keep at least one store",
        "A task needs somewhere to run — pick another store before dropping this one.",
      );
      return;
    }
    setDraft({
      stores: has ? draft.stores.filter((x) => x !== id) : [...draft.stores, id],
    });
  };

  const toggleSkill = (id: string) => {
    const has = draft.skills.includes(id);
    setDraft({
      skills: has
        ? draft.skills.filter((x) => x !== id)
        : [...draft.skills, id],
    });
  };

  const toggleContext = (id: string) => {
    const has = draft.context.includes(id);
    setDraft({
      context: has
        ? draft.context.filter((x) => x !== id)
        : [...draft.context, id],
    });
  };

  const toggleGuardrail = (key: GuardrailKey) => {
    setDraft({
      guardrails: { ...draft.guardrails, [key]: !draft.guardrails[key] },
    });
  };

  // Launch = the existing launchTask(): validation toasts ride the store when
  // the draft isn't armed; when it is, the spinner holds until the mission
  // applies (which swaps the section to Missions and unmounts this page).
  const attemptLaunch = () => {
    if (launching) return;
    if (ready) setLaunching(true);
    launchTask();
  };

  const onGoalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    // IME-safe: never hijack Enter mid-composition.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.shiftKey) return; // Shift+Enter = newline (default behavior)
    e.preventDefault();
    attemptLaunch();
  };

  const onGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft({ goal: value });
    // Typing "@" opens the scope popover — the mention affordance.
    if (value.endsWith("@")) setScopeOpen(true);
  };

  const helperLine = !goalOk
    ? "Describe the mission first — a sentence is enough."
    : !storesOk
      ? "Pick at least one store — the mission needs somewhere to run."
      : `Launches ${draft.autonomy === "plan" ? "Plan first" : "Immediately"} · ${mode.label} · ${effectiveModel}${
          effectiveEffortLabel !== "—"
            ? ` · ${effectiveEffortLabel} effort`
            : ""
        }`;

  return (
    <div
      className={`mx-auto flex w-full max-w-2xl flex-1 flex-col ${
        emptyDraft ? "min-h-[60vh] justify-center" : ""
      }`}
    >
      {/* Landmark scaffold — the draft page has no visible header (zcode) */}
      <h1 className="sr-only">New task</h1>

      {/* ——— Empty state: ring-mark watermark + the time greeting ——— */}
      {emptyDraft && (
        <div className="relative flex min-h-56 flex-col items-center justify-center gap-2">
          <svg
            viewBox="0 0 32 32"
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 w-56 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.08]"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 60%, transparent 95%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 60%, transparent 95%)",
            }}
          >
            <circle
              cx="16"
              cy="16"
              r="8.5"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.4"
            />
            <circle cx="22.5" cy="9.5" r="2.6" fill="#10b981" />
          </svg>
          {greeting && (
            <p className="px-4 text-center text-2xl font-medium tracking-tight sm:text-3xl">
              {greeting}
            </p>
          )}
        </div>
      )}

      {/* ——— The composer card ——— */}
      <section aria-label="Mission composer">
        <div className="rounded-2xl border bg-card shadow-sm">
          {/* Context header strip: one Scope chip (+ Start over when dirty) */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Popover open={scopeOpen} onOpenChange={setScopeOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 min-w-11 gap-1.5 rounded-lg px-2.5 text-sm font-normal"
                  aria-label={`Mission scope — ${scopeLabel}`}
                >
                  {draft.groupId !== "" && (
                    <span
                      aria-hidden
                      className={`size-2 shrink-0 rounded-full ${
                        group?.tint ?? "bg-primary"
                      }`}
                    />
                  )}
                  <span className="max-w-44 truncate">{scopeLabel}</span>
                  <ChevronDown
                    aria-hidden
                    className="size-3.5 text-muted-foreground"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="bottom"
                className={`w-80 max-h-[26rem] overflow-y-auto p-1.5 ${THIN_SCROLL}`}
                aria-label="Mission scope"
              >
                {/* Stores */}
                <SectionLabel>Stores</SectionLabel>
                {stores.length === 0 ? (
                  <p className="px-2 py-2 text-xs leading-relaxed text-muted-foreground">
                    No stores connected — connect one first (Stores section),
                    then come back.
                  </p>
                ) : (
                  <div role="group" aria-label="Stores in scope">
                    {stores.map((s) => {
                      const p = platformOf(s.platform);
                      const checked = draft.stores.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 transition-colors hover:bg-accent/50"
                        >
                          <Checkbox
                            id={`scope-store-${s.id}`}
                            checked={checked}
                            onCheckedChange={() => toggleStore(s.id)}
                            aria-label={s.name}
                          />
                          <label
                            htmlFor={`scope-store-${s.id}`}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm"
                          >
                            <span
                              className={`font-mono text-xs font-bold ${p.tint}`}
                              aria-hidden
                            >
                              {p.glyph}
                            </span>
                            <span className="truncate">{s.name}</span>
                          </label>
                          <span
                            aria-hidden
                            title={s.health}
                            className={`size-2 shrink-0 rounded-full ${HEALTH_DOT[s.health]}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Skills */}
                <SectionLabel>Skills</SectionLabel>
                {skills.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-muted-foreground">
                    No skills installed yet.
                  </p>
                ) : (
                  <div
                    role="group"
                    aria-label="Skills to involve"
                    className="flex flex-wrap gap-2 px-2 pb-1.5"
                  >
                    {skills.map((sk) => (
                      <ToggleChip
                        key={sk.id}
                        pressed={draft.skills.includes(sk.id)}
                        onClick={() => toggleSkill(sk.id)}
                      >
                        <span className="font-mono text-xs" aria-hidden>
                          {sk.glyph}
                        </span>
                        {sk.name}
                      </ToggleChip>
                    ))}
                  </div>
                )}

                {/* Context */}
                <SectionLabel>Context</SectionLabel>
                <div
                  role="group"
                  aria-label="Starting context"
                  className="flex flex-wrap gap-2 px-2 pb-1.5"
                >
                  {CONTEXT_OPTIONS.map((c) => (
                    <ToggleChip
                      key={c.id}
                      pressed={draft.context.includes(c.id)}
                      onClick={() => toggleContext(c.id)}
                    >
                      {c.label}
                    </ToggleChip>
                  ))}
                </div>

                {/* Project */}
                <SectionLabel>Project</SectionLabel>
                <div
                  role="radiogroup"
                  aria-label="Project group"
                  className="px-1 pb-1"
                >
                  <ProjectRadioRow
                    label="Ungrouped"
                    checked={draft.groupId === ""}
                    onCheck={() => setDraft({ groupId: "" })}
                  />
                  {groups.map((g) => (
                    <ProjectRadioRow
                      key={g.id}
                      label={g.name}
                      dot={g.tint}
                      checked={draft.groupId === g.id}
                      onCheck={() => setDraft({ groupId: g.id })}
                    />
                  ))}
                  <ProjectRadioRow
                    label="New group…"
                    plus
                    checked={draft.groupId === "__new__"}
                    onCheck={() => setDraft({ groupId: "__new__" })}
                  />
                </div>
                {draft.groupId === "__new__" && (
                  <div className="px-2 pb-2">
                    <label
                      htmlFor="scope-new-group"
                      className="sr-only"
                    >
                      New group name
                    </label>
                    <Input
                      id="scope-new-group"
                      value={draft.newGroupName}
                      onChange={(e) =>
                        setDraft({ newGroupName: e.target.value })
                      }
                      placeholder="e.g. Summer clearance"
                      className="h-11 text-sm"
                    />
                  </div>
                )}

                {/* Guardrails */}
                <SectionLabel>Guardrails</SectionLabel>
                <div className="divide-y divide-border/60 px-2">
                  {GUARDRAILS.map((g) => {
                    const on = draft.guardrails[g.key];
                    return (
                      <div
                        key={g.key}
                        className="flex min-h-11 items-center gap-3 py-2 first:pt-1 last:pb-1"
                      >
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor={`scope-guard-${g.key}`}
                            className="block text-sm font-medium"
                          >
                            {g.label}
                          </label>
                          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                            {g.helper}
                          </p>
                          {!on && (
                            <p className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              agent may act without asking
                            </p>
                          )}
                        </div>
                        <Switch
                          id={`scope-guard-${g.key}`}
                          checked={on}
                          onCheckedChange={() => toggleGuardrail(g.key)}
                          aria-label={g.label}
                        />
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {draftDirty && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  resetDraft();
                  pushToast(
                    "Started over",
                    "The draft is clear — the workspace default scope applies.",
                  );
                }}
                title="Start over"
                aria-label="Start over"
                className="ml-auto h-11 w-11 rounded-lg"
              >
                <RotateCcw aria-hidden className="size-4" />
              </Button>
            )}
          </div>

          {/* The goal — borderless auto-growing textarea */}
          <div className="px-3 pb-1 pt-3">
            {draft.autonomy === "plan" && (
              <div className="mb-1.5 flex justify-end">
                <span
                  title="Remove Plan from this mission"
                  className="flex min-h-8 items-center gap-1 rounded-full border bg-card pl-2.5 pr-1 text-xs shadow-sm"
                >
                  <Lightbulb
                    aria-hidden
                    className="size-3.5 text-amber-500"
                  />
                  <span className="font-medium">Plan</span>
                  <button
                    type="button"
                    onClick={() => setDraft({ autonomy: "act" })}
                    aria-label="Remove Plan from this mission"
                    title="Remove Plan from this mission"
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </span>
              </div>
            )}
            <label htmlFor="task-goal" className="sr-only">
              Describe the mission
            </label>
            <textarea
              id="task-goal"
              ref={textareaRef}
              value={draft.goal}
              onChange={onGoalChange}
              onKeyDown={onGoalKeyDown}
              rows={1}
              placeholder="Describe what UNiCOM should do — @ for stores, skills, and context"
              className="w-full resize-none min-h-10 max-h-56 overflow-y-auto bg-transparent px-1 py-1.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Toolbar: add-context + mode (left) · model picker + send (right) */}
          <div className="flex flex-wrap items-center gap-1 px-2.5 pb-2.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setScopeOpen(true)}
              aria-label="Add context"
              title="Add context"
              className="h-11 w-11 rounded-lg"
            >
              <Plus aria-hidden className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 gap-1.5 rounded-lg px-2.5 text-sm font-normal"
                  aria-label={`Mission mode — ${mode.label}`}
                >
                  <mode.icon
                    aria-hidden
                    className={`size-4 ${
                      draft.mode === "full"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="max-w-44 truncate">{mode.label}</span>
                  <ChevronDown
                    aria-hidden
                    className="size-3.5 text-muted-foreground"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-72">
                <DropdownMenuCheckboxItem
                  checked={draft.autonomy === "plan"}
                  onCheckedChange={(v) =>
                    setDraft({ autonomy: v ? "plan" : "act" })
                  }
                  onSelect={(e) => e.preventDefault()}
                  className="min-h-11 py-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm">Plan first</span>
                    <span className="text-xs leading-snug text-muted-foreground">
                      Draft the mission plan before any store is touched.
                    </span>
                  </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={draft.mode}
                  onValueChange={(v) =>
                    setDraft({ mode: v as TaskDraft["mode"] })
                  }
                >
                  {MODES.map((m) => (
                    <DropdownMenuRadioItem
                      key={m.id}
                      value={m.id}
                      className="min-h-11 py-2"
                    >
                      <m.icon aria-hidden className="size-4" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm">{m.label}</span>
                        <span className="text-xs leading-snug text-muted-foreground">
                          {m.desc}
                        </span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-auto flex items-center gap-1">
              <ModelPicker
                value={{
                  providerId: "",
                  modelId: draft.model || settings.model,
                  effort: draft.effort || settings.effort,
                }}
                onChange={(v) =>
                  setDraft({ model: v.modelId, effort: v.effort })
                }
              />
              <Button
                type="button"
                size="icon"
                onClick={attemptLaunch}
                disabled={!ready || launching}
                aria-label="Launch mission"
                title="Launch mission"
                className="h-11 w-11 rounded-lg"
              >
                {launching ? (
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                ) : (
                  <ArrowUp aria-hidden className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* The honest helper line — the armed reason of the moment */}
        <p
          aria-live="polite"
          className="px-1 pt-2 text-xs leading-relaxed text-muted-foreground"
        >
          {helperLine}
        </p>
      </section>

      {/* ——— Suggested missions (only while the draft is empty) ——— */}
      {emptyDraft && (
        <div
          role="list"
          aria-label="Suggested missions"
          className={`mt-6 overflow-x-auto ${THIN_SCROLL}`}
        >
          <div className="flex w-max gap-2 px-0.5 pb-1">
            {SUGGESTED_MISSIONS.map((s, i) => (
              <motion.button
                key={s.id}
                type="button"
                role="listitem"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(0.065 * i, 0.4),
                  duration: 0.25,
                }}
                onClick={() => setDraft({ goal: s.goal })}
                className="flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border bg-card px-4 text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <s.icon aria-hidden className="size-4 text-primary" />
                {s.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ——— Small in-file pieces ———

function ProjectRadioRow({
  label,
  checked,
  onCheck,
  dot,
  plus,
}: {
  label: string;
  checked: boolean;
  onCheck: () => void;
  dot?: string;
  plus?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onCheck}
      className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
        checked
          ? "bg-accent font-medium text-accent-foreground"
          : "hover:bg-accent/50"
      }`}
    >
      <span
        aria-hidden
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-primary" : "border-muted-foreground/40"
        }`}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
      {dot && (
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${dot}`} />
      )}
      {plus && (
        <span aria-hidden className="font-mono text-xs leading-none">
          +
        </span>
      )}
      {label}
    </button>
  );
}
