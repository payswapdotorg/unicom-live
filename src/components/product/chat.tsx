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
// become decisions on the frontier, never silent actions.

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
    { id: "morning-brief", label: "Morning brief" },
    { id: "watch-feed", label: "Watch feed" },
  ];

  // chip ids → REAL labels for the agent: live store names from the stores
  // state (never stale captured strings), plus the standing feeds.
  const contextLabels = (ids: string[]): string[] =>
    ids.map((id) => {
      const store = stores.find((s) => s.id === id);
      if (store) return store.name;
      if (id === "morning-brief") return "Morning brief";
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
    <div className="flex h-[calc(100dvh-12.5rem)] flex-col space-y-4 lg:h-[calc(100dvh-11.5rem)]">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Commander</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One agent, every store. It plans first, shows evidence, and packs
          risky moves as decisions.
        </p>
      </header>

      <Card className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scroller}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
          aria-live="polite"
        >
          {chat.map((m) =>
            m.role === "merchant" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-br-sm border bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                  {m.text}
                </div>
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
            <div className="flex items-center gap-2 pl-8 text-xs text-muted-foreground">
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
              >
                orchestrator thinking…
              </motion.span>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div
            className="mb-2 flex flex-wrap gap-1.5"
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
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[11px] transition-colors ${
                    active
                      ? "border-primary/60 bg-primary/10 font-medium text-primary ring-1 ring-primary/40"
                      : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
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

          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() =>
                  sendChat(
                    s,
                    planFirst,
                    context.length > 0 ? contextLabels(context) : undefined,
                  )
                }
                className="rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
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
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <p className="text-[10px] text-muted-foreground">
              Plans → evidence → decisions. The agent never changes a store
              without your checkbox on the frontier.
            </p>
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
      <div className="max-w-[88%] space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-card">
            <Terminal className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            orchestrator
          </span>
        </div>
        <div className="rounded-xl rounded-bl-sm border bg-card px-3.5 py-2.5 text-sm leading-relaxed">
          {m.text}
        </div>

        {m.diff && (
          <div className="pt-0.5">
            <DiffPreview block={m.diff} />
          </div>
        )}

        {m.diffLink && (
          <button
            type="button"
            onClick={() => onOpenLink(m.diffLink!.section)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
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
