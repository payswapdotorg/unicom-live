"use client";

import type { DiffBlock, DiffRow } from "@/lib/product/data";

// Diffs — before/after evidence rendered as mono rows. Context rows are muted
// scenery; "−" rows show what changes away, "+" rows what lands instead.
// DiffView is the full block; DiffPreview is the first-rows teaser used in
// chat (c-1) with a pointer to the decision for the rest.

const ROW_CLS: Record<DiffRow["kind"], string> = {
  context: "text-muted-foreground",
  "-": "bg-red-500/10 text-red-600 dark:text-red-400",
  "+": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const MARKER: Record<DiffRow["kind"], string> = {
  context: "·",
  "-": "−",
  "+": "+",
};

function DiffRows({
  rows,
  dense,
}: {
  rows: DiffRow[];
  dense: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <div className={dense ? "text-[10px]" : "text-xs"}>
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-baseline gap-2 whitespace-nowrap ${
              dense ? "px-2.5 py-0.5" : "px-3 py-1"
            } ${ROW_CLS[row.kind]}`}
          >
            <span className="w-3 shrink-0 select-none" aria-hidden>
              {MARKER[row.kind]}
            </span>
            <span className="min-w-0 flex-1">
              {row.label ? `${row.label}: ` : ""}
              {row.value}
            </span>
            {row.note && (
              <span className="shrink-0 text-muted-foreground">
                {row.note}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiffView({
  block,
  dense = false,
}: {
  block: DiffBlock;
  dense?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div
        className={`flex items-center justify-between gap-3 border-b bg-muted/40 ${
          dense ? "px-2.5 py-1.5" : "px-3 py-2"
        }`}
      >
        <p className="min-w-0 truncate font-mono text-[10px] text-muted-foreground">
          {block.path}
        </p>
        {block.summary && (
          <p className="shrink-0 font-mono text-[10px] text-foreground/70">
            {block.summary}
          </p>
        )}
      </div>
      <DiffRows rows={block.rows} dense={dense} />
    </div>
  );
}

export function DiffPreview({ block }: { block: DiffBlock }) {
  const shown = block.rows.slice(0, 3);
  const rest = block.rows.length - shown.length;
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-2.5 py-1.5">
        <p className="min-w-0 truncate font-mono text-[10px] text-muted-foreground">
          {block.path}
        </p>
        {block.summary && (
          <p className="shrink-0 font-mono text-[10px] text-foreground/70">
            {block.summary}
          </p>
        )}
      </div>
      <DiffRows rows={shown} dense />
      {rest > 0 && (
        <p className="border-t px-2.5 py-1 text-[10px] italic text-muted-foreground">
          +{rest} more row{rest === 1 ? "" : "s"} — open the decision for the
          full diff
        </p>
      )}
    </div>
  );
}
