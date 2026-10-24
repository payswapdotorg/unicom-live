"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Plus,
  RefreshCw,
  Search,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useProduct } from "@/lib/product/store";
import {
  PLATFORMS,
  type PlatformId,
  platformOf,
} from "@/lib/product/data";

// Stores — the connection hub. Connect once, in one place; every connected
// store joins the watch ring and becomes commandable by the agents.
export function StoresSection() {
  const { stores, setSection } = useProduct();
  const [query, setQuery] = useState("");
  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.domain.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stores.length} connected · one ring, one catalog, one watch
          </p>
        </div>
        <ConnectButton />
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stores…"
          className="pl-8"
          aria-label="Search stores"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s, i) => {
          const p = platformOf(s.platform);
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border text-base font-semibold ${p.tint}`}
                        aria-hidden
                      >
                        {p.glyph}
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {s.name}
                        </CardTitle>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.domain} · {p.name}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        s.health === "healthy"
                          ? "default"
                          : s.health === "attention"
                            ? "destructive"
                            : "secondary"
                      }
                      className="shrink-0"
                    >
                      {s.health === "syncing" && (
                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      {s.health}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat label="products" value={s.products.toLocaleString()} />
                    <Stat label="orders 7d" value={String(s.orders7d)} />
                    <Stat
                      label="revenue 7d"
                      value={`$${(s.revenue7d / 1000).toFixed(1)}k`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      vs last week{" "}
                      <span
                        className={
                          s.delta7d >= 0 ? "text-primary" : "text-destructive"
                        }
                      >
                        {s.delta7d >= 0 ? "+" : ""}
                        {s.delta7d}%
                      </span>
                    </span>
                    <span>
                      synced {s.lastSync} · audit {s.lastAudit}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>API budget</span>
                      <span className="font-mono">{s.apiUsage}%</span>
                    </div>
                    <Progress value={s.apiUsage} className="h-1.5" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.installedSkills.length === 0 ? (
                      <button
                        onClick={() => setSection("skills")}
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      >
                        + install skills
                      </button>
                    ) : (
                      s.installedSkills.map((sk) => (
                        <Badge
                          key={sk}
                          variant="secondary"
                          className="font-mono text-[10px]"
                        >
                          {sk}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <Store className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium">More stores, one command center</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Every platform you connect joins the same ring: shared watch,
            shared agent pool, shared evidence trail. Connect your next store
            in under a minute.
          </p>
          <ConnectButton variant="outline" />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-1.5">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ConnectButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> Connect a store
      </Button>
      <ConnectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

const CONNECT_COPY = [
  { title: "Authorize", desc: "A secure OAuth window opens on the platform. You approve; we never see your password." },
  { title: "Sync", desc: "We pull products, orders, and inventory into the ring — read-only until you grant more." },
  { title: "Watch", desc: "Your store joins the nightly audit and the heartbeat strip. Agents can now act on it." },
];

export function ConnectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { connecting, startConnect, advanceConnect, finishConnect, cancelConnect } =
    useProduct();
  const [picked, setPicked] = useState<PlatformId | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  // drive the fake OAuth progress
  useEffect(() => {
    if (!connecting) return;
    if (connecting.step >= CONNECT_COPY.length) {
      const p = platformOf(connecting.platform as PlatformId);
      const t = setTimeout(() => {
        finishConnect({
          id: `store-${Date.now()}`,
          name: name || `My ${p.name} store`,
          domain: domain || `my-store.${p.id}.com`,
          platform: p.id,
          health: "syncing",
          lastSync: "just now",
          lastAudit: "queued",
          products: 0,
          orders7d: 0,
          revenue7d: 0,
          delta7d: 0,
          apiUsage: 0,
        });
        setPicked(null);
        setName("");
        setDomain("");
      }, 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(advanceConnect, 900);
    return () => clearTimeout(t);
  }, [connecting, advanceConnect, finishConnect, name, domain]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          cancelConnect();
          setPicked(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect a store</DialogTitle>
          <DialogDescription>
            OAuth in, read-first. Skills only get write access when you approve
            their decisions.
          </DialogDescription>
        </DialogHeader>

        {connecting ? (
          <ConnectProgress platform={connecting.platform} step={connecting.step} />
        ) : !picked ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPicked(p.id)}
                className="group flex flex-col items-center gap-1.5 rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-base font-semibold ${p.tint}`}
                  aria-hidden
                >
                  {p.glyph}
                </span>
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-center text-[10px] leading-tight text-muted-foreground">
                  {p.catalog}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-md border font-semibold ${platformOf(picked).tint}`}
                aria-hidden
              >
                {platformOf(picked).glyph}
              </span>
              <div>
                <p className="text-sm font-medium">{platformOf(picked).name}</p>
                <p className="text-xs text-muted-foreground">
                  {platformOf(picked).catalog}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="store-name" className="text-xs font-medium">
                  Store name
                </label>
                <Input
                  id="store-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`My ${platformOf(picked).name} store`}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="store-domain" className="text-xs font-medium">
                  Domain <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="store-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="mystore.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPicked(null)}>
                Back
              </Button>
              <Button onClick={() => startConnect(picked)}>
                Authorize {platformOf(picked).name}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConnectProgress({ platform, step }: { platform: string; step: number }) {
  const p = platformOf(platform as PlatformId);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 animate-pulse items-center justify-center rounded-lg border font-semibold ${p.tint}`}
          aria-hidden
        >
          {p.glyph}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">Connecting {p.name}…</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            oauth · scope: read_products, read_orders
          </p>
        </div>
      </div>
      <ol className="space-y-2">
        {CONNECT_COPY.map((c, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={c.title}
              className={`flex items-start gap-2.5 rounded-lg border p-3 transition-colors ${active ? "border-primary/50 bg-primary/[0.05]" : done ? "border-primary/30" : "opacity-50"}`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${done ? "border-primary bg-primary text-primary-foreground" : ""}`}
                aria-hidden
              >
                {done ? <Check className="h-3 w-3" /> : null}
              </span>
              <span>
                <span className="block text-sm font-medium">
                  {c.title}
                  {active ? "…" : done ? " ✓" : ""}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {c.desc}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
