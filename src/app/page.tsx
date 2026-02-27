
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
import { useToast } from "@/hooks/use-toast";

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

  // טעינת משתמש קיים מ-localStorage
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

  // האזנה לשינויים בטיול בזמן אמת ב-Firestore
  useEffect(() => {
    if (!user?.tripId) {
      setTrip(null);
      return;
    }

    const tripRef = doc(db, "trips", user.tripId);
    const unsub = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        setTrip({ ...docSnap.data(), id: docSnap.id } as Trip);
      } else {
        console.warn("Trip document not found in Firestore");
        // אם הטיול נמחק, כדאי להוציא את המשתמש
        if (user.role === 'student') {
          toast({ variant: "destructive", title: "המסע הסתיים", description: "המסע שאליו היית מחובר לא נמצא יותר." });
          handleLogout();
        }
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
    });

    return () => unsub();
  }, [user?.tripId]);

  const handleLogin = async (userData: User, customJoinCode?: string) => {
    try {
      if (userData.role === 'guide' && customJoinCode) {
        const tripId = customJoinCode;
        const newTrip: Trip = {
          ...STATIC_INITIAL_TRIP,
          id: tripId,
          joinCode: customJoinCode,
          name: `המסע של ${userData.name}`,
          students: []
        } as Trip;
        
        // יצירת הטיול ללא await כדי לא להיתקע
        setDoc(doc(db, "trips", tripId), newTrip).catch(err => {
          console.error("Failed to sync new trip:", err);
        });
        
        userData.tripId = tripId;
      }

      if (userData.role === 'student' && userData.tripId) {
        const tripId = userData.tripId.trim().toUpperCase();
        const tripRef = doc(db, "trips", tripId);
        
        // בדיקת קיום הטיול בצורה בטוחה
        const tripSnap = await getDoc(tripRef);
        if (!tripSnap.exists()) {
          throw new Error("קוד מסע לא תקין. וודא שהזנת את הקוד שקיבלת מהמלווה.");
        }
        
        userData.tripId = tripId;
        
        // עדכון רשימת הסטודנטים ברקע
        updateDoc(tripRef, {
          students: arrayUnion({ id: userData.id, name: userData.name })
        }).catch(err => console.error("Sync student error:", err));
      }

      // שמירה מקומית ומעבר לדאשבורד
      setUser(userData);
      localStorage.setItem("masaon_user", JSON.stringify(userData));
      
      toast({
        title: "שלום " + userData.name,
        description: "התחברת למסע בהצלחה."
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "שגיאה בכניסה",
        description: error.message || "לא הצלחנו להתחבר למסע כרגע."
      });
      throw error;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTrip(null);
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

    // עדכון ב-Firestore ללא await לחוויה מהירה
    setDoc(doc(db, "trips", user.tripId), updated, { merge: true }).catch(err => {
      console.error("Firestore update failed:", err);
      toast({
        variant: "destructive",
        title: "שגיאת סנכרון",
        description: "השינוי נשמר מקומית אך לא נשלח לשרת."
      });
    });
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-6"></div>
        <h2 className="text-xl font-bold mb-2">מתחבר לנתוני המסע...</h2>
        <p className="text-sm text-muted-foreground mb-8">
          זה עשוי לקחת רגע בחיבור ראשון.
        </p>
        <Button variant="outline" onClick={handleLogout}>התנתק וחזור</Button>
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
