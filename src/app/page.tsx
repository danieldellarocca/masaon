
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
  arrayUnion
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

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
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // טעינת משתמש קיים
  useEffect(() => {
    const savedUser = localStorage.getItem("masaon_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("masaon_user");
      }
    }
    setIsLoaded(true);
  }, []);

  // האזנה לשינויים בטיול בזמן אמת
  useEffect(() => {
    if (!user?.tripId) {
      setTrip(null);
      setSyncError(null);
      return;
    }

    const tripRef = doc(db, "trips", user.tripId);
    
    const unsub = onSnapshot(tripRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setTrip({ ...docSnap.data(), id: docSnap.id } as Trip);
          setSyncError(null);
        } else {
          setSyncError("לא מצאנו את נתוני המסע בשרת. ייתכן שהקוד שגוי או שהמסע נמחק.");
        }
      }, 
      (error) => {
        console.error("Firestore sync error:", error);
        setSyncError("שגיאה בחיבור לשרת. וודא שיש לך חיבור אינטרנט תקין.");
      }
    );

    return () => unsub();
  }, [user?.tripId]);

  const handleLogin = async (userData: User, customJoinCode?: string) => {
    try {
      const normalizedTripId = (customJoinCode || userData.tripId || "").trim().toUpperCase();
      
      if (!normalizedTripId) {
        throw new Error("קוד מסע חסר.");
      }

      userData.tripId = normalizedTripId;

      if (userData.role === 'guide' && customJoinCode) {
        const newTrip: Trip = {
          ...STATIC_INITIAL_TRIP,
          id: normalizedTripId,
          joinCode: normalizedTripId,
          name: `המסע של ${userData.name}`,
          students: []
        } as Trip;
        
        // יצירה אופטימית
        setDoc(doc(db, "trips", normalizedTripId), newTrip, { merge: true });
      }

      if (userData.role === 'student') {
        // עדכון רשימת הסטודנטים ברקע
        updateDoc(doc(db, "trips", normalizedTripId), {
          students: arrayUnion({ id: userData.id, name: userData.name })
        }).catch(() => {
          // אם נכשל (למשל הטיול לא קיים), ה-onSnapshot יתפוס את זה
        });
      }

      setUser(userData);
      localStorage.setItem("masaon_user", JSON.stringify(userData));
      
      toast({
        title: "שלום " + userData.name,
        description: "מתחבר לנתוני המסע..."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "שגיאה בכניסה",
        description: error.message || "לא הצלחנו להתחבר כרגע."
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTrip(null);
    setSyncError(null);
    localStorage.removeItem("masaon_user");
  };

  const updateTripInFirestore = (newTripData: Trip | ((prev: Trip) => Trip)) => {
    if (!user?.tripId || !trip) return;
    
    let updated: Trip;
    if (typeof newTripData === 'function') {
      updated = newTripData(trip);
    } else {
      updated = newTripData;
    }

    setDoc(doc(db, "trips", user.tripId), updated, { merge: true }).catch(err => {
      console.error("Firestore update failed:", err);
      toast({
        variant: "destructive",
        title: "שגיאת סנכרון",
        description: "השינוי לא נשמר בשרת."
      });
    });
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // מסך טעינה או שגיאה בחיבור לנתוני המסע
  if (!trip && user.tripId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        {syncError ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">{syncError}</h2>
            <p className="text-sm text-muted-foreground">נסה לבדוק את הקוד שוב או להתחבר מחדש.</p>
            <Button variant="outline" onClick={handleLogout} className="w-full">התנתק וחזור</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold">מתחבר לנתוני המסע בשרת...</h2>
              <p className="text-sm text-muted-foreground">זה עשוי לקחת כמה שניות בחיבור ראשון</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-xs">ביטול וחזרה</Button>
          </div>
        )}
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
