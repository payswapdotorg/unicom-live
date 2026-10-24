"use client";

import { motion } from "framer-motion";
import { RotateCcw, Rocket, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useProduct } from "@/lib/product/store";
import {
  CONTEXT_OPTIONS,
  GUARDRAILS,
  TASK_TEMPLATES,
  platformOf,
  type GuardrailKey,
} from "@/lib/product/data";

// New task — the composer. One screen that turns a sentence into a running
// mission: scope, skills, context, project, autonomy, guardrails — and a
// live mission preview that mirrors the draft until you launch.
export function NewTaskSection() {
  const {
    draft,
    setDraft,
    resetDraft,
    launchTask,
    stores,
    skills,
    groups,
    pushToast,
  } = useProduct();

  const goalOk = draft.goal.trim().length > 0;
  const storesOk = draft.stores.length > 0;
  const ready = goalOk && storesOk;
  const guardCount = (
    Object.values(draft.guardrails) as boolean[]
  ).filter(Boolean).length;

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Say what needs doing — the agent plans it, guards it, and reports
          evidence at every step.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* ——— Composer ——— */}
        <div className="min-w-0 space-y-6">
          {/* Quick-start templates */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick-start templates</CardTitle>
                <p className="text-xs text-muted-foreground">
                  One click drops a proven goal into the composer — edit from
                  there.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TASK_TEMPLATES.map((t) => {
                    const active = draft.goal.trim() === t.goal;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDraft({ goal: t.goal })}
                        aria-pressed={active}
                        className={`flex min-h-11 items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                          active
                            ? "border-primary/60 bg-primary/[0.06] ring-2 ring-primary/25"
                            : "hover:border-primary/40 hover:bg-accent"
                        }`}
                      >
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-sm text-primary"
                          aria-hidden
                        >
                          {t.glyph}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {t.title}
                          </span>
                          <span className="block text-[11px] leading-tight text-muted-foreground">
                            {t.blurb}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* The job */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">The job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="task-goal" className="sr-only">
                  Describe the job
                </Label>
                <Textarea
                  id="task-goal"
                  value={draft.goal}
                  onChange={(e) => setDraft({ goal: e.target.value })}
                  placeholder="Tell the agent what needs doing…"
                  rows={5}
                  className="min-h-28 resize-y text-sm leading-relaxed"
                />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Examples:{" "}
                  <span className="font-mono text-foreground/80">
                    “reprice the linen throw to stay competitive but keep 60%
                    margin”
                  </span>{" "}
                  ·{" "}
                  <span className="font-mono text-foreground/80">
                    “find out why Etsy jumped 24% and do more of it”
                  </span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Scope: stores, skills, context */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Scope</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Where the task runs, which skills it may lean on, and what
                  context it starts with.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stores */}
                <fieldset>
                  <legend className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Stores · {draft.stores.length} of {stores.length} in scope
                  </legend>
                  {stores.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      No stores connected — connect one first (Stores section),
                      then come back.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {stores.map((s) => {
                        const p = platformOf(s.platform);
                        const pressed = draft.stores.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStore(s.id)}
                            aria-pressed={pressed}
                            className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
                              pressed
                                ? "border-primary/60 bg-primary/10 font-medium text-primary"
                                : "text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            <span
                              className={`font-mono text-xs font-bold ${p.tint}`}
                              aria-hidden
                            >
                              {p.glyph}
                            </span>
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                {/* Skills */}
                <fieldset>
                  <legend className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Skills · optional
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((sk) => {
                      const pressed = draft.skills.includes(sk.id);
                      return (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => toggleSkill(sk.id)}
                          aria-pressed={pressed}
                          className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
                            pressed
                              ? "border-primary/60 bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
                          }`}
                        >
                          <span className="font-mono text-xs" aria-hidden>
                            {sk.glyph}
                          </span>
                          {sk.name}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Context */}
                <fieldset>
                  <legend className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Context · what the agent reads first
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {CONTEXT_OPTIONS.map((c) => {
                      const pressed = draft.context.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleContext(c.id)}
                          aria-pressed={pressed}
                          className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
                            pressed
                              ? "border-primary/60 bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </CardContent>
            </Card>
          </motion.div>

          {/* Project */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Project</CardTitle>
                <p className="text-xs text-muted-foreground">
                  File this task under a group so the board stays readable.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <fieldset>
                  <legend className="sr-only">Project group</legend>
                  <div
                    role="radiogroup"
                    aria-label="Project group"
                    className="flex flex-wrap gap-2"
                  >
                    <ProjectChip
                      label="Ungrouped"
                      checked={draft.groupId === ""}
                      onCheck={() => setDraft({ groupId: "" })}
                    />
                    {groups.map((g) => (
                      <ProjectChip
                        key={g.id}
                        label={g.name}
                        dot={g.tint}
                        checked={draft.groupId === g.id}
                        onCheck={() => setDraft({ groupId: g.id })}
                      />
                    ))}
                    <ProjectChip
                      label="New group…"
                      plus
                      checked={draft.groupId === "__new__"}
                      onCheck={() => setDraft({ groupId: "__new__" })}
                    />
                  </div>
                </fieldset>
                {draft.groupId === "__new__" && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="new-group-name"
                      className="text-xs font-medium"
                    >
                      New group name
                    </Label>
                    <Input
                      id="new-group-name"
                      value={draft.newGroupName}
                      onChange={(e) =>
                        setDraft({ newGroupName: e.target.value })
                      }
                      placeholder="e.g. Summer clearance"
                      className="max-w-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Autonomy */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Autonomy</CardTitle>
                <p className="text-xs text-muted-foreground">
                  How much rope the agent gets before you see anything.
                </p>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={draft.autonomy}
                  onValueChange={(v) =>
                    setDraft({ autonomy: v === "act" ? "act" : "plan" })
                  }
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <AutonomyCard
                    value="plan"
                    title="Plan first"
                    badge="recommended"
                    desc="The agent proposes a plan before acting — you approve the shape of the work."
                    checked={draft.autonomy === "plan"}
                  />
                  <AutonomyCard
                    value="act"
                    title="Act immediately"
                    desc="The agent starts working right away; guardrails still pack risky moves as decisions."
                    checked={draft.autonomy === "act"}
                  />
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>

          {/* Guardrails */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Guardrails
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {guardCount === 4
                    ? "All four guards on — the safe default."
                    : `${guardCount} of 4 on — loosen carefully.`}
                </p>
              </CardHeader>
              <CardContent className="space-y-1">
                {GUARDRAILS.map((g) => {
                  const on = draft.guardrails[g.key];
                  return (
                    <div
                      key={g.key}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-1 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`guard-${g.key}`}
                          className="block text-sm font-medium"
                        >
                          {g.label}
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          {g.helper}
                        </p>
                        {!on && (
                          <p className="mt-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            agent may act without asking
                          </p>
                        )}
                      </div>
                      <Switch
                        id={`guard-${g.key}`}
                        checked={on}
                        onCheckedChange={() => toggleGuardrail(g.key)}
                        aria-label={g.label}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ——— Mission preview (sticky) ——— */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="xl:sticky xl:top-24 xl:self-start"
          aria-label="Mission preview"
        >
          <Card className="border-primary/25">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mission preview</CardTitle>
              <p className="text-xs text-muted-foreground">
                What the orchestrator receives when you launch.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Job
                </p>
                <p className="mt-0.5 line-clamp-3 text-sm leading-snug">
                  {goalOk ? (
                    draft.goal.trim()
                  ) : (
                    <span className="text-muted-foreground">
                      — describe the job above —
                    </span>
                  )}
                </p>
              </div>

              <PreviewRow label="Stores">
                {storesOk ? (
                  <span className="font-mono text-[11px] text-foreground/85">
                    {draft.stores.length} store
                    {draft.stores.length > 1 ? "s" : ""} ·{" "}
                    {draft.stores
                      .map((id) => stores.find((x) => x.id === id)?.name ?? id)
                      .join(" · ")}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    none picked
                  </span>
                )}
              </PreviewRow>

              <PreviewRow label="Skills">
                {draft.skills.length > 0 ? (
                  <span className="font-mono text-[11px] text-foreground/85">
                    {draft.skills
                      .map(
                        (id) => skills.find((x) => x.id === id)?.name ?? id,
                      )
                      .join(" · ")}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    agent&apos;s choice
                  </span>
                )}
              </PreviewRow>

              <PreviewRow label="Project">
                {draft.groupId === "__new__" ? (
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-foreground/85">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                    {draft.newGroupName.trim() || "new group (unnamed)"}
                  </span>
                ) : draft.groupId ? (
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-foreground/85">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        groups.find((g) => g.id === draft.groupId)?.tint ??
                        "bg-primary"
                      }`}
                      aria-hidden
                    />
                    {groups.find((g) => g.id === draft.groupId)?.name ??
                      draft.groupId}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    ungrouped
                  </span>
                )}
              </PreviewRow>

              <PreviewRow label="Autonomy">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    draft.autonomy === "plan"
                      ? "border-primary/40 text-primary"
                      : "border-amber-500/50 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {draft.autonomy === "plan" ? "plan first" : "act now"}
                </Badge>
              </PreviewRow>

              <PreviewRow label="Guardrails">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    guardCount === 4
                      ? "border-primary/40 text-primary"
                      : "border-amber-500/50 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {guardCount === 4
                    ? "all 4 on"
                    : `${guardCount} of 4 on`}
                </Badge>
              </PreviewRow>

              <PreviewRow label="Context">
                {draft.context.length > 0 ? (
                  <span className="font-mono text-[11px] text-foreground/85">
                    {draft.context
                      .map(
                        (id) =>
                          CONTEXT_OPTIONS.find((c) => c.id === id)?.label ??
                          id,
                      )
                      .join(" · ")}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    none
                  </span>
                )}
              </PreviewRow>

              <div className="space-y-2 pt-2">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!ready}
                  onClick={() => launchTask()}
                >
                  <Rocket className="mr-1 h-4 w-4" />
                  Launch task
                </Button>
                <p className="min-h-8 text-center text-[11px] leading-snug text-muted-foreground">
                  {!goalOk
                    ? "Describe the job to arm the launch."
                    : !storesOk
                      ? "Pick at least one store to arm the launch."
                      : guardCount === 4
                        ? "All guardrails on — risky moves still land on your desk."
                        : `${guardCount} of 4 guardrails on — the agent leans freer.`}
                </p>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    resetDraft();
                    pushToast("Draft cleared", "Back to a blank slate — all stores re-scoped.");
                  }}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Start over
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.aside>
      </div>
    </div>
  );
}

// ——— small in-file pieces ———

function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <p className="w-20 shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  );
}

function ProjectChip({
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
      className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
        checked
          ? "border-primary/60 bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
      }`}
    >
      {dot && (
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      )}
      {plus && (
        <span className="font-mono text-xs leading-none" aria-hidden>
          +
        </span>
      )}
      {label}
    </button>
  );
}

function AutonomyCard({
  value,
  title,
  desc,
  badge,
  checked,
}: {
  value: string;
  title: string;
  desc: string;
  badge?: string;
  checked: boolean;
}) {
  return (
    <label
      className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
        checked
          ? "border-primary/60 bg-primary/[0.06] ring-2 ring-primary/25"
          : "hover:border-primary/40 hover:bg-accent"
      }`}
    >
      <RadioGroupItem value={value} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <Badge
              variant="outline"
              className="border-primary/40 text-[9px] text-primary"
            >
              {badge}
            </Badge>
          )}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {desc}
        </span>
      </span>
    </label>
  );
}
