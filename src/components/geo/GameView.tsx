"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Flag,
  Loader2,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { CompiledArea } from "@/lib/geo/area";
import { countryAt, type Boundaries } from "@/lib/geo/boundaries";
import { COUNTRY_BY_CODE, flagEmoji } from "@/lib/geo/countries";
import { haversineKm, type LatLng } from "@/lib/geo/geometry";
import { MAP_ID } from "@/lib/geo/google-maps";
import { findLocation, LocationSearchError, type GameLocation } from "@/lib/geo/location-finder";
import { formatDistance, formatScore, MAX_ROUND_SCORE, scoreForDistance } from "@/lib/geo/scoring";
import type { GameSettings, HistoryEntry } from "@/lib/geo/storage";

interface RoundResult {
  location: GameLocation;
  guess: LatLng | null;
  distanceKm: number | null;
  score: number;
  actualCountry: string | null;
  guessCountry: string | null;
}

type Phase = "loading" | "guessing" | "result" | "summary" | "error";

interface Props {
  area: CompiledArea;
  areaKey: string;
  boundaries: Boundaries;
  settings: GameSettings;
  // שומר את המשחק בהיסטוריה ומחזיר את השיא הקודם לאותה מפה.
  onFinished: (entry: HistoryEntry) => number | null;
  onExit: () => void;
}

export function GameView({ area, areaKey, boundaries, settings, onFinished, onExit }: Props) {
  const isMobile = useIsMobile();
  const panoDiv = useRef<HTMLDivElement>(null);
  const mapDiv = useRef<HTMLDivElement>(null);
  const panoRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const guessMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const overlaysRef = useRef<{ setMap(map: google.maps.Map | null): void }[]>([]);
  const needleRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [location, setLocation] = useState<GameLocation | null>(null);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [mapHover, setMapHover] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);

  // ערכים עדכניים לשימוש בתוך מאזינים של גוגל ובטיימרים.
  const phaseRef = useRef(phase);
  const guessRef = useRef(guess);
  const locationRef = useRef(location);
  phaseRef.current = phase;
  guessRef.current = guess;
  locationRef.current = location;

  const gameRef = useRef<{ abort: AbortController } | null>(null);
  const usedLocationsRef = useRef<GameLocation[]>([]);
  const prefetchRef = useRef<{ round: number; promise: Promise<GameLocation> } | null>(null);
  const roundStartRef = useRef(0);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);

  const totalScore = results.reduce((s, r) => s + r.score, 0);

  const clearOverlays = () => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
  };

  const resetMapView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const [west, south, east, north] = area.bounds;
    if (east - west >= 359) {
      map.setCenter({ lat: 25, lng: 10 });
      map.setZoom(1);
    } else {
      map.fitBounds({ west, south, east, north }, 8);
    }
  }, [area]);

  const showLocation = (loc: GameLocation) => {
    panoRef.current?.setOptions({
      pano: loc.panoId,
      pov: { heading: loc.heading, pitch: 0 },
      zoom: 0,
    });
  };

  const prefetch = (round: number, game: { abort: AbortController }) => {
    const promise = findLocation(area, { exclude: [...usedLocationsRef.current], signal: game.abort.signal });
    promise.catch(() => undefined); // השגיאה תטופל כשהסבב יתחיל
    prefetchRef.current = { round, promise };
  };

  const loadRound = useCallback(
    async (round: number) => {
      const game = gameRef.current;
      if (!game) return;
      setPhase("loading");
      setRoundIndex(round);
      setError(null);
      try {
        const pre = prefetchRef.current;
        prefetchRef.current = null;
        let loc: GameLocation;
        if (pre && pre.round === round) {
          try {
            loc = await pre.promise;
          } catch (e) {
            if (e instanceof LocationSearchError && (e.reason === "denied" || e.reason === "aborted")) throw e;
            loc = await findLocation(area, { exclude: usedLocationsRef.current, signal: game.abort.signal });
          }
        } else {
          loc = await findLocation(area, { exclude: usedLocationsRef.current, signal: game.abort.signal });
        }
        if (gameRef.current !== game) return;

        usedLocationsRef.current.push(loc);
        clearOverlays();
        if (guessMarkerRef.current) guessMarkerRef.current.map = null;
        locationRef.current = loc; // לפני החלפת הפנורמה, כדי שהשומר של מצב "בלי תזוזה" יכיר את הנקודה החדשה
        showLocation(loc);
        setLocation(loc);
        setGuess(null);
        setMobileMapOpen(false);
        roundStartRef.current = Date.now();
        setPhase("guessing");
        if (round + 1 < settings.rounds) prefetch(round + 1, game);
      } catch (e) {
        if (gameRef.current !== game) return;
        if (e instanceof LocationSearchError && e.reason === "aborted") return;
        setError(e instanceof Error ? e.message : "משהו השתבש בחיפוש מיקום");
        setPhase("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area, settings.rounds],
  );

  const startGame = useCallback(() => {
    gameRef.current?.abort.abort();
    gameRef.current = { abort: new AbortController() };
    usedLocationsRef.current = [];
    prefetchRef.current = null;
    finishedRef.current = false;
    setResults([]);
    setPreviousBest(null);
    clearOverlays();
    loadRound(0);
  }, [loadRound]);

  // יצירת הפנורמה והמפה פעם אחת, ושימוש חוזר בהן בכל הסבבים.
  useEffect(() => {
    if (!panoDiv.current || !mapDiv.current) return;
    if (panoRef.current) {
      startGame();
      return () => {
        gameRef.current?.abort.abort();
        gameRef.current = null;
      };
    }
    const canMove = settings.movement === "move";
    const canLook = settings.movement !== "nmpz";
    const pano = new google.maps.StreetViewPanorama(panoDiv.current, {
      addressControl: false,
      showRoadLabels: false,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      enableCloseButton: false,
      imageDateControl: false,
      linksControl: canMove,
      clickToGo: canMove,
      panControl: canLook,
      zoomControl: canLook,
      scrollwheel: canLook,
      disableDoubleClickZoom: !canLook,
      visible: true,
    });
    if (!canMove) {
      // במצבים בלי תזוזה: חוסמים חיצי קדימה/אחורה, ואם בכל זאת זזנו – חוזרים לנקודת ההתחלה.
      panoDiv.current.addEventListener(
        "keydown",
        (e) => {
          if (["ArrowUp", "ArrowDown", "w", "s", "W", "S"].includes(e.key)) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
        true,
      );
      pano.addListener("pano_changed", () => {
        const loc = locationRef.current;
        if (loc && pano.getPano() !== loc.panoId) pano.setPano(loc.panoId);
      });
    }
    pano.addListener("pov_changed", () => {
      const heading = pano.getPov().heading ?? 0;
      if (needleRef.current) needleRef.current.style.transform = `rotate(${-heading}deg)`;
    });

    const map = new google.maps.Map(mapDiv.current, {
      mapId: MAP_ID,
      center: { lat: 25, lng: 10 },
      zoom: 1,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      draggableCursor: "crosshair",
    });
    const guessMarker = new google.maps.marker.AdvancedMarkerElement({ content: pinElement("guess") });
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (phaseRef.current !== "guessing" || !e.latLng) return;
      const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      guessMarker.position = point;
      guessMarker.map = map;
      setGuess(point);
    });

    panoRef.current = pano;
    mapRef.current = map;
    guessMarkerRef.current = guessMarker;
    startGame();

    return () => {
      gameRef.current?.abort.abort();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitGuess = useCallback(() => {
    const loc = locationRef.current;
    if (phaseRef.current !== "guessing" || !loc) return;
    const g = guessRef.current;
    const distanceKm = g ? haversineKm(g, loc) : null;
    const result: RoundResult = {
      location: loc,
      guess: g,
      distanceKm,
      score: distanceKm == null ? 0 : scoreForDistance(distanceKm, area.scaleKm),
      actualCountry: countryAt(boundaries, loc.lat, loc.lng),
      guessCountry: g ? countryAt(boundaries, g.lat, g.lng) : null,
    };
    phaseRef.current = "result";
    setResults((prev) => [...prev, result]);
    setPhase("result");
    setMobileMapOpen(false);

    const map = mapRef.current;
    if (map) {
      if (guessMarkerRef.current) guessMarkerRef.current.map = null;
      clearOverlays();
      drawRound(map, result, undefined, overlaysRef.current);
      // מחכים שהמפה תתרחב למסך מלא לפני ההתמקדות.
      setTimeout(() => fitToResults(map, [result], isMobile), 150);
    }
  }, [area.scaleKm, boundaries, isMobile]);

  const nextRound = useCallback(() => {
    if (phaseRef.current !== "result") return;
    if (roundIndex + 1 < settings.rounds) {
      loadRound(roundIndex + 1);
      return;
    }
    // סוף המשחק
    phaseRef.current = "summary";
    setPhase("summary");
    const map = mapRef.current;
    if (map) {
      clearOverlays();
      results.forEach((r, i) => drawRound(map, r, i + 1, overlaysRef.current));
      setTimeout(() => fitToResults(map, results, isMobile), 150);
    }
    if (!finishedRef.current) {
      finishedRef.current = true;
      const total = results.reduce((s, r) => s + r.score, 0);
      const prev = onFinished({
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        areaKey,
        areaLabel: area.label,
        settings,
        total,
        max: settings.rounds * MAX_ROUND_SCORE,
        rounds: results.map((r) => ({ score: r.score, distanceKm: r.distanceKm, countryCode: r.actualCountry })),
      });
      setPreviousBest(prev);
    }
  }, [roundIndex, settings, results, loadRound, isMobile, onFinished, areaKey, area.label]);

  // בתחילת כל סבב: מיקוד המפה על האזור, אחרי שהמכל שלה חזר לגודל הרגיל.
  useEffect(() => {
    if (phase !== "guessing") return;
    const id = setTimeout(resetMapView, 60);
    return () => clearTimeout(id);
  }, [phase, roundIndex, resetMapView]);

  // טיימר לסבב
  useEffect(() => {
    if (phase !== "guessing" || !settings.timeLimitSec) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const left = settings.timeLimitSec - (Date.now() - roundStartRef.current) / 1000;
      if (left <= 0) {
        setTimeLeft(0);
        submitGuess();
      } else {
        setTimeLeft(left);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roundIndex, settings.timeLimitSec, submitGuess]);

  // מקשי קיצור: רווח/Enter לניחוש ולמעבר לסבב הבא
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, button, [role=dialog]")) return;
      if (phaseRef.current === "guessing" && guessRef.current) {
        e.preventDefault();
        submitGuess();
      } else if (phaseRef.current === "result") {
        e.preventDefault();
        nextRound();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitGuess, nextRound]);

  const returnToStart = () => {
    const loc = locationRef.current;
    if (loc) showLocation(loc);
  };

  const onMapEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setMapHover(true);
  };
  const onMapLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setMapHover(false), 600);
  };

  const fullMap = phase === "result" || phase === "summary";
  const lastResult = results[results.length - 1];
  const inProgress = phase !== "summary";

  return (
    <div className="fixed inset-0 overflow-hidden bg-neutral-900 text-white">
      {/* Street View */}
      <div ref={panoDiv} dir="ltr" className="absolute inset-0" />
      {settings.movement === "nmpz" && <div className="absolute inset-0 z-[1]" aria-hidden />}

      {/* סרגל עליון */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <HudChip label="מפה" value={area.label} />
          <HudChip label="סבב" value={`${Math.min(roundIndex + 1, settings.rounds)} / ${settings.rounds}`} />
          <HudChip label="ניקוד" value={formatScore(totalScore)} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          {timeLeft != null && (
            <div
              className={cn(
                "rounded-full bg-black/70 px-4 py-1.5 text-lg font-bold tabular-nums shadow-lg backdrop-blur",
                timeLeft <= 10 && "animate-pulse bg-red-600/90",
              )}
            >
              {formatTime(timeLeft)}
            </div>
          )}
          {phase === "guessing" && settings.movement !== "nmpz" && (
            <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full shadow-lg" onClick={returnToStart} title="חזרה לנקודת ההתחלה">
              <Flag />
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={() => (inProgress && results.length > 0 ? setConfirmExit(true) : onExit())}
            title="יציאה"
          >
            <X />
          </Button>
        </div>
      </div>

      {/* מצפן (נשאר בעץ גם כשהוא מוסתר, כדי לשמור על הכיוון האחרון) */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 md:top-3",
          phase !== "guessing" && "hidden",
        )}
      >
        <div className="relative h-11 w-11 rounded-full border-2 border-white/70 bg-black/50 shadow-lg backdrop-blur">
          <div ref={needleRef} className="absolute inset-0 transition-transform duration-75">
            <div className="absolute left-1/2 top-1 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[16px] border-x-transparent border-b-red-500" />
            <div className="absolute bottom-1 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[16px] border-x-transparent border-t-white" />
          </div>
        </div>
      </div>

      {/* מפת הניחוש – מתרחבת למסך מלא בתוצאות */}
      <div
        dir="ltr"
        onMouseEnter={!isMobile ? onMapEnter : undefined}
        onMouseLeave={!isMobile ? onMapLeave : undefined}
        className={cn(
          "absolute z-20 overflow-hidden",
          fullMap
            ? "inset-0"
            : isMobile
              ? mobileMapOpen
                ? "inset-0"
                : "pointer-events-none invisible inset-0"
              : cn(
                  "bottom-20 left-4 rounded-xl border-2 border-white/40 shadow-2xl transition-[width,height,opacity] duration-200",
                  mapHover ? "h-[min(520px,62vh)] w-[min(760px,62vw)] opacity-100" : "h-[230px] w-[330px] opacity-80",
                ),
        )}
      >
        <div ref={mapDiv} className="h-full w-full" />
      </div>

      {/* כפתורי ניחוש */}
      {phase === "guessing" && !isMobile && (
        <div
          className={cn(
            "absolute bottom-4 left-4 z-20 transition-[width] duration-200",
            mapHover ? "w-[min(760px,62vw)]" : "w-[330px]",
          )}
          onMouseEnter={onMapEnter}
          onMouseLeave={onMapLeave}
        >
          <Button size="lg" className="h-12 w-full rounded-xl text-base shadow-xl" disabled={!guess} onClick={submitGuess}>
            <MapPin />
            {guess ? "ניחוש!" : "סמנו נקודה על המפה"}
          </Button>
        </div>
      )}
      {phase === "guessing" && isMobile && (
        <div className="absolute inset-x-3 bottom-4 z-30 flex gap-2">
          {mobileMapOpen ? (
            <>
              <Button variant="secondary" className="h-12 flex-1 rounded-xl shadow-xl" onClick={() => setMobileMapOpen(false)}>
                <ArrowRight />
                לתמונה
              </Button>
              <Button className="h-12 flex-[2] rounded-xl text-base shadow-xl" disabled={!guess} onClick={submitGuess}>
                <MapPin />
                {guess ? "ניחוש!" : "סמנו נקודה"}
              </Button>
            </>
          ) : (
            <Button className="h-12 w-full rounded-xl text-base shadow-xl" onClick={() => setMobileMapOpen(true)}>
              <MapIcon />
              {guess ? "למפה (יש ניחוש)" : "פתיחת המפה"}
            </Button>
          )}
        </div>
      )}

      {/* תוצאת סבב */}
      {phase === "result" && lastResult && (
        <ResultPanel>
          <RoundSummary result={lastResult} />
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              href={streetViewUrl(lastResult.location)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              לפתוח את המקום ב-Google Maps
            </a>
            <Button size="lg" className="text-base" onClick={nextRound} autoFocus>
              {roundIndex + 1 < settings.rounds ? "לסבב הבא" : "לסיכום המשחק"}
            </Button>
          </div>
        </ResultPanel>
      )}

      {/* סיכום משחק */}
      {phase === "summary" && (
        <ResultPanel wide>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">ניקוד סופי · {area.label}</div>
              <div className="text-4xl font-bold tabular-nums">
                {formatScore(totalScore)}
                <span className="text-lg font-normal text-muted-foreground"> / {formatScore(settings.rounds * MAX_ROUND_SCORE)}</span>
              </div>
            </div>
            {(previousBest == null || totalScore > previousBest) && totalScore > 0 ? (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                <Trophy className="h-4 w-4" />
                {previousBest == null ? "שיא ראשון במפה הזו" : "שיא אישי חדש!"}
              </div>
            ) : (
              previousBest != null && (
                <div className="text-sm text-muted-foreground">השיא שלך במפה הזו: {formatScore(previousBest)}</div>
              )
            )}
          </div>
          <ScoreBar value={totalScore / (settings.rounds * MAX_ROUND_SCORE)} />
          <div className="mt-3 max-h-[28vh] overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 pe-2 font-semibold tabular-nums">{i + 1}</td>
                    <td className="py-1.5 pe-2">
                      <a href={streetViewUrl(r.location)} target="_blank" rel="noreferrer" className="hover:underline">
                        {countryLabel(r.actualCountry)}
                      </a>
                    </td>
                    <td className="py-1.5 pe-2 text-muted-foreground tabular-nums">
                      {r.distanceKm == null ? "לא נוחש" : formatDistance(r.distanceKm)}
                    </td>
                    <td className="py-1.5 text-left font-semibold tabular-nums">{formatScore(r.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onExit}>
              חזרה לבחירת מפה
            </Button>
            <Button onClick={startGame}>
              <RotateCcw />
              משחק נוסף באותה מפה
            </Button>
          </div>
        </ResultPanel>
      )}

      {/* טעינה */}
      {phase === "loading" && (
        <div className="absolute inset-0 z-[25] flex flex-col items-center justify-center gap-3 bg-neutral-900/85 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-lg">מחפשים מקום על הגלובוס…</p>
          <p className="text-sm text-white/60">{area.label}</p>
        </div>
      )}

      {/* שגיאה */}
      {phase === "error" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-900/90 p-6">
          <div className="max-w-md space-y-4 rounded-xl bg-card p-6 text-card-foreground shadow-2xl">
            <p className="font-medium">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => loadRound(results.length)}>ניסיון נוסף</Button>
              <Button variant="outline" onClick={onExit}>
                חזרה לבחירת מפה
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>לצאת מהמשחק?</AlertDialogTitle>
            <AlertDialogDescription>המשחק הנוכחי לא יישמר בהיסטוריה.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start sm:space-x-0">
            <AlertDialogAction onClick={onExit}>יציאה</AlertDialogAction>
            <AlertDialogCancel className="mt-0">המשך לשחק</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function HudChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="max-w-[46vw] rounded-lg bg-black/65 px-3 py-1.5 shadow-lg backdrop-blur">
      <div className="text-[10px] uppercase leading-none text-white/60">{label}</div>
      <div className="truncate text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ResultPanel({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 sm:p-4">
      <div
        className={cn(
          "w-full rounded-2xl bg-card p-4 text-card-foreground shadow-2xl sm:p-5",
          wide ? "max-w-2xl" : "max-w-xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function RoundSummary({ result }: { result: RoundResult }) {
  const sameCountry = result.guessCountry != null && result.guessCountry === result.actualCountry;
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-3xl font-bold tabular-nums">
          {formatScore(result.score)}
          <span className="text-base font-normal text-muted-foreground"> נקודות</span>
        </div>
        <div className="text-left text-sm text-muted-foreground">
          {result.distanceKm == null ? "הזמן נגמר בלי ניחוש" : `במרחק ${formatDistance(result.distanceKm)}`}
        </div>
      </div>
      <ScoreBar value={result.score / MAX_ROUND_SCORE} />
      <div className="mt-3 space-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">המקום האמיתי: </span>
          <span className="font-semibold">{countryLabel(result.actualCountry)}</span>
          {result.location.description && <span className="text-muted-foreground"> · {result.location.description}</span>}
        </div>
        {result.guess && (
          <div>
            <span className="text-muted-foreground">הניחוש שלך: </span>
            <span className="font-medium">{countryLabel(result.guessCountry)}</span>
            {sameCountry && <span className="ms-1.5 text-emerald-600">✓ המדינה הנכונה</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-amber-400 transition-[width] duration-700"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

function countryLabel(code: string | null): string {
  if (!code) return "לא מזוהה (ים או שטח לא מסומן)";
  return `${flagEmoji(code)} ${COUNTRY_BY_CODE[code]?.name ?? code}`;
}

function formatTime(sec: number): string {
  const s = Math.ceil(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function streetViewUrl(loc: GameLocation): string {
  const params = new URLSearchParams({
    api: "1",
    map_action: "pano",
    pano: loc.panoId,
    viewpoint: `${loc.lat},${loc.lng}`,
    heading: String(Math.round(loc.heading)),
  });
  return `https://www.google.com/maps/@?${params}`;
}

function pinElement(kind: "guess" | "actual", label?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = cn(
    "flex translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white text-xs font-bold text-white shadow-lg",
    kind === "guess" ? "h-6 w-6 bg-sky-600" : "h-7 w-7 bg-emerald-600",
  );
  if (label) el.textContent = label;
  else if (kind === "actual") el.textContent = "★";
  return el;
}

function drawRound(
  map: google.maps.Map,
  r: RoundResult,
  label: number | undefined,
  overlays: { setMap(map: google.maps.Map | null): void }[],
) {
  const actual = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: { lat: r.location.lat, lng: r.location.lng },
    content: pinElement("actual", label ? String(label) : undefined),
    zIndex: 2,
  });
  overlays.push({ setMap: (m) => (actual.map = m) });
  if (!r.guess) return;
  const guess = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: r.guess,
    content: pinElement("guess", label ? String(label) : undefined),
    zIndex: 1,
  });
  overlays.push({ setMap: (m) => (guess.map = m) });
  const line = new google.maps.Polyline({
    map,
    path: [r.guess, { lat: r.location.lat, lng: r.location.lng }],
    geodesic: true,
    strokeOpacity: 0,
    icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, strokeColor: "#111827", scale: 3 }, offset: "0", repeat: "14px" }],
  });
  overlays.push(line);
}

function fitToResults(map: google.maps.Map, results: RoundResult[], isMobile: boolean) {
  const bounds = new google.maps.LatLngBounds();
  for (const r of results) {
    bounds.extend({ lat: r.location.lat, lng: r.location.lng });
    if (r.guess) bounds.extend(r.guess);
  }
  if (bounds.isEmpty()) return;
  const bottom = isMobile ? 300 : 260;
  map.fitBounds(bounds, { top: 80, bottom, left: 40, right: 40 });
  // נקודה בודדת (או שתי נקודות צמודות) – לא להתקרב יותר מדי
  google.maps.event.addListenerOnce(map, "idle", () => {
    if ((map.getZoom() ?? 0) > 16) map.setZoom(16);
  });
}
