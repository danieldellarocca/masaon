import type { AreaSpec } from "./area";

export type MovementMode = "move" | "no-move" | "nmpz";

export interface GameSettings {
  rounds: number;
  timeLimitSec: number; // 0 = ללא הגבלה
  movement: MovementMode;
}

export const DEFAULT_SETTINGS: GameSettings = { rounds: 5, timeLimitSec: 0, movement: "move" };

export interface HistoryEntry {
  id: string;
  date: string;
  areaKey: string;
  areaLabel: string;
  settings: GameSettings;
  total: number;
  max: number;
  rounds: { score: number; distanceKm: number | null; countryCode: string | null }[];
}

const SETTINGS_KEY = "geo_settings";
const AREA_KEY = "geo_last_area";
const HISTORY_KEY = "geo_history";
const MAX_HISTORY = 50;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // אחסון לא זמין – ההגדרות פשוט לא יישמרו
  }
}

export const loadSettings = (): GameSettings => ({ ...DEFAULT_SETTINGS, ...read<Partial<GameSettings>>(SETTINGS_KEY, {}) });
export const saveSettings = (s: GameSettings) => write(SETTINGS_KEY, s);

export const loadLastArea = (): AreaSpec => read<AreaSpec>(AREA_KEY, { kind: "world" });
export const saveLastArea = (a: AreaSpec) => write(AREA_KEY, a);

export const loadHistory = (): HistoryEntry[] => read<HistoryEntry[]>(HISTORY_KEY, []);

export function addHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...loadHistory()].slice(0, MAX_HISTORY);
  write(HISTORY_KEY, next);
  return next;
}

export function clearHistory() {
  write(HISTORY_KEY, []);
}

// השיא הקודם לאותה מפה ואותן הגדרות (לפני המשחק הנוכחי).
export function bestFor(history: HistoryEntry[], areaKey: string, settings: GameSettings, excludeId?: string) {
  const same = history.filter(
    (h) =>
      h.id !== excludeId &&
      h.areaKey === areaKey &&
      h.settings.rounds === settings.rounds &&
      h.settings.movement === settings.movement &&
      h.settings.timeLimitSec === settings.timeLimitSec,
  );
  return same.length ? Math.max(...same.map((h) => h.total)) : null;
}
