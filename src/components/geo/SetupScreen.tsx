"use client";

import { useMemo, useState } from "react";
import { Check, Clock, Footprints, Globe2, History, KeyRound, Loader2, Play, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { areaLabel, type AreaSpec } from "@/lib/geo/area";
import { COUNTRIES, flagEmoji, type ContinentCode } from "@/lib/geo/countries";
import { CONTINENTS, REGIONS, type MapPreset } from "@/lib/geo/regions";
import { formatScore } from "@/lib/geo/scoring";
import type { GameSettings, HistoryEntry, MovementMode } from "@/lib/geo/storage";
import { CustomAreaPicker } from "./CustomAreaPicker";

interface Props {
  area: AreaSpec;
  onAreaChange: (area: AreaSpec) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
  mapsReady: boolean;
  starting: boolean;
  startError: string | null;
  onStart: () => void;
  onChangeKey: () => void;
}

type Tab = "world" | "continents" | "regions" | "countries" | "custom";

const CONTINENT_IDS = new Set(CONTINENTS.map((c) => c.id));

function tabFor(area: AreaSpec): Tab {
  switch (area.kind) {
    case "world":
      return "world";
    case "preset":
      return CONTINENT_IDS.has(area.presetId) ? "continents" : "regions";
    case "countries":
      return "countries";
    case "circle":
      return "custom";
  }
}

const MOVEMENT_OPTIONS: { value: MovementMode; label: string; hint: string }[] = [
  { value: "move", label: "תנועה חופשית", hint: "אפשר להסתובב, לזוז ולהתקרב" },
  { value: "no-move", label: "בלי תזוזה", hint: "אפשר להסתובב ולהתקרב, אבל לא לזוז" },
  { value: "nmpz", label: "תמונה קפואה", hint: "בלי תזוזה, בלי סיבוב ובלי זום" },
];

const TIME_OPTIONS = [
  { value: 0, label: "ללא" },
  { value: 30, label: "0:30" },
  { value: 60, label: "1:00" },
  { value: 120, label: "2:00" },
  { value: 300, label: "5:00" },
];

const ROUND_OPTIONS = [3, 5, 10];

const CONTINENT_FILTERS: { value: ContinentCode | "all"; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "EU", label: "אירופה" },
  { value: "AS", label: "אסיה" },
  { value: "AF", label: "אפריקה" },
  { value: "NA", label: "צפון אמריקה" },
  { value: "SA", label: "דרום אמריקה" },
  { value: "OC", label: "אוקיאניה" },
];

const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "he"));

export function SetupScreen(props: Props) {
  const { area, onAreaChange, settings, onSettingsChange } = props;
  const [tab, setTab] = useState<Tab>(() => tabFor(area));

  const selectedCodes = area.kind === "countries" ? area.codes : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Globe2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">איפה אני?</h1>
            <p className="text-sm text-muted-foreground">נוחתים במקום אקראי ב-Street View ומנחשים איפה בעולם זה</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={props.onChangeKey}>
          <KeyRound />
          <span className="hidden sm:inline">מפתח API</span>
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">איפה לשחק?</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} dir="rtl">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="world">כל העולם</TabsTrigger>
                <TabsTrigger value="continents">יבשות</TabsTrigger>
                <TabsTrigger value="regions">אזורים</TabsTrigger>
                <TabsTrigger value="countries">מדינות</TabsTrigger>
                <TabsTrigger value="custom">אזור על המפה</TabsTrigger>
              </TabsList>

              <TabsContent value="world" className="pt-2">
                <PresetButton
                  emoji="🌍"
                  name="כל העולם"
                  hint="כל המדינות שיש בהן כיסוי Street View"
                  selected={area.kind === "world"}
                  onClick={() => onAreaChange({ kind: "world" })}
                />
              </TabsContent>

              <TabsContent value="continents" className="pt-2">
                <PresetGrid presets={CONTINENTS} area={area} onSelect={onAreaChange} />
              </TabsContent>

              <TabsContent value="regions" className="pt-2">
                <PresetGrid presets={REGIONS} area={area} onSelect={onAreaChange} />
              </TabsContent>

              <TabsContent value="countries" className="pt-2">
                <CountryPicker
                  selected={selectedCodes}
                  onChange={(codes) => onAreaChange(codes.length ? { kind: "countries", codes } : { kind: "world" })}
                />
              </TabsContent>

              <TabsContent value="custom" className="pt-2">
                <CustomAreaPicker
                  mapsReady={props.mapsReady}
                  value={area.kind === "circle" ? { center: area.center, radiusKm: area.radiusKm } : null}
                  onChange={(v) => onAreaChange({ kind: "circle", ...v })}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">הגדרות משחק</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="text-sm font-medium">מספר סבבים</div>
                <Segmented
                  options={ROUND_OPTIONS.map((r) => ({ value: r, label: String(r) }))}
                  value={settings.rounds}
                  onChange={(rounds) => onSettingsChange({ ...settings, rounds })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  זמן לכל סבב
                </div>
                <Segmented
                  options={TIME_OPTIONS}
                  value={settings.timeLimitSec}
                  onChange={(timeLimitSec) => onSettingsChange({ ...settings, timeLimitSec })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Footprints className="h-4 w-4" />
                  מצב תנועה
                </div>
                <div className="space-y-1.5">
                  {MOVEMENT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, movement: o.value })}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2 text-right transition-colors",
                        settings.movement === o.value ? "border-primary bg-primary/10" : "hover:bg-muted/60",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-medium">{o.label}</span>
                        <span className="block text-xs text-muted-foreground">{o.hint}</span>
                      </span>
                      {settings.movement === o.value && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-muted/60 p-3 text-sm">
                <span className="text-muted-foreground">מפה: </span>
                <span className="font-semibold">{areaLabel(area)}</span>
              </div>

              {props.startError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {props.startError}
                </div>
              )}

              <Button
                size="lg"
                className="w-full text-base"
                onClick={props.onStart}
                disabled={props.starting || (area.kind === "countries" && area.codes.length === 0)}
              >
                {props.starting ? <Loader2 className="animate-spin" /> : <Play />}
                יאללה, מתחילים
              </Button>
            </CardContent>
          </Card>

          <HistoryCard history={props.history} onClear={props.onClearHistory} />
        </div>
      </div>
    </div>
  );
}

function PresetGrid({ presets, area, onSelect }: { presets: MapPreset[]; area: AreaSpec; onSelect: (a: AreaSpec) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {presets.map((p) => (
        <PresetButton
          key={p.id}
          emoji={p.emoji}
          name={p.name}
          hint={`${p.entries.length} מדינות`}
          selected={area.kind === "preset" && area.presetId === p.id}
          onClick={() => onSelect({ kind: "preset", presetId: p.id })}
        />
      ))}
    </div>
  );
}

function PresetButton(props: { emoji: string; name: string; hint: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-right transition-colors",
        props.selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/60",
      )}
    >
      <span className="text-2xl leading-none">{props.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{props.name}</span>
        <span className="block text-xs text-muted-foreground">{props.hint}</span>
      </span>
      {props.selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

function CountryPicker({ selected, onChange }: { selected: string[]; onChange: (codes: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState<ContinentCode | "all">("all");
  const [showAll, setShowAll] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SORTED_COUNTRIES.filter(
      (c) =>
        c.continent !== "AN" &&
        (continent === "all" || c.continent === continent) &&
        (showAll || c.coverage > 0 || selected.includes(c.code)) &&
        (!q || c.name.includes(q) || c.code.toLowerCase() === q),
    );
  }, [query, continent, showAll, selected]);

  const toggle = (code: string) =>
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש מדינה…" className="pr-9" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CONTINENT_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setContinent(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              continent === f.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted/60",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">נבחרו:</span>
          {selected.map((code) => {
            const c = COUNTRIES.find((x) => x.code === code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggle(code)}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
              >
                {flagEmoji(code)} {c?.name ?? code}
                <X className="h-3 w-3" />
              </button>
            );
          })}
          <button type="button" className="text-xs text-muted-foreground underline" onClick={() => onChange([])}>
            ניקוי
          </button>
        </div>
      )}

      <div className="grid max-h-[360px] grid-cols-2 gap-1.5 overflow-y-auto pe-1 sm:grid-cols-3">
        {list.map((c) => {
          const isSelected = selected.includes(c.code);
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => toggle(c.code)}
              title={c.coverage === 2 ? "כיסוי טוב" : c.coverage === 1 ? "כיסוי חלקי" : "כמעט אין כיסוי Street View"}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2.5 py-2 text-right text-sm transition-colors",
                isSelected ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted/60",
                c.coverage === 0 && !isSelected && "opacity-60",
              )}
            >
              <span className="text-lg leading-none">{flagEmoji(c.code)}</span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  c.coverage === 2 ? "bg-emerald-500" : c.coverage === 1 ? "bg-amber-400" : "bg-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
        {list.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted-foreground">לא נמצאו מדינות</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> כיסוי טוב
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> כיסוי חלקי
          </span>
        </span>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          הצגת מדינות כמעט בלי כיסוי
        </label>
      </div>
    </div>
  );
}

function Segmented<T extends number | string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md bg-muted p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-sm px-2 py-1.5 text-sm tabular-nums transition-colors",
            value === o.value ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function HistoryCard({ history, onClear }: { history: HistoryEntry[]; onClear: () => void }) {
  if (history.length === 0) return null;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-4 w-4" />
          משחקים אחרונים
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-muted-foreground">
          <Trash2 />
          ניקוי
        </Button>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {history.slice(0, 8).map((h) => (
          <div key={h.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm odd:bg-muted/40">
            <span className="min-w-0">
              <span className="block truncate font-medium">{h.areaLabel}</span>
              <span className="block text-xs text-muted-foreground">
                {new Date(h.date).toLocaleDateString("he-IL")} · {h.settings.rounds} סבבים
              </span>
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-semibold">{formatScore(h.total)}</span>
              <span className="text-xs text-muted-foreground"> / {formatScore(h.max)}</span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
