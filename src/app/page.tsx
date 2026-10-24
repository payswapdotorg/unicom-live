"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  CheckSquare,
  Ellipsis,
  LayoutDashboard,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useProduct, type Section } from "@/lib/product/store";
import { HeartbeatStrip } from "@/components/product/heartbeat";
import { CommandSection } from "@/components/product/command";
import { StoresSection } from "@/components/product/stores";
import { MissionsSection } from "@/components/product/missions";
import { ChatSection } from "@/components/product/chat";
import { DecisionsSection } from "@/components/product/decisions";
import { WatchSection } from "@/components/product/watch";
import { SkillsSection } from "@/components/product/skills";
import { NewTaskSection } from "@/components/product/newtask";
import { SettingsSection } from "@/components/product/settings";
import { CommandPalette } from "@/components/product/palette";

const NAV: { id: Section; label: string; icon: typeof Radar }[] = [
  { id: "command", label: "Command", icon: LayoutDashboard },
  { id: "stores", label: "Stores", icon: Store },
  { id: "missions", label: "Missions", icon: ListTodo },
  { id: "chat", label: "Commander", icon: MessageSquare },
  { id: "decisions", label: "Decisions", icon: CheckSquare },
  { id: "watch", label: "Watch", icon: Radar },
  { id: "skills", label: "Skills", icon: Puzzle },
  { id: "settings", label: "Settings", icon: Settings },
];

const RAIL_GROUPS: { label: string; ids: NavSection[] }[] = [
  { label: "Operate", ids: ["command", "stores", "missions"] },
  { label: "Safety", ids: ["chat", "decisions", "watch"] },
  { label: "System", ids: ["skills", "settings"] },
];

const MORE_IDS: NavSection[] = ["chat", "decisions", "watch", "skills", "settings"];

type NavSection = Exclude<Section, "newtask">;

const navOf = (id: NavSection) => NAV.find((n) => n.id === id)!;

export default function Home() {
  const { section, setSection, decisions, toastQueue, stores, hydrate } =
    useProduct();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
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

  const moreActive = (MORE_IDS as Section[]).includes(section);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setSection("command")}
            className="flex items-center gap-2.5"
            aria-label="UNiCOM home"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground"
              aria-hidden
            >
              U
            </span>
            <span className="hidden font-semibold tracking-tight sm:block">
              UNiCOM
            </span>
          </button>
          <span className="hidden text-xs text-muted-foreground md:block">
            multi-store command center
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
              className="h-9 gap-2 px-2.5"
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
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button size="sm" onClick={() => setSection("newtask")}>
              <Plus className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">New task</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
        <HeartbeatStrip />
      </header>

      {/* Body: rail + content */}
      <div className="flex flex-1">
        {/* Desktop rail */}
        <nav
          className="sticky top-[5.3rem] hidden h-fit w-56 shrink-0 flex-col gap-1 border-r bg-sidebar p-3 lg:flex"
          aria-label="Primary"
        >
          <Button
            className={`mb-3 w-full justify-start ${
              section === "newtask"
                ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-sidebar"
                : ""
            }`}
            onClick={() => setSection("newtask")}
            aria-current={section === "newtask" ? "page" : undefined}
          >
            <Plus className="mr-1 h-4 w-4" />
            New task
          </Button>

          {RAIL_GROUPS.map((g) => (
            <div key={g.label} className="mb-2">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.label}
              </p>
              <div className="flex flex-col gap-1">
                {g.ids.map((id) => {
                  const n = navOf(id);
                  return (
                    <RailButton
                      key={id}
                      active={section === id}
                      label={n.label}
                      icon={<n.icon className="h-4 w-4" />}
                      badge={id === "decisions" ? decisions.length : 0}
                      onClick={() => setSection(id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-2 rounded-lg border border-dashed p-3 text-[10px] leading-relaxed text-muted-foreground">
            Every agent action leaves evidence. Every risky action needs your
            checkbox. That&apos;s the whole contract.
          </div>
        </nav>

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            {section === "command" && <CommandSection />}
            {section === "stores" && <StoresSection />}
            {section === "missions" && <MissionsSection />}
            {section === "chat" && <ChatSection />}
            {section === "decisions" && <DecisionsSection />}
            {section === "watch" && <WatchSection />}
            {section === "skills" && <SkillsSection />}
            {section === "newtask" && <NewTaskSection />}
            {section === "settings" && <SettingsSection />}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden"
        aria-label="Primary mobile"
      >
        <MobileTabButton
          id="command"
          active={section === "command"}
          onClick={() => setSection("command")}
        />
        <MobileTabButton
          id="stores"
          active={section === "stores"}
          onClick={() => setSection("stores")}
        />

        {/* Elevated center: New task */}
        <div className="relative flex items-end justify-center">
          <button
            type="button"
            onClick={() => setSection("newtask")}
            aria-label="New task"
            aria-current={section === "newtask" ? "page" : undefined}
            className={`flex h-12 w-12 -translate-y-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              section === "newtask" ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""
            }`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <MobileTabButton
          id="missions"
          active={section === "missions"}
          onClick={() => setSection("missions")}
        />
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More sections"
          aria-current={moreActive ? "page" : undefined}
          className={`relative flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
            moreActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <span className="relative">
            <Ellipsis className="h-4 w-4" />
            {decisions.length > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-amber-950">
                {decisions.length}
              </span>
            )}
          </span>
          <span className="truncate">More</span>
        </button>
      </nav>

      {/* Mobile: More sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-1">
            <SheetTitle className="text-left text-base">More</SheetTitle>
            <SheetDescription className="sr-only">
              The rest of the console — Commander chat, decisions, the watch
              feed, skills, and settings.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-1">
            {MORE_IDS.map((id) => {
              const n = navOf(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSection(id);
                    setMoreOpen(false);
                  }}
                  aria-current={section === id ? "page" : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                    section === id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{n.label}</span>
                  {id === "decisions" && decisions.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-amber-950">
                      {decisions.length}
                    </span>
                  )}
                  {section === id && (
                    <span className="font-mono text-[10px] text-primary">
                      here
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* ⌘K command palette (R-B2) */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Footer */}
      <footer className="mt-auto border-t bg-sidebar px-4 py-3 pb-16 sm:px-6 lg:pb-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>
            UNiCOM · every action leaves evidence · nothing risky ships
            without your checkbox
          </span>
          <span className="font-mono">
            watch ring green · powered by zcode
          </span>
        </div>
      </footer>
    </div>
  );
}

function MobileTabButton({
  id,
  active,
  onClick,
}: {
  id: NavSection;
  active: boolean;
  onClick: () => void;
}) {
  const n = navOf(id);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <n.icon className="h-4 w-4" />
      <span className="truncate">{n.label}</span>
    </button>
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
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/30"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
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
