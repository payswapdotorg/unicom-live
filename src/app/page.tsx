"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  CheckSquare,
  LayoutGrid,
  ListTodo,
  MessageSquare,
  Moon,
  Plus,
  Puzzle,
  Radar,
  Search,
  Settings,
  Store,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProduct, type Section } from "@/lib/product/store";
import { HeartbeatStrip } from "@/components/product/heartbeat";
import { OverviewSection } from "@/components/product/overview";
import { StoresSection } from "@/components/product/stores";
import { MissionsSection } from "@/components/product/missions";
import { ChatSection } from "@/components/product/chat";
import { DecisionsSection } from "@/components/product/decisions";
import { WatchSection } from "@/components/product/watch";
import { SkillsSection } from "@/components/product/skills";
import { NewTaskSection } from "@/components/product/newtask";
import { SettingsSection } from "@/components/product/settings";
import { CommandPalette } from "@/components/product/palette";

// The console shell (spec §4): skip link → topbar (mark + wordmark + framing
// chip + live badge + ⌘K + theme + New task) → the resident-watch heartbeat
// strip → the desktop w-64 iconed sidebar (Workspace group, pinned Settings,
// the dashed trust-contract card) or the mobile horizontal scroll nav row →
// the max-w-3xl content column → the honest footer (durability fact + counts
// from the loaded state only). The section switch mechanism, the toast-queue
// drain, the ⌘K palette and the boot hydration are all unchanged (spec §1).

/** The 7 workspace sections + pinned Settings (spec §2 order). */
const NAV: { id: Section; label: string; icon: typeof Radar }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "missions", label: "Missions", icon: ListTodo },
  { id: "chat", label: "Commander", icon: MessageSquare },
  { id: "decisions", label: "Decisions", icon: CheckSquare },
  { id: "stores", label: "Stores", icon: Store },
  { id: "watch", label: "Watch", icon: Radar },
  { id: "skills", label: "Skills", icon: Puzzle },
];

const SETTINGS_NAV: { id: Section; label: string; icon: typeof Radar } = {
  id: "settings",
  label: "Settings",
  icon: Settings,
};

type NavSection = Exclude<Section, "newtask">;

export default function Home() {
  const {
    section,
    setSection,
    decisions,
    stores,
    missions,
    toastQueue,
    hydrate,
    live,
    hydrating,
  } = useProduct();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // drain the store's toast queue → shadcn toasts
  useEffect(() => {
    if (toastQueue.length === 0) return;
    const [first, ...rest] = toastQueue;
    useProduct.setState({ toastQueue: rest });
    toast({ title: first.title, description: first.desc });
  }, [toastQueue, toast]);

  // R-C2: boot hydration — the mock seeds paint instantly; live DB data
  // swaps in when it lands (never blocks first paint).
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Honest footer (spec §4.6) — the durability fact from `live`, the
  // counts line only from the loaded state.
  const durability = live
    ? "Missions, decisions and chat are persisted by the workspace backend and survive reloads."
    : "Backend unreachable — running on demo data; changes stay in this session.";
  const countsLine = hydrating
    ? "Workspace counts load with the backend."
    : `${stores.length} stores · ${missions.length} missions · ${decisions.length} decisions open — counted from the loaded workspace state.`;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Skip link — the first focusable element (spec §4.1) */}
      <a
        href="#console-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      {/* Topbar (spec §4.2) */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setSection("overview")}
            className="flex min-h-11 items-center gap-2.5 rounded-md px-1"
            aria-label="UNiCOM home"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#131211]"
              aria-hidden
            >
              <svg
                viewBox="0 0 32 32"
                className="h-7 w-7"
                aria-hidden
                focusable="false"
              >
                <circle
                  cx="16"
                  cy="16"
                  r="8.5"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.4"
                />
                <circle cx="22.5" cy="9.5" r="2.6" fill="#10b981" />
              </svg>
            </span>
            <span className="font-semibold tracking-tight">UNiCOM</span>
          </button>
          <span className="hidden rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground sm:block">
            Commerce Workspace
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden gap-1.5 font-mono text-[10px] text-primary sm:flex"
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {stores.length} stores live
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette"
              aria-keyshortcuts="Meta+K Control+K"
              className="h-11 gap-2 px-2.5"
            >
              <Search className="h-4 w-4" aria-hidden />
              <kbd
                className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-block"
                aria-hidden
              >
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="h-11 w-11"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              size="sm"
              className="h-11"
              onClick={() => setSection("newtask")}
            >
              <Plus className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">New task</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
        <HeartbeatStrip />
      </header>

      {/* Mobile section nav — the payswap horizontal scroll row (spec §4.5);
          replaces the bottom bar + FAB + More sheet entirely */}
      <nav
        aria-label="Workspace sections"
        className="flex gap-1 overflow-x-auto border-b bg-background px-3 py-2 lg:hidden"
      >
        {([...NAV, SETTINGS_NAV] as { id: NavSection; label: string; icon: typeof Radar }[]).map(
          (n) => {
            const active = section === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setSection(n.id)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm transition-colors ${
                  active
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" aria-hidden />
                {n.label}
                {n.id === "decisions" && decisions.length > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-amber-950">
                    {decisions.length}
                  </span>
                )}
              </button>
            );
          },
        )}
      </nav>

      {/* Body: rail + content (spec §4.4) */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <nav
          aria-label="Workspace sections"
          className="sticky top-[calc(3.5rem+2rem)] hidden h-fit w-64 shrink-0 flex-col border-r bg-sidebar px-3 py-4 lg:flex"
        >
          <Button
            className="mb-3 min-h-11 w-full justify-start"
            onClick={() => setSection("newtask")}
            aria-current={section === "newtask" ? "page" : undefined}
          >
            <Plus className="mr-1 h-4 w-4" />
            New task
          </Button>

          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {NAV.map((n) => (
              <RailButton
                key={n.id}
                active={section === n.id}
                label={n.label}
                icon={<n.icon className="h-4 w-4" />}
                badge={n.id === "decisions" ? decisions.length : 0}
                onClick={() => setSection(n.id)}
              />
            ))}
          </div>

          <div className="mt-1 border-t" aria-hidden />
          <div className="mt-1 flex flex-col gap-1">
            <RailButton
              active={section === SETTINGS_NAV.id}
              label={SETTINGS_NAV.label}
              icon={<SETTINGS_NAV.icon className="h-4 w-4" />}
              badge={0}
              onClick={() => setSection(SETTINGS_NAV.id)}
            />
          </div>

          <div className="mt-auto rounded-lg border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
            Every agent action leaves evidence. Every risky action needs your
            checkbox. That's the whole contract.
          </div>
        </nav>

        {/* Content — the max-w-3xl payswap column */}
        <main
          id="console-main"
          tabIndex={-1}
          className="min-w-0 flex-1 scroll-mt-24 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-10"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {section === "overview" && <OverviewSection />}
            {section === "missions" && <MissionsSection />}
            {section === "chat" && <ChatSection />}
            {section === "decisions" && <DecisionsSection />}
            {section === "stores" && <StoresSection />}
            {section === "watch" && <WatchSection />}
            {section === "skills" && <SkillsSection />}
            {section === "newtask" && <NewTaskSection />}
            {section === "settings" && <SettingsSection />}
          </div>
        </main>
      </div>

      {/* ⌘K command palette (R-B2) */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Honest footer (spec §4.6) */}
      <footer className="mt-auto border-t bg-sidebar px-4 py-3 pb-[env(safe-area-inset-bottom)] text-xs text-muted-foreground sm:px-6 lg:pb-3">
        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          <p>
            UNiCOM Commerce Workspace — {durability} No live store corridors
            are connected; nothing here executes or simulates real store
            writes.
          </p>
          <p>{countsLine}</p>
        </div>
      </footer>
    </div>
  );
}

function RailButton({
  active,
  label,
  icon,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  badge: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-amber-950">
          {badge}
        </span>
      )}
    </button>
  );
}
