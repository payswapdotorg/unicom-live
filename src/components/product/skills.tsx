"use client";

import { motion } from "framer-motion";
import { Check, Eye, Plus, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProduct } from "@/lib/product/store";

// Skills — pluggable capability packs. Install per store; watch them work.
// Risk tiers are honest: read-only, acts-with-approval, autonomous.
export function SkillsSection() {
  const { skills, stores, toggleSkill } = useProduct();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capability packs for the agent pool. Install per store — a skill
          starts watching the moment it lands, and every risky action still
          comes back as a decision.
        </p>
      </header>

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
                              className="flex-1"
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

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium">
            The risk tiers are honest
          </p>
          <p className="max-w-md text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> read-only
            </span>{" "}
            skills never write.{" "}
            <span className="font-medium">acts-with-approval</span> skills
            draft decisions for the frontier.{" "}
            <span className="font-medium">autonomous</span> skills act within
            rails you set — and every action is still on the record.
          </p>
        </CardContent>
      </Card>
    </div>
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
