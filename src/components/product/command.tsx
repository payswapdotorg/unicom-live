"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct } from "@/lib/product/store";
import { MORNING_BRIEF, TASK_TEMPLATES, platformOf } from "@/lib/product/data";

// Command — the day starts with the agent's brief (the morning report,
// zcode-native). Numbers across all stores, overnight checks, what needs you.
// A compact commission card (R-B2) puts the launch path one click away.
const COMMISSION_TEMPLATES = TASK_TEMPLATES.filter((t) =>
  ["tpl-reprice", "tpl-audit"].includes(t.id),
);

export function CommandSection() {
  const { stores, decisions, missions, setSection, setDraft } = useProduct();
  const urgent = decisions.filter((d) => d.risk !== "low").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Good morning.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {MORNING_BRIEF.date} · the watch ran all night ·{" "}
          {stores.length} stores connected
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-primary/25 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Rocket className="h-4 w-4 text-primary" aria-hidden />
                Commission work
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Describe it once — the agent plans, you approve, evidence lands
                in Watch.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {COMMISSION_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setDraft({ goal: t.goal });
                    setSection("newtask");
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-card px-3 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <span className="text-primary" aria-hidden>
                    {t.glyph}
                  </span>
                  {t.title}
                </button>
              ))}
              <Button
                size="sm"
                className="min-h-11"
                onClick={() => setSection("newtask")}
              >
                New task
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MORNING_BRIEF.numbers.map((n, i) => (
          <motion.div
            key={n.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{n.label}</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tabular-nums">
                    {n.value}
                  </span>
                  {n.up === null ? (
                    <Badge variant="outline" className="text-[10px]">
                      {n.delta}
                    </Badge>
                  ) : (
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${n.up ? "text-primary" : "text-destructive"}`}
                    >
                      {n.up ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {n.delta}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="lg:col-span-2"
        >
          <Card className="h-full border-primary/25 bg-primary/[0.04]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Overnight brief
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-foreground/90">
                {MORNING_BRIEF.summary}
              </p>
              <ul className="space-y-2">
                {MORNING_BRIEF.checks.map((c, i) => (
                  <motion.li
                    key={c}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/85">{c}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => setSection("decisions")}>
                  Review {decisions.length} decisions
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSection("chat")}
                >
                  Ask the agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Store ring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stores.map((s) => {
                const p = platformOf(s.platform);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection("stores")}
                    className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-semibold ${p.tint}`}
                      aria-hidden
                    >
                      {p.glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {s.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
        {s.lastSync} · {s.orders7d} orders
                      </span>
                    </span>
                    <Badge
                      variant={
                        s.health === "healthy"
                          ? "default"
                          : s.health === "attention"
                            ? "destructive"
                            : "secondary"
                      }
                      className="shrink-0 text-[10px]"
                    >
                      {s.health}
                    </Badge>
                  </button>
                );
              })}
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                Audited nightly · every action leaves evidence
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {urgent > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/[0.06]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {urgent} decision{urgent > 1 ? "s" : ""} need your call before
                agents can proceed.
              </p>
              <p className="text-xs text-muted-foreground">
                Nothing ships without your checkbox — that&apos;s the trust
                frontier.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/50"
              onClick={() => setSection("decisions")}
            >
              Open decisions
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        {missions.filter((m) => m.status === "running").length} missions
        running · {missions.filter((m) => m.status === "in-review").length} in
        review · watch ring all green
      </p>
    </div>
  );
}
