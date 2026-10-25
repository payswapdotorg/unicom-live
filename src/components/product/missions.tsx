"use client";

import { useEffect, useRef, useState } from "react";
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

// Missions — the multi-step task board (redesign §7-4d). Project groups file
// their missions under tinted rails, one-offs land below, and every card
// carries its lane chips, its evidence drawer and a session replay you can
// step through. Nothing is claimed without a record behind it. The empty
// state is honest: zero missions means nothing has been commissioned yet —
// the record starts with the first task.

/** Thin custom scrollbar for bounded lists (the long-list law). */
const THIN_SCROLL =
  "[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5";

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
    <div className="flex flex-col gap-6">
      {/* Scaffold (§5) */}
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          UNiCOM Commerce Workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Missions</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Multi-step work, split into lanes and run by workers — reviewed
          before anything touches a store.
        </p>
      </header>

      {missions.length === 0 ? (
        <MissionsEmpty />
      ) : (
        <div className="flex flex-col gap-7">
          {grouped.map(({ group, missions: groupMissions }) => (
            <section
              key={group.id}
              aria-label={`${group.name} missions`}
              className="flex flex-col gap-3"
            >
              <GroupHeader group={group} count={groupMissions.length} />
              <div className="flex gap-3 sm:gap-4">
                <div
                  className={`w-1 shrink-0 rounded-full ${group.tint}`}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-4">
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
            <section
              aria-label="One-off missions"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h2 className="text-base font-semibold">One-offs</h2>
                <Badge variant="secondary" className="text-[10px]">
                  {oneOffs.length}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  not filed under a group
                </p>
              </div>
              <div className="flex flex-col gap-4">
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
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <EvidenceSheet mission={open} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Zero missions — the honest state (§5: typed reason + a real next action). */
function MissionsEmpty() {
  const setSection = useProduct((s) => s.setSection);
  return (
    <section
      aria-labelledby="missions-empty-title"
      className="flex flex-col gap-3 rounded-xl border border-dashed bg-card p-5"
    >
      <h2 id="missions-empty-title" className="text-base font-semibold">
        No missions yet — the honest state
      </h2>
      <p className="text-sm text-muted-foreground">
        Nothing has been commissioned in this workspace — the record starts
        with the first task.
      </p>
      <div>
        <Button className="h-11" onClick={() => setSection("newtask")}>
          Launch a new task
        </Button>
      </div>
    </section>
  );
}

function GroupHeader({ group, count }: { group: ProjectGroup; count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className={`h-2.5 w-2.5 rounded-full ${group.tint}`} aria-hidden />
      <h2 className="text-base font-semibold">{group.name}</h2>
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
      transition={{ delay: 0.05 * Math.min(i, 6) }}
    >
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{m.title}</h3>
                <MissionBadge status={m.status} />
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {m.brief}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
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
            <Button
              variant="outline"
              className="h-11 shrink-0"
              onClick={onEvidence}
            >
              <FileSearch className="mr-1.5 h-4 w-4" /> Evidence
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
            className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

// Per-kind timeline dot: dispatch emerald, tools ink, evidence stone,
// approval waits pulse amber, resumes land as emerald rings, done fills.
const REPLAY_DOT: Record<ReplayEvent["kind"], string> = {
  dispatch: "bg-primary",
  tool: "bg-foreground/45",
  evidence: "bg-muted-foreground/60",
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
  const listRef = useRef<HTMLOListElement | null>(null);
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

  // The timeline is a bounded list — keep the active event in view while
  // playing or stepping.
  useEffect(() => {
    const ol = listRef.current;
    if (!ol) return;
    const el = ol.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [idx]);

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

      <div className={`mt-4 max-h-80 overflow-y-auto pl-1 ${THIN_SCROLL}`}>
        <ol
          ref={listRef}
          aria-label="Session replay timeline"
          className="relative ml-1.5 space-y-3 border-l pl-6"
        >
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
