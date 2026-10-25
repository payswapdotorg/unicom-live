"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Send, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { DiffPreview } from "@/components/product/diff";
import { useProduct, type ChatMessage, type Section } from "@/lib/product/store";
import { platformOf } from "@/lib/product/data";

// Commander — the chat-first surface. You talk; the orchestrator plans,
// acts across every connected store, and reports evidence inline.
// Plan-first (R-B2): the proposed plan holds at step 0 until you approve
// it. @-context chips pin what the agent should work with. Risky steps
// become decisions on the frontier, never silent actions. The transcript
// is a bounded, keyboard-scrollable record — merchant right, agent left,
// ids honest in mono.

export function ChatSection() {
  const {
    chat,
    chatThinking,
    sendChat,
    tickPlan,
    approvePlan,
    pushToast,
    setSection,
  } = useProduct();
  const stores = useProduct((s) => s.stores);
  const [draft, setDraft] = useState("");
  const [planFirst, setPlanFirst] = useState(true);
  const [context, setContext] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, chatThinking]);

  // Tick every approved-but-unfinished plan forward; held plans (plan
  // first, not yet approved) stay frozen at step 0.
  useEffect(() => {
    const timers = chat
      .filter(
        (m) =>
          m.role === "agent" &&
          m.plan &&
          m.planApproved !== false &&
          (m.planDone ?? 0) < m.plan.length,
      )
      .map((m) => setTimeout(() => tickPlan(m.id), 900));
    return () => timers.forEach((t) => clearTimeout(t));
  }, [chat, tickPlan]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    sendChat(text, planFirst, context.length > 0 ? contextLabels(context) : undefined);
    setDraft("");
  };

  // @-context chips: one per connected store, plus the standing feeds.
  const contextChips: {
    id: string;
    label: string;
    glyph?: string;
    tint?: string;
  }[] = [
    ...stores.map((s) => {
      const p = platformOf(s.platform);
      return { id: s.id, label: `@${s.name}`, glyph: p.glyph, tint: p.tint };
    }),
    { id: "morning-brief", label: "Today's brief" },
    { id: "watch-feed", label: "Watch feed" },
  ];

  // chip ids → REAL labels for the agent: live store names from the stores
  // state (never stale captured strings), plus the standing feeds.
  const contextLabels = (ids: string[]): string[] =>
    ids.map((id) => {
      const store = stores.find((s) => s.id === id);
      if (store) return store.name;
      if (id === "morning-brief") return "Today's brief";
      if (id === "watch-feed") return "Watch feed";
      return id;
    });

  const toggleContext = (id: string) =>
    setContext((cs) =>
      cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id],
    );

  const suggestions = [
    "Why did Etsy revenue jump 24%?",
    "Reprice the linen throw",
    "Draft a recovery email for abandoned carts",
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Scaffold (spec §5) */}
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          UNiCOM Commerce Workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Commander</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          One agent, every store. It plans first, shows evidence, and packs
          risky moves as decisions.
        </p>
      </header>

      <Card className="gap-0 py-0" aria-label="Conversation with the agent">
        {/* Transcript — a bounded record, scrolled to newest */}
        <div
          ref={scroller}
          tabIndex={0}
          aria-live="polite"
          className="flex max-h-[34rem] min-h-56 flex-col gap-4 overflow-y-auto p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-inset sm:p-5 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5"
        >
          {chat.map((m) =>
            m.role === "merchant" ? (
              <div key={m.id} className="flex flex-col items-end gap-1">
                <div className="max-w-[85%] rounded-xl bg-secondary px-3.5 py-2.5 text-sm leading-relaxed text-secondary-foreground">
                  {m.text}
                </div>
                <p className="pr-1 font-mono text-xs text-muted-foreground">
                  {m.id}
                </p>
              </div>
            ) : (
              <AgentMessage
                key={m.id}
                m={m}
                onApprove={() => approvePlan(m.id)}
                onRequestChanges={() =>
                  pushToast(
                    "Change request sent",
                    "The agent will revise the plan before doing anything.",
                  )
                }
                onOpenLink={(section) => setSection(section)}
              />
            ),
          )}
          {chatThinking && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md border bg-card"
                aria-hidden
              >
                <Terminal className="h-3.5 w-3.5 text-primary" />
              </span>
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
              >
                orchestrator thinking…
              </motion.span>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t p-4 sm:p-5">
          <div
            className="mb-3 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Pin context for the agent"
          >
            {contextChips.map((c) => {
              const active = context.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleContext(c.id)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                    active
                      ? "border-primary/40 bg-accent font-medium text-accent-foreground"
                      : "bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                  }`}
                >
                  {c.glyph && (
                    <span className={`font-semibold ${c.tint}`} aria-hidden>
                      {c.glyph}
                    </span>
                  )}
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  sendChat(
                    s,
                    planFirst,
                    context.length > 0 ? contextLabels(context) : undefined,
                  )
                }
                className="min-h-11 rounded-full border bg-card px-3.5 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Tell the agent what you need…"
              aria-label="Message the agent"
              className="h-11 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11"
              disabled={!draft.trim()}
            >
              <Send className="h-4 w-4" aria-hidden />
              <span className="sr-only">Send</span>
            </Button>
          </form>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="text-xs text-muted-foreground">
              Plans → evidence → decisions. The agent never changes a store
              without your checkbox on the frontier.
            </p>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={planFirst}
                onCheckedChange={setPlanFirst}
                aria-label="Plan first"
              />
              <span className="font-medium text-foreground/80">
                Plan first
              </span>
              <span className="hidden sm:inline">
                — agent proposes a plan before acting
              </span>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AgentMessage({
  m,
  onApprove,
  onRequestChanges,
  onOpenLink,
}: {
  m: ChatMessage;
  onApprove: () => void;
  onRequestChanges: () => void;
  onOpenLink: (section: Section) => void;
}) {
  const held = m.plan && m.planApproved === false;
  const finished =
    m.plan &&
    m.planApproved &&
    (m.planDone ?? 0) >= (m.plan?.length ?? 0);

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[88%] flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md border bg-card"
            aria-hidden
          >
            <Terminal className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            orchestrator
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {m.id}
          </span>
        </div>
        <div className="rounded-xl border bg-card px-3.5 py-2.5 text-sm leading-relaxed">
          {m.text}
        </div>

        {m.evidence && m.evidence.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-8">
            {m.evidence.map((e) => (
              <span
                key={e}
                className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {e}
              </span>
            ))}
          </div>
        )}

        {m.diff && (
          <div className="pt-0.5">
            <DiffPreview block={m.diff} />
          </div>
        )}

        {m.diffLink && (
          <button
            type="button"
            onClick={() => onOpenLink(m.diffLink!.section)}
            className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {m.diffLink.label}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </button>
        )}

        {m.plan && (
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {held ? "plan — awaiting your approval" : "plan"}
            </p>
            <ol className="space-y-1.5">
              {m.plan.map((step, i) => {
                const done = i < (m.planDone ?? 0);
                const active = i === (m.planDone ?? 0);
                return (
                  <li
                    key={step}
                    className={`flex items-center gap-2 text-xs transition-opacity ${done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground opacity-60"}`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${done ? "border-primary bg-primary text-primary-foreground" : ""}`}
                      aria-hidden
                    >
                      {done ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                    {step}
                    {active && !held && (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="text-primary"
                      >
                        ▍
                      </motion.span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {held && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              onClick={onApprove}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Approve plan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="min-h-11 text-muted-foreground"
              onClick={onRequestChanges}
            >
              Request changes
            </Button>
          </div>
        )}

        {finished && (
          <p className="font-mono text-[10px] text-muted-foreground">
            plan approved — execution continues
          </p>
        )}
      </div>
    </div>
  );
}
