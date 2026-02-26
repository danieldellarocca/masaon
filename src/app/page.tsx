
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
  emergencyContacts: [
    { name: "מוקד חירום ארצי", phone: "100" },
    { name: "מד\"א", phone: "101" }
  ],
  wakeUpTime: "06:30",
  lightsOutTime: "23:00"
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip>(MOCK_INITIAL_TRIP);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("masaon_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("masaon_user");
      }
    }
    
    const savedTrip = localStorage.getItem("masaon_trip");
    if (savedTrip) {
      try {
        const parsedTrip = JSON.parse(savedTrip);
        // Merge with initial mock to ensure all required fields exist
        setTrip({ 
          ...MOCK_INITIAL_TRIP, 
          ...parsedTrip,
          emergencyContacts: parsedTrip.emergencyContacts || MOCK_INITIAL_TRIP.emergencyContacts,
          itinerary: parsedTrip.itinerary || MOCK_INITIAL_TRIP.itinerary,
          notices: parsedTrip.notices || MOCK_INITIAL_TRIP.notices
        });
      } catch (e) {
        setTrip(MOCK_INITIAL_TRIP);
      }
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("masaon_trip", JSON.stringify(trip));
      
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "masaon_trip" && e.newValue) {
          try {
            setTrip(JSON.parse(e.newValue));
          } catch (err) {
            console.error("Failed to parse storage update", err);
          }
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
