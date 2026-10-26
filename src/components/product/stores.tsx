"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  type Platform,
  type PlatformId,
  type StoreConnection,
  platformOf,
} from "@/lib/product/data";

// Stores — the connections surface (spec §7-4c). The catalogue records every
// platform the ring can speak — the online marketplaces plus the local edge
// (POS, local pickup, a camera, even no API). Below it, the live store cards
// carry the whole ring per store: health, stats, budget, installed skills,
// and the sync / reconnect / revoke levers.

/** The store-card platform label — the local edge renders as "in-person".
 * Label only; everything else comes straight from the PLATFORMS lookup. */
function platformLabel(id: PlatformId): string {
  return id === "local" ? "in-person" : platformOf(id).name;
}

export function StoresSection() {
  const { stores, setSection } = useProduct();
  const [query, setQuery] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectPreset, setConnectPreset] = useState<PlatformId | null>(null);
  const [connectSession, setConnectSession] = useState(0);

  // One dialog for the whole surface. A null preset opens the first connect
  // step (the platform grid); a platform preset lands on its form step. The
  // session key remounts the dialog per open — every connect starts a fresh
  // form, and the preset seeds the picked platform at mount (no effect).
  const openConnect = (platform: PlatformId | null = null) => {
    setConnectPreset(platform);
    setConnectSession((n) => n + 1);
    setConnectOpen(true);
  };

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.domain.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Scaffold (spec §5) + headerAside: the environment pill */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            UNiCOM Commerce Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Connect every storefront you run — online and in-person — into
            one ring, one catalog, one watch.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Test environment
          </span>
          <Button className="min-h-11" onClick={() => openConnect()}>
            <Plus className="mr-1 h-4 w-4" /> Connect a store
          </Button>
        </div>
      </header>

      {/* Store catalogue — every platform the ring can speak */}
      <section
        className="flex flex-col gap-2"
        aria-labelledby="stores-catalogue-heading"
      >
        <h2
          id="stores-catalogue-heading"
          className="text-base font-semibold"
        >
          Store catalogue
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The platforms your ring can speak — online marketplaces and the
          local edge.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PLATFORMS.map((p) => (
            <CatalogueTile
              key={p.id}
              platform={p}
              count={stores.filter((s) => s.platform === p.id).length}
              onConnect={() => openConnect(p.id)}
            />
          ))}
        </div>
      </section>

      {/* Connected stores — the live ring */}
      <section
        className="flex flex-col gap-3"
        aria-labelledby="stores-connected-heading"
      >
        <h2 id="stores-connected-heading" className="text-base font-semibold">
          Connected stores
        </h2>

        {stores.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <Store className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">
                No stores connected — the honest state
              </p>
              <p className="max-w-md text-xs text-muted-foreground">
                Nothing is connected yet; the catalogue above records the
                first connection.
              </p>
              <Button className="mt-1 min-h-11" onClick={() => openConnect()}>
                <Plus className="mr-1 h-4 w-4" /> Connect your first store
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stores…"
                className="min-h-11 pl-8"
                aria-label="Search stores"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                No stores match &ldquo;{query}&rdquo; —{" "}
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  clear the search
                </button>{" "}
                to see all {stores.length}.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((s, i) => (
                  <StoreCard key={s.id} store={s} index={i} />
                ))}
              </div>
            )}

            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                <Store className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">
                  More stores, one command center
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Every platform you connect joins the same ring: shared
                  watch, shared agent pool, shared evidence trail. Connect
                  your next store in under a minute.
                </p>
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => openConnect()}
                >
                  <Plus className="mr-1 h-4 w-4" /> Connect a store
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <ConnectDialog
        key={connectSession}
        open={connectOpen}
        onOpenChange={setConnectOpen}
        initialPlatform={connectPreset}
      />
    </div>
  );
}

function CatalogueTile({
  platform: p,
  count,
  onConnect,
}: {
  platform: Platform;
  count: number;
  onConnect: () => void;
}) {
  const isLocal = p.id === "local";
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-base font-semibold ${p.tint}`}
            aria-hidden
          >
            {p.glyph}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {isLocal ? "Local — in-person" : p.name}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {isLocal ? "POS, local pickup, a camera, even no API." : p.catalog}
            </p>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${count > 0 ? "bg-primary" : "bg-border"}`}
            aria-hidden
          />
          {count > 0
            ? `Connected · ${count} ${count === 1 ? "store" : "stores"}`
            : "Not connected"}
        </p>
        <Button
          variant={count > 0 ? "outline" : "default"}
          className="mt-auto min-h-11 w-full"
          onClick={onConnect}
        >
          Connect
        </Button>
      </CardContent>
    </Card>
  );
}

function StoreCard({
  store: s,
  index: i,
}: {
  store: StoreConnection;
  index: number;
}) {
  const { setSection, syncStore, reconnectStore } = useProduct();
  const p = platformOf(s.platform);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * i }}
      className="h-full"
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
                  {s.domain} · {platformLabel(s.platform)}
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
        <CardContent className="flex h-full flex-col gap-4">
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
                className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline-offset-4 hover:underline"
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
          <div className="mt-auto flex items-center gap-1.5 border-t pt-3">
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => syncStore(s.id)}
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Sync
            </Button>
            {s.health !== "healthy" && (
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 flex-1"
                onClick={() => reconnectStore(s.id)}
              >
                <Plug className="mr-1 h-3.5 w-3.5" /> Reconnect
              </Button>
            )}
            <RevokeStoreButton storeName={s.name} storeId={s.id} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RevokeStoreButton({
  storeName: name,
  storeId,
}: {
  storeName: string;
  storeId: string;
}) {
  const { revokeStore } = useProduct();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="min-h-11 min-w-11 px-2.5 text-destructive hover:text-destructive"
          aria-label={`Revoke ${name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Access tokens are destroyed and the store leaves the watch ring
            immediately. Its missions pause and its skills unplug. You can
            reconnect any time — the catalog re-syncs in about a minute.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">Keep connected</AlertDialogCancel>
          <AlertDialogAction
            className="min-h-11 bg-destructive text-white hover:bg-destructive/90"
            onClick={() => revokeStore(storeId)}
          >
            Revoke access
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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

const CONNECT_COPY = [
  { title: "Authorize", desc: "A secure OAuth window opens on the platform. You approve; we never see your password." },
  { title: "Sync", desc: "We pull products, orders, and inventory into the ring — read-only until you grant more." },
  { title: "Watch", desc: "Your store joins the nightly audit and the heartbeat strip. Agents can now act on it." },
];

// The local edge path — no API, no OAuth: capture, reconcile, then watch.
const LOCAL_CONNECT_COPY = [
  { title: "Capture", desc: "Choose a capture — a POS export, phone-camera scans, or a file drop. Even systems without an API can join the ring." },
  { title: "Reconcile", desc: "Physical observations stay observations until reconciled — counts settle before they're truth." },
  { title: "Watch", desc: "Your local presence joins the nightly audit and the heartbeat strip." },
];

function connectCopyFor(platform: string) {
  return platform === "local" ? LOCAL_CONNECT_COPY : CONNECT_COPY;
}

export function ConnectDialog({
  open,
  onOpenChange,
  initialPlatform = null,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** A platform handed in from the catalogue lands on its form step. */
  initialPlatform?: PlatformId | null;
}) {
  const { connecting, startConnect, advanceConnect, finishConnect, cancelConnect } =
    useProduct();
  // A preset platform (a catalogue tile) seeds the picker at mount — the
  // session key in StoresSection remounts this dialog per open, so the
  // initializer is the whole handoff (no effect, no cascading render).
  const [picked, setPicked] = useState<PlatformId | null>(
    initialPlatform ?? null,
  );
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  // finish latch — the effect below re-runs when the finish callback clears
  // name/domain while `connecting` is still non-null (it only turns null when
  // the POST resolves in finishConnect), which used to schedule a SECOND
  // 250ms timer that fired finishConnect again with empty fields — minting a
  // duplicate "My … store" (caught live in the 2026-10-26 deployment battery:
  // two POSTs 100ms apart, one with the merchant's values, one with defaults).
  // The latch makes the finish one-shot per dialog mount.
  const finishedRef = useRef(false);

  // drive the connect progress (online: OAuth · local: the edge path)
  useEffect(() => {
    if (!connecting) return;
    if (connecting.step >= connectCopyFor(connecting.platform).length) {
      const p = platformOf(connecting.platform as PlatformId);
      const t = setTimeout(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        finishConnect({
          id: `store-${Date.now()}`,
          name: name || `My ${p.name} store`,
          domain:
            domain ||
            (connecting.platform === "local"
              ? "location not set"
              : `my-store.${p.id}.com`),
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

  const localPick = picked === "local";

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
            {localPick
              ? "The local edge — even systems without an API can join the ring."
              : "OAuth in, read-first. Skills only get write access when you approve their decisions."}
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
                className="group flex min-h-11 flex-col items-center gap-1.5 rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-accent"
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
                <p className="text-sm font-medium">
                  {localPick ? "Local — in-person" : platformOf(picked).name}
                </p>
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
                  {localPick ? (
                    "Where it lives — street or neighborhood"
                  ) : (
                    <>
                      Domain{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </>
                  )}
                </label>
                <Input
                  id="store-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={
                    localPick
                      ? "e.g. 214 Main St · weekend market"
                      : "mystore.com"
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                className="min-h-11"
                onClick={() => setPicked(null)}
              >
                Back
              </Button>
              <Button className="min-h-11" onClick={() => startConnect(picked)}>
                {localPick
                  ? "Connect Local"
                  : `Authorize ${platformOf(picked).name}`}
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
  const isLocal = platform === "local";
  const copy = connectCopyFor(platform);
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
            {isLocal
              ? "edge · capture: pos-export | camera | file-drop"
              : "oauth · scope: read_products, read_orders"}
          </p>
        </div>
      </div>
      <ol className="space-y-2">
        {copy.map((c, i) => {
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
