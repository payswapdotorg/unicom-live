"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Plus, Search } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useProduct } from "@/lib/product/store";
import { type Skill, type StoreConnection } from "@/lib/product/data";

// Skills — pluggable capability packs (spec §7-4c). Install per store; a
// skill starts watching the moment it lands. "Installed" is your shelf;
// "Discover" is the catalog (FE2 §3.2 — the zcode plugin store, commerce).
// The reference card records how the risk tiers read — read-only,
// acts-with-approval, autonomous.

/** Thin custom scrollbar for bounded lists (the long-list law). */
const THIN_SCROLL =
  "[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5";

const RISK_TIERS = [
  { term: "read-only", line: "skills never write.", eye: true },
  { term: "acts-with-approval", line: "skills draft decisions for the frontier.", eye: false },
  { term: "autonomous", line: "skills act within rails you set — and every action is still on the record.", eye: false },
] as const;

// ——— Discover: the marketplace catalog (FE2 §3.2) ———
// Presentation-layer reference data, like PLATFORMS — the skill records in
// the store stay the only live truth (installs, events, risk).

type MarketCategory = "Pricing" | "Catalog" | "Ads" | "Support" | "Analytics";

const CATEGORIES: ("All" | MarketCategory)[] = [
  "All",
  "Pricing",
  "Catalog",
  "Ads",
  "Support",
  "Analytics",
];

const MARKET_DEVELOPER = "UNiCOM Labs";

const MARKET: Record<string, { category: MarketCategory; version: string }> = {
  "price-sentinel": { category: "Pricing", version: "1.8" },
  "listing-optimizer": { category: "Catalog", version: "2.0" },
  "cart-saver": { category: "Support", version: "1.4" },
  "review-responder": { category: "Support", version: "1.3" },
  "stock-scout": { category: "Catalog", version: "1.2" },
  "ad-watcher": { category: "Ads", version: "1.6" },
};

/** The two flagship packs — the featured strip (catalog landing only). */
const FEATURED_IDS = ["price-sentinel", "listing-optimizer"];

/** The install-state line — honest counts, no fabrication. */
function installStateLine(sk: Skill): string {
  const n = sk.installedOn.length;
  return n === 0 ? "Not installed" : `Installed on ${n} store${n === 1 ? "" : "s"}`;
}

export function SkillsSection() {
  const { skills, stores, toggleSkill } = useProduct();
  const [mode, setMode] = useState<"installed" | "discover">("installed");

  return (
    <div className="flex flex-col gap-6">
      {/* Scaffold (spec §5) */}
      <header className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          UNiCOM Commerce Workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Capability packs for the agent pool. Install per store — a skill
          starts watching the moment it lands.
        </p>
      </header>

      {/* Two-way toggle — the settings chip-strip pattern: Installed = your
          shelf (byte-stable), Discover = the catalog */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Skills views">
        {(["installed", "discover"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              mode === id
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
          >
            {id === "installed" ? "Installed" : "Discover"}
          </button>
        ))}
      </div>

      {mode === "installed" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {skills.map((sk, i) => {
            const allOn = stores.filter((s) =>
              sk.installedOn.includes(s.id),
            );
            const everywhere = allOn.length === stores.length && stores.length > 0;
            return (
              <motion.div
                key={sk.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className="h-full"
              >
                <Card className="flex h-full flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-lg border text-base"
                          aria-hidden
                        >
                          {sk.glyph}
                        </span>
                        <div>
                          <CardTitle className="text-base">{sk.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {sk.events7d} events · 7d
                          </p>
                        </div>
                      </div>
                      <RiskBadge risk={sk.risk} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <p className="text-sm text-foreground/85">{sk.tagline}</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                          watches
                        </span>
                        <br />
                        {sk.watches}
                      </p>
                      <p>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                          acts
                        </span>
                        <br />
                        {sk.acts}
                      </p>
                    </div>

                    <div className="mt-auto space-y-2 pt-2">
                      <div className="flex min-h-[22px] flex-wrap gap-1">
                        {allOn.length === 0 ? (
                          <span className="text-[11px] italic text-muted-foreground">
                            not installed anywhere yet
                          </span>
                        ) : (
                          allOn.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                            >
                              <Check className="h-2.5 w-2.5" />
                              {s.name}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        {stores.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant={everywhere ? "outline" : "default"}
                                className="min-h-11 flex-1"
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                {everywhere ? "Manage" : "Install"}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                Install on…
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {stores.map((s) => {
                                const has = sk.installedOn.includes(s.id);
                                return (
                                  <DropdownMenuItem
                                    key={s.id}
                                    onClick={() => toggleSkill(sk.id, s.id)}
                                  >
                                    {has ? (
                                      <Check className="mr-2 h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <Plus className="mr-2 h-3.5 w-3.5" />
                                    )}
                                    {s.name}
                                    {has && (
                                      <span className="ml-auto text-[10px] text-muted-foreground">
                                        remove
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {mode === "discover" && (
        <DiscoverSkills
          skills={skills}
          stores={stores}
          toggleSkill={toggleSkill}
        />
      )}

      {/* Reference — the risk tiers, honestly (never live data) */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">
              The risk tiers are honest
            </h2>
            <Badge
              variant="outline"
              className="shrink-0 text-muted-foreground"
            >
              Reference
            </Badge>
          </div>
          <dl className="flex flex-col gap-2.5">
            {RISK_TIERS.map((tier) => (
              <div
                key={tier.term}
                className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <dt className="flex shrink-0 items-center gap-1.5 text-sm font-medium sm:w-44">
                  {tier.eye && <Eye className="h-3.5 w-3.5" aria-hidden />}
                  {tier.term}
                </dt>
                <dd className="text-sm text-muted-foreground">
                  {tier.line}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// The Discover surface — the catalog: search, categories, the featured
// strip, the full card grid and the detail dialog (installs ride the
// existing toggleSkill mutation, nothing new).
function DiscoverSkills({
  skills,
  stores,
  toggleSkill,
}: {
  skills: Skill[];
  stores: StoreConnection[];
  toggleSkill: (skillId: string, storeId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [detailId, setDetailId] = useState<string | null>(null);

  const query = q.trim();
  const needle = query.toLowerCase();
  const filtered = skills.filter((sk) => {
    const meta = MARKET[sk.id];
    if (cat !== "All" && meta?.category !== cat) return false;
    if (!needle) return true;
    return [sk.name, sk.tagline, meta?.category ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
  // the featured strip is the catalog's landing view — filters engage the
  // results view instead
  const showFeatured = !needle && cat === "All";
  const featured = skills.filter((sk) => FEATURED_IDS.includes(sk.id));
  const detail =
    detailId === null ? null : (skills.find((s) => s.id === detailId) ?? null);

  const clearFilters = () => {
    setQ("");
    setCat("All");
  };

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Search + categories */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the catalog…"
            className="min-h-11 pl-8"
            aria-label="Search the catalog"
          />
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                cat === c
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Featured — the two flagship packs */}
      {showFeatured && (
        <section
          aria-labelledby="skills-featured"
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 id="skills-featured" className="text-base font-semibold">
              Featured
            </h2>
            <p className="text-xs text-muted-foreground">
              flagship packs from {MARKET_DEVELOPER}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((sk, i) => (
              <FeaturedCard
                key={sk.id}
                sk={sk}
                i={i}
                onDetails={() => setDetailId(sk.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* The catalog — every skill, filtered */}
      <section
        aria-labelledby="skills-catalog"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 id="skills-catalog" className="text-base font-semibold">
            The catalog
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground/70">
            {filtered.length} of {skills.length}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-card p-5">
            <p className="text-sm font-medium">
              Nothing in the catalog matches &ldquo;{query || cat}.&rdquo;
            </p>
            <div>
              <Button variant="outline" className="h-11" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((sk, i) => (
              <MarketCard
                key={sk.id}
                sk={sk}
                i={i}
                onDetails={() => setDetailId(sk.id)}
              />
            ))}
          </div>
        )}
      </section>

      <SkillDetailDialog
        skill={detail}
        stores={stores}
        toggleSkill={toggleSkill}
        onClose={() => setDetailId(null)}
      />
    </motion.div>
  );
}

function FeaturedCard({
  sk,
  i,
  onDetails,
}: {
  sk: Skill;
  i: number;
  onDetails: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * Math.min(i, 6) }}
      className="h-full"
    >
      <Card className="h-full">
        <CardContent className="flex h-full flex-col p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-base"
              aria-hidden
            >
              {sk.glyph}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{sk.name}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  Featured
                </Badge>
                <RiskBadge risk={sk.risk} />
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {sk.tagline}
              </p>
            </div>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p className="text-xs text-muted-foreground">
              {installStateLine(sk)}
            </p>
            <Button variant="outline" className="h-11" onClick={onDetails}>
              View details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MarketCard({
  sk,
  i,
  onDetails,
}: {
  sk: Skill;
  i: number;
  onDetails: () => void;
}) {
  const meta = MARKET[sk.id];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * Math.min(i, 6) }}
      className="h-full"
    >
      <Card className="h-full">
        <CardContent className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-base"
                aria-hidden
              >
                {sk.glyph}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">{sk.name}</h3>
                <p className="truncate text-xs text-muted-foreground">
                  {meta
                    ? `${MARKET_DEVELOPER} · ${meta.category}`
                    : "—"}
                </p>
              </div>
            </div>
            <RiskBadge risk={sk.risk} />
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-foreground/85">
            {sk.tagline}
          </p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
            <p className="text-xs text-muted-foreground">
              {installStateLine(sk)}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={onDetails}
            >
              View details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// The detail dialog — Information (catalog metadata), Components (the
// skill's real fields verbatim), and the per-store installs riding
// toggleSkill. Uninstall-everywhere confirms first.
function SkillDetailDialog({
  skill,
  stores,
  toggleSkill,
  onClose,
}: {
  skill: Skill | null;
  stores: StoreConnection[];
  toggleSkill: (skillId: string, storeId: string) => void;
  onClose: () => void;
}) {
  const meta = skill ? MARKET[skill.id] : undefined;

  return (
    <Dialog open={!!skill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={`max-h-[85vh] overflow-y-auto sm:max-w-lg ${THIN_SCROLL}`}
      >
        {skill && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 pr-6 text-left">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base"
                  aria-hidden
                >
                  {skill.glyph}
                </span>
                {skill.name}
              </DialogTitle>
              <DialogDescription className="text-left">
                {skill.tagline}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              {/* Information */}
              <section
                aria-labelledby="skill-detail-info"
                className="flex flex-col gap-2"
              >
                <h4
                  id="skill-detail-info"
                  className="text-sm font-semibold"
                >
                  Information
                </h4>
                <dl className="flex flex-col gap-1.5">
                  {[
                    { k: "Developer", v: meta ? MARKET_DEVELOPER : "—" },
                    { k: "Category", v: meta?.category ?? "—" },
                    { k: "Version", v: meta ? `v${meta.version}` : "—" },
                    { k: "Risk tier", v: skill.risk },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3"
                    >
                      <dt className="shrink-0 text-xs font-medium text-muted-foreground sm:w-24">
                        {row.k}
                      </dt>
                      <dd className="text-xs text-foreground/85">{row.v}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* Components — the skill's real fields, verbatim */}
              <section
                aria-labelledby="skill-detail-components"
                className="flex flex-col gap-2"
              >
                <h4
                  id="skill-detail-components"
                  className="text-sm font-semibold"
                >
                  Components
                </h4>
                <dl className="flex flex-col gap-1.5">
                  {[
                    { k: "Watches", v: skill.watches },
                    { k: "Acts", v: skill.acts },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3"
                    >
                      <dt className="shrink-0 text-xs font-medium text-muted-foreground sm:w-24">
                        {row.k}
                      </dt>
                      <dd className="text-xs text-foreground/85">{row.v}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* Installed on — per-store switches (toggleSkill) */}
              <section
                aria-labelledby="skill-detail-installed"
                className="flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4
                    id="skill-detail-installed"
                    className="text-sm font-semibold"
                  >
                    Installed on
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {installStateLine(skill)}
                  </p>
                </div>
                {stores.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No stores connected — connect a store to install this
                    skill.
                  </p>
                ) : (
                  <div
                    role="list"
                    aria-label={`Install ${skill.name} per store`}
                    className={`flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1 ${THIN_SCROLL}`}
                  >
                    {stores.map((s) => {
                      const has = skill.installedOn.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          role="listitem"
                          className="flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {s.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {s.domain}
                            </p>
                          </div>
                          <Switch
                            checked={has}
                            onCheckedChange={() =>
                              toggleSkill(skill.id, s.id)
                            }
                            aria-label={`${has ? "Remove" : "Install"} ${skill.name} ${has ? "from" : "on"} ${s.name}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {skill.installedOn.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-h-11 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        Uninstall from every store
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Uninstall {skill.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the skill from every store and clears
                          its saved configuration. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="min-h-11">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="min-h-11 bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => {
                            // staggered: the live PATCH is a server-side
                            // toggle (read-modify-write), so each removal
                            // waits its turn instead of racing the row
                            skill.installedOn.forEach((sid, idx) => {
                              setTimeout(
                                () => toggleSkill(skill.id, sid),
                                idx * 200,
                              );
                            });
                          }}
                        >
                          Uninstall
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RiskBadge({ risk }: { risk: "read-only" | "acts-with-approval" | "autonomous" }) {
  if (risk === "read-only")
    return (
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        <Eye className="mr-1 h-3 w-3" /> read-only
      </Badge>
    );
  if (risk === "autonomous")
    return (
      <Badge variant="default" className="shrink-0 text-[10px]">
        autonomous
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="shrink-0 border-amber-500/50 text-[10px] text-amber-600 dark:text-amber-400"
    >
      approval
    </Badge>
  );
}
