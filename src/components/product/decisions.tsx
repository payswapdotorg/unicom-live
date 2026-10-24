"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  Check,
  ChevronDown,
  FileDiff,
  FileText,
  Mail,
  Tag,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DiffView } from "@/components/product/diff";
import { useProduct } from "@/lib/product/store";
import { type Decision, storeName, platformOf } from "@/lib/product/data";

// Decisions — the trust frontier. Agents propose; you dispose. Every packet
// carries evidence and an expiry, and nothing risky ships without a checkbox.
export function DecisionsSection() {
  const { decisions, resolved, resolveDecision } = useProduct();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The trust frontier — agents propose with evidence; nothing ships
          until you check the box. &ldquo;Continue&rdquo; is never
          authorization for risky moves.
        </p>
      </header>

      {decisions.length === 0 && resolved.length > 0 && (
        <Card className="border-primary/30 bg-primary/[0.05]">
          <CardContent className="flex items-center gap-3 p-5">
            <Check className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Frontier clear.</p>
              <p className="text-xs text-muted-foreground">
                All packets handled — agents are running free on approved
                rails only.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {decisions.length === 0 && resolved.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No decisions yet — skills pack them as they watch.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {decisions.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
            >
              <DecisionCard d={d} onResolve={resolveDecision} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Handled today
          </h2>
          <div className="space-y-1.5">
            {resolved.map((r) => (
              <div
                key={r.decision.id}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground"
              >
                {r.verdict === "approved" ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0 text-destructive" />
                )}
                <span className="truncate">{r.decision.title}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px]">
                  {r.verdict}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// R-B2: the diff reviewer — evidence-first packets expose their before/
// after inline. Policy actions (no diffs) say so instead of faking one.
function DiffSection({ d }: { d: Decision }) {
  const diffs = d.diffs;
  if (!diffs || diffs.length === 0) {
    return (
      <p className="mt-3 text-[10px] italic text-muted-foreground">
        no diff — policy action
      </p>
    );
  }
  return (
    <Collapsible className="mt-3">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="group min-h-11 w-full justify-between border border-dashed px-3"
        >
          <span className="flex items-center gap-1.5">
            <FileDiff className="h-3.5 w-3.5" />
            Review diff
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-2">
          {diffs.map((b) => (
            <DiffView key={b.path} block={b} dense />
          ))}
          {d.diffNote && (
            <p className="font-mono text-[10px] text-muted-foreground">
              {d.diffNote}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DecisionCard({
  d,
  onResolve,
}: {
  d: Decision;
  onResolve: (id: string, verdict: "approved" | "declined") => void;
}) {
  const store = useProduct((s) => s.stores.find((x) => x.id === d.store));
  const Icon =
    d.kind === "price"
      ? BadgeDollarSign
      : d.kind === "listing"
        ? Tag
        : d.kind === "refund"
          ? FileText
          : Mail;

  return (
    <Card
      className={`h-full ${d.risk !== "low" ? "border-amber-500/40" : ""}`}
    >
      <CardContent className="flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h2 className="text-sm font-semibold leading-tight">
                {d.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {storeName(d.store)}
                {store ? ` · ${platformOf(store.platform).name}` : ""} ·
                proposed by {d.proposedBy}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${d.risk !== "low" ? "border-amber-500/50 text-amber-600 dark:text-amber-400" : ""}`}
          >
            {d.risk} risk
          </Badge>
        </div>

        <p className="mt-3 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs font-medium">
          {d.impact}
        </p>

        <dl className="mt-3 space-y-1.5">
          {d.detail.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5 text-xs last:border-0"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-mono">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {d.evidence.map((e) => (
            <span
              key={e}
              className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {e}
            </span>
          ))}
        </div>

        <DiffSection d={d} />

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onResolve(d.id, "declined")}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Decline
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onResolve(d.id, "approved")}
          >
            <Check className="mr-1 h-3.5 w-3.5" /> Approve
          </Button>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {d.expires}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
