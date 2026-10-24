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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct } from "@/lib/product/store";
import { type WatchEvent } from "@/lib/product/data";

// Watch — the resident monitor. Heartbeats, anomalies, self-heals, dispatches:
// the product never sleeps, and everything it sees lands here.
export function WatchSection() {
  const { stores, watchEvents, skills } = useProduct();
  const installed = skills.filter((s) => s.installedOn.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Watch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The resident monitor — heartbeats every cycle, self-healing when
          platforms misbehave, and a full record of everything observed.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stores.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <span
                    className={`relative flex h-2 w-2 ${s.health === "attention" ? "text-amber-500" : "text-primary"}`}
                    aria-hidden
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                  </span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-[10px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>watch</span>
                    <span className="text-foreground/70">alive · 2m cycle</span>
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
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full border-dashed">
            <CardContent className="flex h-full flex-col justify-center p-4 text-center">
              <HeartPulse className="mx-auto h-5 w-5 text-primary" />
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Event stream
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
          {watchEvents.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <EventRow event={e} />
            </motion.div>
          ))}
        </CardContent>
      </Card>
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
