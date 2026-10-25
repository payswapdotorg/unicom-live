"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  HeartPulse,
  Search,
  Send,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProduct } from "@/lib/product/store";
import { type WatchEvent } from "@/lib/product/data";

// Watch — the resident monitor (redesign §7-4d). One card per connected
// store (the heartbeat cadence, the last sync, the skills standing over
// it), the skills-on-watch summary, and the real event stream: append-only,
// newest first, never rewritten, never fabricated.

/** Thin custom scrollbar for bounded lists (the long-list law). */
const THIN_SCROLL =
  "[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5";

export function WatchSection() {
  const { stores, watchEvents, skills, setSection } = useProduct();
  const installed = skills.filter((s) => s.installedOn.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Scaffold (§5) */}
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          UNiCOM Commerce Workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Watch</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The resident monitor — heartbeats every cycle, self-healing when
          platforms misbehave, everything on the record.
        </p>
      </header>

      <section
        aria-labelledby="watch-monitors"
        className="flex flex-col gap-3"
      >
        <h2 id="watch-monitors" className="text-base font-semibold">
          Store monitors
        </h2>
        {stores.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-card p-5">
            <p className="text-base font-semibold">
              No stores on the ring — the honest state
            </p>
            <p className="text-sm text-muted-foreground">
              The watch has nothing to monitor — connect a store and the
              record starts immediately.
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
          <div className="grid gap-3 sm:grid-cols-2">
            {stores.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * Math.min(i, 6) }}
              >
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <span
                        className={`relative flex h-2 w-2 ${
                          s.health === "attention"
                            ? "text-amber-500"
                            : "text-primary"
                        }`}
                        aria-hidden
                      >
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-1 font-mono text-[10px] text-muted-foreground">
                      <div className="flex justify-between">
                        <span>watch</span>
                        <span className="text-foreground/70">
                          alive · 2m cycle
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>sync</span>
                        <span className="text-foreground/70">
                          {s.lastSync}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>skills</span>
                        <span className="text-foreground/70">
                          {s.installedSkills.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * Math.min(stores.length, 6) }}
            >
              <Card className="h-full border-dashed">
                <CardContent className="flex h-full flex-col justify-center p-4 text-center">
                  <HeartPulse
                    className="mx-auto h-5 w-5 text-primary"
                    aria-hidden
                  />
                  <p className="mt-1.5 text-xs font-medium">
                    {installed.length} skills on watch
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    every cycle leaves a heartbeat
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </section>

      <section
        aria-labelledby="watch-stream"
        className="flex flex-col gap-3"
      >
        <h2 id="watch-stream" className="text-base font-semibold">
          Event stream
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The real ring record, newest first — append-only, never rewritten,
          never fabricated.
        </p>
        {watchEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events on the record yet.
          </p>
        ) : (
          <div
            role="list"
            aria-label="Watch events, newest first"
            className={`flex max-h-96 flex-col gap-2 overflow-y-auto pr-1 ${THIN_SCROLL}`}
          >
            {watchEvents.map((e, i) => (
              <motion.div
                key={e.id}
                role="listitem"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <EventRow event={e} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const KIND_META: Record<
  WatchEvent["kind"],
  { icon: typeof Activity; cls: string; label: string }
> = {
  heartbeat: { icon: HeartPulse, cls: "text-primary", label: "heartbeat" },
  anomaly: { icon: AlertTriangle, cls: "text-amber-500", label: "anomaly" },
  heal: { icon: Wrench, cls: "text-primary", label: "self-heal" },
  review: { icon: Search, cls: "text-muted-foreground", label: "review" },
  dispatch: { icon: Send, cls: "text-foreground/70", label: "dispatch" },
};

function EventRow({ event }: { event: WatchEvent }) {
  const meta = KIND_META[event.kind];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[9px]">
            {meta.label}
          </Badge>
          <span className="font-mono text-[10px] text-muted-foreground">
            {event.ts} · {event.actor}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-foreground/85">
          {event.text}
        </p>
      </div>
    </div>
  );
}
