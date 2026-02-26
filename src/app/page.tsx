"use client";

import { useState, useEffect } from "react";
import { User, Trip } from "@/lib/types";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { GuideDashboard } from "@/components/dashboard/GuideDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

const MOCK_INITIAL_TRIP: Trip = {
  id: "trip-1",
  name: "מסע ישראלי 2024",
  joinCode: "ISRAEL24",
  itinerary: [
    { dayNumber: 1, date: "2024-05-01", location: "ירושלים", activities: "סיור בעיר העתיקה, כותל המערבי" },
    { dayNumber: 2, date: "2024-05-02", location: "מדבר יהודה", activities: "טיול במצדה, רחצה בים המלח" }
  ],
  notices: [
    { id: "1", content: "מחר יוצאים ב-07:00 בדיוק!", timestamp: new Date().toISOString() }
  ],
  logistics: [],
  wakeUpTime: "06:30",
  lightsOutTime: "23:00",
  clothingGuide: "נעלי הליכה נוחות, כובע ומים."
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip>(MOCK_INITIAL_TRIP);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("masaon_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const savedTrip = localStorage.getItem("masaon_trip");
    if (savedTrip) {
      setTrip(JSON.parse(savedTrip));
    }
    
    setIsLoaded(true);
  }, []);

  // Sync trip to local storage to simulate "real-time" behavior between roles in one browser
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("masaon_trip", JSON.stringify(trip));
      
      // Listen for storage changes to sync across tabs (simulating backend)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "masaon_trip" && e.newValue) {
          setTrip(JSON.parse(e.newValue));
        }
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [trip, isLoaded]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("masaon_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("masaon_user");
  };

  if (!isLoaded) return null;

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {user.role === "guide" ? (
        <GuideDashboard user={user} trip={trip} setTrip={setTrip} onLogout={handleLogout} />
      ) : (
        <StudentDashboard user={user} trip={trip} setTrip={setTrip} onLogout={handleLogout} />
      )}
    </div>
  );
}
