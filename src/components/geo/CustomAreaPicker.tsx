"use client";

import { useEffect, useRef } from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatRadius } from "@/lib/geo/area";
import type { LatLng } from "@/lib/geo/geometry";
import { MAP_ID } from "@/lib/geo/google-maps";

interface Props {
  mapsReady: boolean;
  value: { center: LatLng; radiusKm: number } | null;
  onChange: (value: { center: LatLng; radiusKm: number }) => void;
}

const MIN_KM = 1;
const MAX_KM = 2000;
// סליידר לוגריתמי: 0..100 ממופה ל-1..2000 ק״מ.
const toKm = (v: number) => Math.round(MIN_KM * Math.pow(MAX_KM / MIN_KM, v / 100) * 10) / 10;
const toSlider = (km: number) => (Math.log(km / MIN_KM) / Math.log(MAX_KM / MIN_KM)) * 100;

export function CustomAreaPicker({ mapsReady, value, onChange }: Props) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!mapsReady || !mapDiv.current || mapRef.current) return;
    const initial = valueRef.current;
    const map = new google.maps.Map(mapDiv.current, {
      mapId: MAP_ID,
      center: initial?.center ?? { lat: 31.5, lng: 35 },
      zoom: initial ? 7 : 5,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      draggableCursor: "crosshair",
    });
    const circle = new google.maps.Circle({
      map,
      clickable: false,
      strokeColor: "#24628F",
      strokeWeight: 2,
      fillColor: "#30D9E8",
      fillOpacity: 0.2,
      visible: false,
    });
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      onChangeRef.current({
        center: { lat: e.latLng.lat(), lng: e.latLng.lng() },
        radiusKm: valueRef.current?.radiusKm ?? 25,
      });
    });
    mapRef.current = map;
    circleRef.current = circle;
    if (initial) {
      const b = circleBounds(initial.center, initial.radiusKm);
      map.fitBounds(b, 24);
    }
  }, [mapsReady]);

  useEffect(() => {
    const circle = circleRef.current;
    const map = mapRef.current;
    if (!circle || !map) return;
    if (!value) {
      circle.setVisible(false);
      return;
    }
    circle.setCenter(value.center);
    circle.setRadius(value.radiusKm * 1000);
    circle.setVisible(true);
    const bounds = circle.getBounds();
    const view = map.getBounds();
    if (bounds && view && !(view.contains(bounds.getNorthEast()) && view.contains(bounds.getSouthWest()))) {
      map.fitBounds(bounds, 24);
    }
  }, [value]);

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <MousePointerClick className="h-4 w-4" />
        לחצו על המפה כדי לבחור את מרכז האזור, ואז קבעו את הרדיוס.
      </p>
      <div className="relative h-[340px] overflow-hidden rounded-lg border" dir="ltr">
        <div ref={mapDiv} className="h-full w-full" />
        {!mapsReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="w-14 shrink-0 text-sm font-medium">רדיוס</span>
        <Slider
          dir="rtl"
          min={0}
          max={100}
          step={0.5}
          disabled={!value}
          value={[toSlider(value?.radiusKm ?? 25)]}
          onValueChange={([v]) => value && onChange({ ...value, radiusKm: toKm(v) })}
        />
        <span className="w-24 shrink-0 text-left text-sm tabular-nums">{formatRadius(value?.radiusKm ?? 25)}</span>
      </div>
    </div>
  );
}

function circleBounds(center: LatLng, radiusKm: number): google.maps.LatLngBoundsLiteral {
  const dLat = (radiusKm / 6371) * (180 / Math.PI);
  const dLng = dLat / Math.max(0.05, Math.cos((center.lat * Math.PI) / 180));
  return { north: center.lat + dLat, south: center.lat - dLat, east: center.lng + dLng, west: center.lng - dLng };
}
