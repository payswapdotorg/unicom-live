"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  GitBranch,
  History,
  Pause,
  Play,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useProduct } from "@/lib/product/store";
import {
  type Mission,
  type MissionLane,
  type MissionReplay,
  type ProjectGroup,
  type ReplayEvent,
  type StoreConnection,
  SEED_REPLAYS,
  platformOf,
  storeName,
} from "@/lib/product/data";

// Missions — the multi-agent task board. Cards group under project rails
// (R-B2), every card carries a session replay you can step through, and the
// evidence drawer keeps every lane's chips verbatim. Nothing is claimed
// without a record behind it.

// Every mission gets a replay: seeds carry hand-packed transcripts, missions
// launched from the composer get a synthesized two-event one.
function replayFor(m: Mission): MissionReplay {
  const seed = SEED_REPLAYS[m.id];
  if (seed) return seed;
  return {
    events: [
      {
        ts: m.started,
        kind: "dispatch",
        actor: "orchestrator",
        text: `Mission dispatched — ${m.stores.length} store${m.stores.length === 1 ? "" : "s"} in scope`,
      },
      {
        ts: m.started,
        kind: "tool",
        actor: "planner",
        text: "plan forming — first evidence lands in a moment",
      },
    ],
  };
}

export function MissionsSection() {
  const missions = useProduct((s) => s.missions);
  const stores = useProduct((s) => s.stores);
  const groups = useProduct((s) => s.groups);
  const [open, setOpen] = useState<Mission | null>(null);

  const grouped = groups
    .map((g) => ({ group: g, missions: missions.filter((m) => m.groupId === g.id) }))
    .filter((x) => x.missions.length > 0);
  const oneOffs = missions.filter(
    (m) => !m.groupId || !groups.some((g) => g.id === m.groupId),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Multi-step work, split into lanes and run by workers — reviewed by
          the orchestrator before anything touches a store.
        </p>
      </header>

      <div className="space-y-7">
        {grouped.map(({ group, missions: groupMissions }) => (
          <section key={group.id} aria-label={`${group.name} missions`}>
            <GroupHeader group={group} count={groupMissions.length} />
            <div className="mt-3 flex gap-3 sm:gap-4">
              <div
                className={`w-1 shrink-0 rounded-full ${group.tint}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-4">
                {groupMissions.map((m, i) => (
                  <MissionCard
                    key={m.id}
                    m={m}
                    i={i}
                    group={group}
                    stores={stores}
                    onEvidence={() => setOpen(m)}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}

        {oneOffs.length > 0 && (
          <section aria-label="One-off missions">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-sm font-semibold text-muted-foreground">
                One-offs
              </h2>
              <Badge variant="secondary" className="text-[10px]">
                {oneOffs.length}
              </Badge>
              <p className="text-xs text-muted-foreground/70">
                not filed under a group
              </p>
            </div>
            <div className="mt-3 space-y-4">
              {oneOffs.map((m, i) => (
                <MissionCard
                  key={m.id}
                  m={m}
                  i={i}
                  group={undefined}
                  stores={stores}
                  onEvidence={() => setOpen(m)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <EvidenceSheet mission={open} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function GroupHeader({ group, count }: { group: ProjectGroup; count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className={`h-2.5 w-2.5 rounded-full ${group.tint}`} aria-hidden />
      <h2 className="text-sm font-semibold">{group.name}</h2>
      <p className="hidden text-xs text-muted-foreground sm:block">
        {group.blurb}
      </p>
      <Badge variant="secondary" className="text-[10px]">
        {count}
      </Badge>
      <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
        {group.id}
      </span>
    </div>
  );
}

function MissionCard({
  m,
  i,
  group,
  stores,
  onEvidence,
}: {
  m: Mission;
  i: number;
  group?: ProjectGroup;
  stores: StoreConnection[];
  onEvidence: () => void;
}) {
  const [replayOpen, setReplayOpen] = useState(false);
  const replay = replayFor(m);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * i }}
    >
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">{m.title}</h2>
                <MissionBadge status={m.status} />
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {m.brief}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3 w-3" /> started {m.started}
                </span>
                <span>{m.eta}</span>
                <span className="inline-flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> {m.lanes.length} lanes
                </span>
                {group && (
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${group.tint}`}
                      aria-hidden
                    />
                    {group.name}
                  </span>
                )}
                <span>
                  {m.stores.map((s) => {
                    const st = stores.find((x) => x.id === s);
                    return st
                      ? `${storeName(s)} (${platformOf(st.platform).name})`
                      : s;
                  }).join(" · ")}
                </span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={onEvidence}>
              <FileSearch className="mr-1 h-3.5 w-3.5" /> Evidence
            </Button>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {m.lanes.map((l) => (
              <LaneChip key={l.id} lane={l} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setReplayOpen((v) => !v)}
            aria-expanded={replayOpen}
            aria-controls={`${m.id}-replay`}
            className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <History className="h-3.5 w-3.5" aria-hidden />
            Session replay
            <span className="font-mono text-[10px] text-muted-foreground/70">
              {replay.events.length} events
            </span>
            <ChevronDown
              className={`ml-auto h-4 w-4 transition-transform ${
                replayOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>

          {replayOpen && (
            <div id={`${m.id}-replay`} className="mt-3">
              <ReplayPlayer mission={m} replay={replay} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Per-kind timeline dot: dispatch primary, tools violet, evidence stone,
// approval waits pulse amber, resumes land as emerald rings, done fills.
const REPLAY_DOT: Record<ReplayEvent["kind"], string> = {
  dispatch: "bg-primary",
  tool: "bg-violet-500",
  evidence: "bg-stone-400",
  "approval-wait": "bg-amber-500 animate-pulse",
  resume: "bg-card ring-2 ring-emerald-500",
  done: "bg-emerald-500",
};

function ReplayPlayer({
  mission,
  replay,
}: {
  mission: Mission;
  replay: MissionReplay;
}) {
  const events = replay.events;
  const last = events.length - 1;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const atEnd = idx >= last;

  // Play auto-advances every 1200ms and stops once it lands on the final
  // event (end of session). Replaying from the end restarts at 0.
  useEffect(() => {
    if (!playing || atEnd) return;
    const t = setTimeout(() => {
      if (idx >= last - 1) {
        setIdx(last);
        setPlaying(false);
      } else {
        setIdx(idx + 1);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [playing, atEnd, idx, last]);

  const state = playing ? "playing" : atEnd ? "end of session" : "paused";

  return (
    <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            disabled={idx <= 0}
            onClick={() => {
              setPlaying(false);
              setIdx((v) => Math.max(v - 1, 0));
            }}
            aria-label="Previous replay event"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => {
              if (playing) {
                setPlaying(false);
                return;
              }
              if (atEnd) setIdx(0); // replay from the end restarts at 0
              setPlaying(last > 0);
            }}
            aria-label={playing ? "Pause session replay" : "Play session replay"}
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            disabled={atEnd}
            onClick={() => {
              setPlaying(false);
              setIdx((v) => Math.min(v + 1, last));
            }}
            aria-label="Next replay event"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          {idx + 1} / {events.length} · {state}
        </p>
        <p className="ml-auto hidden font-mono text-[10px] text-muted-foreground/70 sm:block">
          replay · {mission.id}
        </p>
      </div>

      <ol className="relative ml-1.5 mt-4 space-y-3 border-l pl-6">
        {events.map((ev, i) => (
          <li
            key={`${ev.ts}-${i}`}
            className={`relative transition-opacity duration-300 ${
              i <= idx ? "" : "opacity-40"
            }`}
          >
            <span
              aria-hidden
              className={`absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full ${REPLAY_DOT[ev.kind]}`}
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-mono text-[10px] text-muted-foreground">
                {ev.ts}
              </span>
              <span className="rounded border bg-card px-1 py-px font-mono text-[9px] text-muted-foreground">
                {ev.actor}
              </span>
              {ev.duration && (
                <span className="ml-auto font-mono text-[10px] text-foreground/70">
                  {ev.duration}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground/85">
              {ev.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MissionBadge({ status }: { status: Mission["status"] }) {
  const map: Record<Mission["status"], { label: string; cls: string }> = {
    running: { label: "running", cls: "border-primary/40 text-primary" },
    "in-review": { label: "in review", cls: "border-amber-500/50 text-amber-600 dark:text-amber-400" },
    "awaiting-approval": { label: "awaiting you", cls: "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    done: { label: "done", cls: "border-primary/40 bg-primary/10 text-primary" },
  };
  const m = map[status];
  return (
    <Badge variant="outline" className={`text-[10px] ${m.cls}`}>
      {status === "running" && <Play className="mr-1 h-2.5 w-2.5" />}
      {m.label}
    </Badge>
  );
}

function LaneChip({ lane }: { lane: MissionLane }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium">{lane.name}</p>
        <span
          className={`shrink-0 rounded-full border px-1.5 py-px font-mono text-[9px] ${
            lane.status === "done"
              ? "border-primary/40 text-primary"
              : lane.status === "in-review"
                ? "border-amber-500/50 text-amber-600 dark:text-amber-400"
                : "border-primary/30 text-primary"
          }`}
        >
          {lane.status}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Progress value={lane.progress} className="h-1" />
        <span className="font-mono text-[10px] text-muted-foreground">
          {lane.progress}%
        </span>
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
        worker {lane.worker}
      </p>
    </div>
  );
}

function EvidenceSheet({ mission }: { mission: Mission }) {
  return (
    <>
      <SheetHeader className="px-1">
        <SheetTitle className="pr-6 text-left">{mission.title}</SheetTitle>
        <SheetDescription className="text-left">
          The evidence trail — every lane&apos;s chips, verbatim. Nothing is
          claimed without a record behind it.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-4 px-1 pb-6">
        {mission.lanes.map((l) => (
          <div key={l.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{l.name}</p>
              <span className="font-mono text-[10px] text-muted-foreground">
                {l.worker}
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {l.evidence.map((e) => (
                <li
                  key={e}
                  className="rounded border bg-muted/50 px-2 py-1 font-mono text-[11px] text-foreground/80"
                >
                  {e}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="rounded-lg border border-dashed p-3 font-mono text-[11px] text-muted-foreground">
          diff bundle 41f2c9 · tl-review PASS · ship-gates 8/8
        </div>
      </div>
    </>
  );
}
