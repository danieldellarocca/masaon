"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { areaKey, compileArea, type AreaSpec, type CompiledArea } from "@/lib/geo/area";
import { loadBoundaries, type Boundaries } from "@/lib/geo/boundaries";
import { COUNTRY_BY_CODE } from "@/lib/geo/countries";
import { loadGoogleMaps, onAuthFailure, resolveApiKey, storeApiKey } from "@/lib/geo/google-maps";
import { PRESET_BY_ID } from "@/lib/geo/regions";
import {
  addHistory,
  bestFor,
  clearHistory,
  DEFAULT_SETTINGS,
  loadHistory,
  loadLastArea,
  loadSettings,
  saveLastArea,
  saveSettings,
  type GameSettings,
  type HistoryEntry,
} from "@/lib/geo/storage";
import { ApiKeySetup } from "./ApiKeySetup";
import { GameView } from "./GameView";
import { SetupScreen } from "./SetupScreen";

interface ActiveGame {
  id: number;
  area: CompiledArea;
  areaKey: string;
  boundaries: Boundaries;
  settings: GameSettings;
}

function sanitizeArea(area: AreaSpec): AreaSpec {
  if (area.kind === "preset" && !PRESET_BY_ID[area.presetId]) return { kind: "world" };
  if (area.kind === "countries") {
    const codes = area.codes.filter((c) => COUNTRY_BY_CODE[c]);
    return codes.length ? { kind: "countries", codes } : { kind: "world" };
  }
  return area;
}

export function GeoApp() {
  const [hydrated, setHydrated] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [mapsReady, setMapsReady] = useState(false);

  const [area, setArea] = useState<AreaSpec>({ kind: "world" });
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [game, setGame] = useState<ActiveGame | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(resolveApiKey());
    setArea(sanitizeArea(loadLastArea()));
    setSettings(loadSettings());
    setHistory(loadHistory());
    setHydrated(true);
    // טעינה מוקדמת של גבולות המדינות, כדי שההתחלה תהיה מהירה
    loadBoundaries().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => !cancelled && setMapsReady(true))
      .catch((e: Error) => {
        if (e.message === "KEY_CHANGED") window.location.reload();
        else if (!cancelled) setKeyError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(
    () =>
      onAuthFailure(() => {
        setMapsReady(false);
        setGame(null);
        setKeyError(
          "גוגל דחתה את המפתח. בדקו שהוא נכון, ש-Maps JavaScript API מופעל בפרויקט, שיש חשבון חיוב, ושהכתובת של האתר מורשית במגבלות המפתח.",
        );
        setEditingKey(true);
      }),
    [],
  );

  const saveKey = (key: string) => {
    storeApiKey(key);
    setKeyError(null);
    setEditingKey(false);
    if (mapsReady || keyError) {
      // הספרייה כבר נטענה עם מפתח אחר – חייבים לרענן את הדף
      window.location.reload();
      return;
    }
    setApiKey(key);
  };

  const updateArea = (a: AreaSpec) => {
    setArea(a);
    setStartError(null);
  };

  const updateSettings = (s: GameSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      if (!mapsReady) throw new Error("Google Maps עדיין נטען, נסו שוב בעוד רגע.");
      const boundaries = await loadBoundaries();
      const compiled = compileArea(area, boundaries);
      saveLastArea(area);
      saveSettings(settings);
      setGame({ id: Date.now(), area: compiled, areaKey: areaKey(area), boundaries, settings });
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "לא הצלחנו להתחיל את המשחק");
    } finally {
      setStarting(false);
    }
  };

  const onFinished = useCallback((entry: HistoryEntry) => {
    const previous = bestFor(loadHistory(), entry.areaKey, entry.settings);
    setHistory(addHistory(entry));
    return previous;
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!apiKey || editingKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ApiKeySetup
          initialKey={apiKey}
          error={keyError}
          onSave={saveKey}
          onCancel={apiKey && !keyError ? () => setEditingKey(false) : undefined}
        />
      </div>
    );
  }

  if (game) {
    return (
      <GameView
        key={game.id}
        area={game.area}
        areaKey={game.areaKey}
        boundaries={game.boundaries}
        settings={game.settings}
        onFinished={onFinished}
        onExit={() => setGame(null)}
      />
    );
  }

  return (
    <SetupScreen
      area={area}
      onAreaChange={updateArea}
      settings={settings}
      onSettingsChange={updateSettings}
      history={history}
      onClearHistory={() => {
        clearHistory();
        setHistory([]);
      }}
      mapsReady={mapsReady}
      starting={starting}
      startError={startError ?? keyError}
      onStart={start}
      onChangeKey={() => setEditingKey(true)}
    />
  );
}
