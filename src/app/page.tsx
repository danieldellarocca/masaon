
"use client";

import { useState, useEffect } from "react";
import { User, Trip } from "@/lib/types";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { GuideDashboard } from "@/components/dashboard/GuideDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { db } from "@/firebase/config";
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  getDoc
} from "firebase/firestore";
import { Button } from "@/components/ui/button";

const STATIC_INITIAL_TRIP: Omit<Trip, "id" | "joinCode" | "name"> = {
  itinerary: [],
  notices: [],
  logistics: [],
  emergencyContacts: [
    { name: "מוקד חירום ארצי", phone: "100" },
    { name: "מד\"א", phone: "101" }
  ],
  students: [],
  reports: [],
  wakeUpTime: "07:00",
  lightsOutTime: "23:00"
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("masaon_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem("masaon_user");
      }
    }
    setIsLoaded(true);
  }, []);

  // Listen to Trip data in Firestore
  useEffect(() => {
    if (!user || !user.tripId) {
      setTrip(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "trips", user.tripId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Trip;
        setTrip(data);
      } else {
        console.error("Trip document not found");
      }
    });

    return () => unsub();
  }, [user]);

  const handleLogin = async (userData: User, customJoinCode?: string) => {
    if (userData.role === 'guide' && customJoinCode) {
      const tripId = customJoinCode;
      const newTrip: Trip = {
        ...STATIC_INITIAL_TRIP,
        id: tripId,
        joinCode: customJoinCode,
        name: `מסע של ${userData.name}`,
        students: []
      } as Trip;
      
      await setDoc(doc(db, "trips", tripId), newTrip);
      userData.tripId = tripId;
    }

    if (userData.role === 'student' && userData.tripId) {
      const tripRef = doc(db, "trips", userData.tripId);
      const tripSnap = await getDoc(tripRef);
      
      if (!tripSnap.exists()) {
        alert("קוד טיול לא נמצא! וודא שהזנת את הקוד הנכון.");
        return;
      }
      
      // Add student to the trip's students list if not already there
      await updateDoc(tripRef, {
        students: arrayUnion({ id: userData.id, name: userData.name })
      });
    }

    setUser(userData);
    localStorage.setItem("masaon_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setTrip(null);
    localStorage.removeItem("masaon_user");
  };

  // Centralized update function that writes to Firestore
  const updateTripInFirestore = async (newTripData: Trip | ((prev: Trip) => Trip)) => {
    if (!user?.tripId || !trip) return;
    
    let updated: Trip;
    if (typeof newTripData === 'function') {
      updated = newTripData(trip);
    } else {
      updated = newTripData;
    }

    // Persist to Firestore
    await setDoc(doc(db, "trips", user.tripId), updated, { merge: true });
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-primary font-bold">טוען מסעון...</div>
    </div>
  );

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (!trip && user.tripId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-primary font-bold mb-4">מתחבר לנתוני המסע ב-Firebase...</p>
        <Button variant="outline" onClick={handleLogout}>התנתק וחזור למסך כניסה</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {user.role === "guide" ? (
        <GuideDashboard 
          user={user} 
          trip={trip!} 
          setTrip={updateTripInFirestore as any} 
          onLogout={handleLogout} 
        />
      ) : (
        <StudentDashboard 
          user={user} 
          trip={trip!} 
          setTrip={updateTripInFirestore as any} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}
