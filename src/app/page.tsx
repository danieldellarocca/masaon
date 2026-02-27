
"use client";

import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

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
  const [isRetrying, setIsRetrying] = useState(false);
  
  const notFoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("masaon_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("masaon_user");
        }
      } catch (e) {
        localStorage.removeItem("masaon_user");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!user?.tripId) {
      setTrip(null);
      setSyncError(null);
      return;
    }

    console.log("Subscribing to trip:", user.tripId);
    const tripRef = doc(db, "trips", user.tripId);
    
    if (notFoundTimeoutRef.current) {
      clearTimeout(notFoundTimeoutRef.current);
    }

    const unsub = onSnapshot(tripRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          if (notFoundTimeoutRef.current) {
            clearTimeout(notFoundTimeoutRef.current);
            notFoundTimeoutRef.current = null;
          }
          setTrip({ ...docSnap.data(), id: docSnap.id } as Trip);
          setSyncError(null);
        } else {
          // נותנים לזה 10 שניות לפני שמתייאשים
          if (!notFoundTimeoutRef.current) {
            notFoundTimeoutRef.current = setTimeout(() => {
              setSyncError("לא מצאנו את נתוני המסע בשרת. וודא שהקוד שקיבלת נכון.");
            }, 10000); 
          }
        }
      }, 
      (error) => {
        console.error("Firestore sync error:", error);
        setSyncError("שגיאה בחיבור לשרת. בדוק את החיבור לאינטרנט.");
      }
    );

    return () => {
      unsub();
      if (notFoundTimeoutRef.current) clearTimeout(notFoundTimeoutRef.current);
    };
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
        
        // יצירה בשרת - אופטימי
        setDoc(doc(db, "trips", normalizedTripId), newTrip, { merge: true })
          .catch(e => console.error("Error creating trip:", e));
      }

      if (userData.role === 'student') {
        const tripRef = doc(db, "trips", normalizedTripId);
        
        // בדיקה מהירה אם הטיול קיים
        const tripSnap = await getDoc(tripRef);
        if (!tripSnap.exists()) {
          throw new Error("קוד המסע שהזנת לא קיים במערכת.");
        }

        // הוספת החניך
        updateDoc(tripRef, {
          students: arrayUnion({ id: userData.id, name: userData.name })
        }).catch(e => console.warn("Could not sync student join immediately"));
      }

      setUser(userData);
      localStorage.setItem("masaon_user", JSON.stringify(userData));
      
      toast({
        title: "שלום " + userData.name,
        description: "מתחבר לנתוני המסע..."
      });
    } catch (error: any) {
      console.error("Login process error:", error);
      toast({
        variant: "destructive",
        title: "שגיאה בכניסה",
        description: error.message || "לא הצלחנו להתחבר לשרת."
      });
      throw error;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTrip(null);
    setSyncError(null);
    localStorage.removeItem("masaon_user");
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setSyncError(null);
    setTimeout(() => {
      setIsRetrying(false);
      // רענון הסטייט
      if (user) {
        const temp = {...user};
        setUser(null);
        setTimeout(() => setUser(temp), 100);
      }
    }, 500);
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

  // אם המשתמש מחובר אבל הטיול עדיין לא נטען, נציג מסך טעינה
  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        {syncError ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">{syncError}</h2>
            <p className="text-sm text-muted-foreground">נסה לבדוק את הקוד שוב או לבקש מהמלווה קישור חדש.</p>
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleRetry} className="w-full gap-2">
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                נסה שוב
              </Button>
              <Button variant="outline" onClick={handleLogout} className="w-full">התנתק וחזור</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold">מתחבר למסע...</h2>
              <p className="text-sm text-muted-foreground">מנסה לסנכרן נתונים מהשרת</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // רק כשיש גם משתמש וגם טיול, נציג את הדאשבורד
  return (
    <div className="min-h-screen bg-background">
      {user.role === "guide" ? (
        <GuideDashboard 
          user={user} 
          trip={trip} 
          setTrip={updateTripInFirestore as any} 
          onLogout={handleLogout} 
        />
      ) : (
        <StudentDashboard 
          user={user} 
          trip={trip} 
          setTrip={updateTripInFirestore as any} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}
