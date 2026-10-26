"use client";

import { useState } from "react";
import { Check, ChevronDown, Eye, Package, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useProduct } from "@/lib/product/store";
import {
  effectiveEffort,
  formatContextWindow,
  isVisionModel,
  modelRuleFor,
  providerStatus,
  type ModelProviderConfig,
} from "@/lib/product/models";

// The shared model picker (FE2, zcode ModelConfigSelect translated to commerce).
// Structure verbatim from the zcode composer picker: Provider → Models → Effort
// with a "Manage models" footer that deep-links into Settings → Model settings.
// The picker NEVER mutates settings — it reports every choice upward.

export type ModelSelection = {
  providerId: string;
  modelId: string;
  effort: string;
};

const THIN_SCROLL =
  "[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5";

const STATUS_DOT: Record<string, string> = {
  ready: "bg-emerald-500",
  "not-ready": "bg-amber-500",
  disabled: "bg-muted-foreground/40",
};

const STATUS_LABEL: Record<string, string> = {
  ready: "Ready",
  "not-ready": "Not ready",
  disabled: "Disabled",
};

function LogoTile({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-[11px] font-semibold"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function ModelPicker({
  value,
  onChange,
}: {
  value: ModelSelection;
  onChange: (v: ModelSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const providers = useProduct((s) => s.settings.models);
  const setSection = useProduct((s) => s.setSection);
  const setSettingsTab = useProduct((s) => s.setSettingsTab);

  // Resolve the effective provider + model ("" ids inherit the first valid).
  const provider: ModelProviderConfig | undefined =
    providers.find((p) => p.id === value.providerId) ??
    providers.find(
      (p) =>
        p.enabled &&
        p.models.some((m) => m.enabled && m.id === value.modelId),
    ) ??
    providers.find((p) => p.enabled) ??
    providers[0];

  const model =
    provider?.models.find((m) => m.id === value.modelId)?.id ??
    provider?.models.find((m) => m.enabled)?.id ??
    provider?.models[0]?.id ??
    "";

  const rule = model ? modelRuleFor(model) : null;
  const levels = rule?.reasoning ?? [];
  const effort = model ? effectiveEffort(model, value.effort) : "";
  const effortIdx = Math.max(levels.indexOf(effort), 0);
  const onOff = levels[0] === "disabled" && levels[levels.length - 1] === "enabled";
  const showEffort = levels.length > 0 && model !== "";

  const selectProvider = (p: ModelProviderConfig) => {
    const keep =
      p.models.find((m) => m.enabled && m.id === model)?.id ??
      p.models.find((m) => m.enabled)?.id ??
      p.models[0]?.id ??
      "";
    const nextLevels = keep ? modelRuleFor(keep).reasoning : [];
    onChange({
      providerId: p.id,
      modelId: keep,
      // zcode: new selections auto-complete at the model's HIGHEST level
      effort: nextLevels[nextLevels.length - 1] ?? "",
    });
  };

  const selectModel = (id: string) => {
    const nextLevels = modelRuleFor(id).reasoning;
    onChange({
      providerId: provider?.id ?? "",
      modelId: id,
      effort: nextLevels[nextLevels.length - 1] ?? "",
    });
  };

  const triggerLabel =
    provider && !provider.preset && provider.id !== "zai"
      ? `${provider.name}/${model}`
      : model;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Choose model"
          title="Choose model"
          className="h-11 gap-1.5 rounded-lg px-2.5 font-mono text-xs"
        >
          <Package aria-hidden className="size-4 text-muted-foreground" />
          <span className="max-w-40 truncate">
            {open ? "Select model" : (triggerLabel || "Select model")}
          </span>
          {showEffort && !open && (
            <span
              aria-hidden
              title={`${effort} effort`}
              className="flex items-center gap-0.5"
            >
              {levels.map((l, i) => (
                <span
                  key={l}
                  className={`size-1 rounded-full ${
                    i <= effortIdx ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </span>
          )}
          <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-80 p-0"
        aria-label="Model selection"
      >
        <div className="max-h-[24rem] overflow-y-auto p-1.5">
          {/* Provider pane */}
          <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Provider
          </p>
          <div role="radiogroup" aria-label="Provider" className="space-y-0.5">
            {providers.map((p) => {
              const active = provider?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => selectProvider(p)}
                  className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <LogoTile name={p.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {p.access === "coding-plan"
                        ? "Coding Plan"
                        : "API"}
                      {" · "}
                      {STATUS_LABEL[providerStatus(p)]}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    title={STATUS_LABEL[providerStatus(p)]}
                    className={`size-2 shrink-0 rounded-full ${
                      STATUS_DOT[providerStatus(p)]
                    }`}
                  />
                  {active && (
                    <Check aria-hidden className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Models pane */}
          <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Models
          </p>
          {provider && provider.models.length > 0 ? (
            <div
              role="radiogroup"
              aria-label="Models"
              className="max-h-60 space-y-0.5 overflow-y-auto p-0.5"
            >
              {provider.models.map((m) => {
                const active = m.id === model;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!m.enabled}
                    title={
                      m.enabled
                        ? m.id
                        : "Enable this model in Model settings"
                    }
                    onClick={() => selectModel(m.id)}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                      active ? "bg-accent" : "hover:bg-accent/50"
                    } ${m.enabled ? "" : "opacity-50"}`}
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">
                      {m.id}
                    </span>
                    {isVisionModel(m.id) && (
                      <span className="flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        <Eye aria-hidden className="size-3" />
                        Vision
                      </span>
                    )}
                    <span className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {formatContextWindow(modelRuleFor(m.id).contextWindow)}
                    </span>
                    {active && (
                      <Check aria-hidden className="size-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              No models on this provider yet.
            </p>
          )}

          {/* Effort pane */}
          {showEffort && (
            <>
              <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Effort
              </p>
              <div className="flex min-h-11 items-center gap-3 px-2 pb-1">
                {onOff ? (
                  <>
                    <Switch
                      id="model-effort-switch"
                      checked={effort === "enabled"}
                      onCheckedChange={(v) =>
                        onChange({
                          providerId: provider?.id ?? "",
                          modelId: model,
                          effort: v ? "enabled" : "disabled",
                        })
                      }
                      aria-label="Reasoning effort"
                    />
                    <label
                      htmlFor="model-effort-switch"
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {effort === "enabled" ? "thinking on" : "thinking off"}
                    </label>
                  </>
                ) : (
                  <>
                    <Slider
                      value={[effortIdx]}
                      min={0}
                      max={Math.max(levels.length - 1, 1)}
                      step={1}
                      onValueChange={(v) =>
                        onChange({
                          providerId: provider?.id ?? "",
                          modelId: model,
                          effort: levels[v[0]] ?? effort,
                        })
                      }
                      aria-label="Reasoning effort"
                      className="flex-1"
                    />
                    <span className="w-14 shrink-0 rounded-md border bg-muted/50 py-1 text-center font-mono text-[11px]">
                      {effort}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer — the picker ↔ settings bridge */}
        <div className="border-t p-1.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setSettingsTab("models");
              setSection("settings");
            }}
            className="h-11 w-full justify-start gap-2 text-sm"
          >
            <Settings2 aria-hidden className="size-4" />
            Manage models
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
