"use client";

import { useEffect, useState } from "react";
import { useProduct } from "@/lib/product/store";

// The resident-watch concept made visible: a thin, always-on telemetry strip.
// Live-ticking mono text with pulsing dots — the product's heartbeat.
export function HeartbeatStrip() {
  // null until the first client tick — a Date seeded in render state would
  // differ between SSR and hydration (different seconds) and mismatch React.
  const [now, setNow] = useState<Date | null>(null);
  const stores = useProduct((s) => s.stores);
  const decisions = useProduct((s) => s.decisions);

  useEffect(() => {
    // first tick via setTimeout (not in the effect body — the
    // react-hooks/set-state-in-effect rule), then the 1s interval
    const first = setTimeout(() => setNow(new Date()), 0);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  const utc = (now ?? new Date(0)).toISOString().slice(11, 19) + "Z";
  const watching = stores.length;

  return (
    <div
      className="flex items-center gap-4 overflow-x-auto border-b bg-sidebar px-4 py-1.5 font-mono text-[11px] tracking-tight text-muted-foreground sm:px-6"
      role="status"
      aria-label="Live watch telemetry"
    >
      <span className="flex shrink-0 items-center gap-1.5">
        <PulseDot className="text-primary" />
        watch&nbsp;
        <span className="text-foreground/80">{watching} stores</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <PulseDot className="text-primary" />
        sync&nbsp;
        <span className="text-foreground/80">nominal</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <PulseDot
          className={decisions.length > 0 ? "text-amber-500" : "text-primary"}
          slow={decisions.length > 0}
        />
        review&nbsp;
        <span className="text-foreground/80">
          {decisions.length > 0 ? `${decisions.length} awaiting you` : "clear"}
        </span>
      </span>
      <span className="ml-auto shrink-0 tabular-nums" aria-hidden>
        {utc}
      </span>
    </div>
  );
}

function PulseDot({
  className,
  slow = false,
}: {
  className?: string;
  slow?: boolean;
}) {
  return (
    <span className="relative inline-flex h-2 w-2" aria-hidden>
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${className} ${slow ? "[animation-duration:2.5s]" : ""}`}
      />
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${className}`}
      />
    </span>
  );
}
