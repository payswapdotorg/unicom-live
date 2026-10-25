"use client";

import { useEffect, useState } from "react";
import { PenLine, ScanSearch, Tags, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/lib/product/store";
import { TASK_TEMPLATES, type WatchEvent } from "@/lib/product/data";

// Overview — the outcome-first home (spec §6). Absorbs the retired Command
// section: the brief is now LIVE-computed from the workspace state (stores,
// decisions, watch events — never the static MORNING_BRIEF constants), the
// intake entry hands its text to the New Task composer via the draft state,
// and the four outcome shortcuts apply the same template payloads the New
// Task templates apply. Honest states throughout: counts come only from the
// loaded state, and every empty state states its typed reason.

/** The intake-entry textarea → New Task handoff (same payload the New Task
 * templates apply — the draft's goal field; spec writes "job", our draft
 * field is "goal"). */
const TEMPLATE_OF: Record<string, string | undefined> = Object.fromEntries(
  TASK_TEMPLATES.map((t) => [t.id, t.goal]),
);

const OUTCOMES: {
  key: string;
  templateId: string;
  title: string;
  description: string;
  glyph: typeof Tags;
}[] = [
  {
    key: "reprice",
    templateId: "tpl-reprice",
    title: "Reprice",
    description: "Fix prices and margins",
    glyph: Tags,
  },
  {
    key: "refresh",
    templateId: "tpl-refresh",
    title: "Refresh",
    description: "Rewrite what stopped selling",
    glyph: PenLine,
  },
  {
    key: "recover",
    templateId: "tpl-carts",
    title: "Recover",
    description: "Win back abandoned carts",
    glyph: Undo2,
  },
  {
    key: "audit",
    templateId: "tpl-audit",
    title: "Audit",
    description: "Sweep a store for drift",
    glyph: ScanSearch,
  },
];

const KIND_LABEL: Record<WatchEvent["kind"], string> = {
  heartbeat: "heartbeat",
  anomaly: "anomaly",
  heal: "self-heal",
  review: "review",
  dispatch: "dispatch",
};

/** How a mission status renders on the overview rows (amber = awaiting you,
 * emerald = running; text hierarchy over color, semantic only). */
function MissionStatusBadge({ status }: { status: string }) {
  if (status === "running") {
    return <Badge className="shrink-0 text-[10px]">{status}</Badge>;
  }
  if (status === "done") {
    return (
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        {status}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="shrink-0 border-amber-500/50 text-[10px] text-amber-700 dark:text-amber-400"
    >
      {status}
    </Badge>
  );
}

export function OverviewSection() {
  const {
    stores,
    missions,
    decisions,
    watchEvents,
    setSection,
    setDraft,
  } = useProduct();
  const [text, setText] = useState("");

  // The date line renders only after the first client tick — a Date seeded
  // in render state could differ between SSR and hydration (timezone) and
  // mismatch React. Same law as the heartbeat clock.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setToday(new Date()), 0);
    return () => clearTimeout(t);
  }, []);

  const dateLine = today
    ? `${today.toLocaleDateString("en-US", { weekday: "long" })}, ${today.toLocaleDateString("en-US", { month: "long" })} ${today.getDate()}`
    : "…";

  // ——— Today's brief, live-computed from the loaded ring ———
  const revenue7d = stores.reduce((sum, s) => sum + s.revenue7d, 0);
  const orders7d = stores.reduce((sum, s) => sum + s.orders7d, 0);
  const revenueWeightedDelta =
    revenue7d > 0
      ? stores.reduce((sum, s) => sum + s.revenue7d * s.delta7d, 0) /
        revenue7d
      : 0;
  const highRisk = decisions.filter((d) => d.risk === "high").length;

  const attentionStores = stores.filter((s) => s.health === "attention");
  const heals = watchEvents.filter((e) => e.kind === "heal").length;
  const anomalies = watchEvents.filter((e) => e.kind === "anomaly").length;
  const briefNote = [
    attentionStores.length > 0
      ? `${attentionStores.map((s) => s.name).join(", ")} need${attentionStores.length === 1 ? "s" : ""} attention`
      : "all stores healthy",
    `${heals} self-heal${heals === 1 ? "" : "s"} on record`,
    `${anomalies} anomal${anomalies === 1 ? "y" : "ies"} flagged`,
  ].join(" · ");

  // ——— Missions in progress (two-reason honest empty) ———
  const inProgress = missions.filter((m) => m.status !== "done");
  const missionsEmpty =
    missions.length === 0
      ? "No missions exist yet — commission the first one above."
      : "No missions in progress — every recorded mission is done. Records stay readable in Missions.";

  const recent = watchEvents.slice(0, 12);

  const startOutcome = (templateId: string) => {
    const goal = TEMPLATE_OF[templateId];
    if (goal) setDraft({ goal });
    setSection("newtask");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Scaffold (spec §5) */}
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          UNiCOM Commerce Workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Outcome-first starting point: commission work, clear decisions,
          watch the ring.
        </p>
      </header>

      {/* The outcome question + intake entry + outcome shortcuts (spec §6.2-4) */}
      <section
        aria-labelledby="overview-question"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <h2
            id="overview-question"
            className="text-[26px] font-semibold leading-tight tracking-[-0.01em] sm:text-2xl"
          >
            What should UNiCOM accomplish?
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Describe an outcome. The agent plans it, you approve it, evidence
            lands in Watch.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 transition-[border-color,box-shadow] focus-within:border-foreground/25 focus-within:ring-2 focus-within:ring-ring/20">
          <label htmlFor="overview-intake" className="sr-only">
            Tell your agents what you need
          </label>
          <textarea
            id="overview-intake"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell your agents what you need …"
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <p className="text-sm text-muted-foreground">
            Reprice flagged SKUs, refresh stale listings, recover abandoned
            carts, or set up in-person selling.
          </p>
          <div className="flex justify-end">
            <Button
              className="h-11"
              disabled={text.trim().length === 0}
              onClick={() => {
                setDraft({ goal: text.trim() });
                setSection("newtask");
              }}
            >
              New mission
            </Button>
          </div>
        </div>

        <h3 className="text-base font-semibold">Start with an outcome</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => startOutcome(o.templateId)}
              className="flex flex-col gap-2 rounded-xl border bg-card p-5 text-left transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <o.glyph
                className="h-[22px] w-[22px] text-primary"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="font-semibold">{o.title}</span>
              <span className="text-sm text-muted-foreground">
                {o.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Today's brief — live-computed from the loaded ring (spec §6.5) */}
      <section aria-labelledby="overview-brief" className="flex flex-col gap-3">
        <h2 id="overview-brief" className="text-base font-semibold">
          Today&apos;s brief
        </h2>
        {stores.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-card p-5">
            <p className="text-sm text-muted-foreground">
              No stores connected yet — the brief starts when your first store
              joins the ring.
            </p>
            <div>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => setSection("stores")}
              >
                Connect a store
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {dateLine} · the watch ran all night · {stores.length} stores
              connected
            </p>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Revenue 7d
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  ${revenue7d.toLocaleString("en-US")}
                </p>
                <p
                  className={`mt-0.5 text-xs font-medium ${revenueWeightedDelta >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {revenueWeightedDelta >= 0 ? "+" : "−"}
                  {Math.abs(revenueWeightedDelta).toFixed(1)}% weighted
                  across stores
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Orders 7d
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {orders7d.toLocaleString("en-US")}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Open decisions
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {decisions.length}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ({highRisk} high-risk)
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Watch ring
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {watchEvents.length}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  events on record
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {briefNote} — counted from the loaded ring.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-11"
                onClick={() => setSection("decisions")}
              >
                Review {decisions.length} decision
                {decisions.length === 1 ? "" : "s"}
              </Button>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => setSection("chat")}
              >
                Ask the agent
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Attention card — the trust frontier (spec §6.6) */}
      {decisions.length > 0 ? (
        <section
          aria-labelledby="overview-attention"
          className="rounded-xl border border-l-[3px] border-l-amber-500 bg-card p-5"
        >
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/50 text-[10px] text-amber-700 dark:text-amber-400"
            >
              Attention
            </Badge>
            <h2 id="overview-attention" className="text-base font-semibold">
              Decisions needing your call
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {decisions.length} packet{decisions.length === 1 ? "" : "s"}{" "}
            {decisions.length === 1 ? "is" : "are"} holding at the frontier —
            agents cannot proceed until you check the box.
          </p>
          <div className="mt-3">
            <Button
              variant="outline"
              className="h-11 border-amber-500/50"
              onClick={() => setSection("decisions")}
            >
              Open Decisions
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Frontier clear — agents are running free on approved rails only.
          </p>
        </section>
      )}

      {/* Missions in progress (spec §6.7) */}
      <section
        aria-labelledby="overview-missions"
        className="flex flex-col gap-3"
      >
        <h2 id="overview-missions" className="text-base font-semibold">
          Missions in progress
        </h2>
        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">{missionsEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {inProgress.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {m.status} · {m.lanes.length} lane
                    {m.lanes.length === 1 ? "" : "s"} · {m.eta} · updated{" "}
                    {m.started}
                  </p>
                </div>
                <MissionStatusBadge status={m.status} />
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => setSection("missions")}
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent activity — the real ring record, capped at 12 (spec §6.8) */}
      <section
        aria-labelledby="overview-activity"
        className="flex flex-col gap-3"
      >
        <h2 id="overview-activity" className="text-base font-semibold">
          Recent activity
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events on the record yet.
          </p>
        ) : (
          <>
            <ul
              className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5"
              aria-label="The 12 most recent watch events"
            >
              {recent.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border bg-card px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono text-[9px]"
                    >
                      {KIND_LABEL[e.kind]}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {e.ts}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                    {e.text}
                  </p>
                </li>
              ))}
            </ul>
            <div>
              <Button
                variant="link"
                className="h-11 px-0"
                onClick={() => setSection("watch")}
              >
                Open the full Watch feed
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
