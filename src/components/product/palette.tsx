"use client";

import { useEffect } from "react";
import {
  CheckSquare,
  LayoutGrid,
  ListTodo,
  MessageSquare,
  Plug,
  Puzzle,
  Radar,
  RefreshCw,
  Rocket,
  Settings,
  Sparkles,
  Store,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useProduct, type Section } from "@/lib/product/store";

// ⌘K — the command palette. Jump to any of the eight sections, run the
// standing actions, or pick up the latest watch events. The whole console
// is reachable without touching the rail (R-B2). New task stays a standing
// action (the primary commission path), not a section nav item.

const NAV_ITEMS: { id: Section; label: string; icon: typeof Radar }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "missions", label: "Missions", icon: ListTodo },
  { id: "chat", label: "Commander", icon: MessageSquare },
  { id: "decisions", label: "Decisions", icon: CheckSquare },
  { id: "stores", label: "Stores", icon: Store },
  { id: "watch", label: "Watch", icon: Radar },
  { id: "skills", label: "Skills", icon: Puzzle },
  { id: "settings", label: "Settings", icon: Settings },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setSection = useProduct((s) => s.setSection);
  const syncAllStores = useProduct((s) => s.syncAllStores);
  const watchEvents = useProduct((s) => s.watchEvents);

  // ⌘K / Ctrl+K toggles the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (section: Section) => {
    setSection(section);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump to a section or run an action."
      className="sm:max-w-lg"
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>
          No results — try “reprice” or “settings”
        </CommandEmpty>

        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((n) => (
            <CommandItem key={n.id} onSelect={() => go(n.id)}>
              <n.icon className="h-4 w-4" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("newtask")}>
            <Rocket className="h-4 w-4" />
            Launch a new task
          </CommandItem>
          <CommandItem onSelect={() => go("stores")}>
            <Plug className="h-4 w-4" />
            Connect a store
          </CommandItem>
          <CommandItem
            onSelect={() => {
              syncAllStores();
              onOpenChange(false);
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Sync all stores
          </CommandItem>
          <CommandItem onSelect={() => go("overview")}>
            <Sparkles className="h-4 w-4" />
            Open today's brief
          </CommandItem>
        </CommandGroup>

        {watchEvents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent">
              {watchEvents.slice(0, 4).map((e) => (
                <CommandItem
                  key={e.id}
                  value={`recent ${e.ts} ${e.actor} ${e.text}`}
                  onSelect={() => go("watch")}
                >
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {e.ts}
                  </span>
                  <span className="min-w-0 truncate">{e.text}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
