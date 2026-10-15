import type { Metadata } from "next";
import { GeoApp } from "@/components/geo/GeoApp";

export const metadata: Metadata = {
  title: "איפה אני? · משחק ניחוש מקומות",
  description: "משחק אישי לניחוש מקומות בעולם דרך Google Street View",
};

export default function GeoPage() {
  return <GeoApp />;
}
