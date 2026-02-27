
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

  // טעינת משתמש קיים מ-localStorage בטעינה ראשונה (Client-side only)
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

  // האזנה לשינויים בטיול בזמן אמת ב-Firestore
  useEffect(() => {
    if (!user || !user.tripId) {
      setTrip(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "trips", user.tripId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Trip;
        setTrip(data);
      }
    }, (error) => {
      console.error("Firestore listener error:", error);
    });

    return () => unsub();
  }, [user]);

  const handleLogin = async (userData: User, customJoinCode?: string) => {
    console.log("--- Starting Login Process ---", { role: userData.role, name: userData.name });

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
        
        // יצירת הטיול ב-Firestore (Optimistic update)
        setDoc(doc(db, "trips", tripId), newTrip).catch(err => {
          console.error("Failed to create trip document:", err);
          toast({ variant: "destructive", title: "שגיאה ביצירת המסע", description: err.message });
        });
        
        userData.tripId = tripId;
      }

      if (userData.role === 'student' && userData.tripId) {
        // ניקוי הקוד והפיכתו לאותיות גדולות
        const tripId = userData.tripId.trim().toUpperCase();
        const tripRef = doc(db, "trips", tripId);
        
        console.log("Attempting to fetch trip with ID:", tripId);
        
        // בדיקת קיום הטיול - הוספת טיפול מיוחד בשגיאות חירום
        const tripSnap = await getDoc(tripRef).catch(err => {
          console.error("Firestore getDoc error:", err);
          if (err.message?.includes('offline') || err.code === 'unavailable') {
            throw new Error("לא ניתן להתחבר לשרת כרגע. אנא וודא שיש לך חיבור לאינטרנט ונסה שוב.");
          }
          throw err;
        });
        
        if (!tripSnap.exists()) {
          throw new Error("קוד טיול לא נמצא. וודא שהזנת את הקוד הנכון שקיבלת מהמלווה.");
        }
        
        userData.tripId = tripId;
        
        // הוספת החניך לרשימת הסטודנטים בטיול
        updateDoc(tripRef, {
          students: arrayUnion({ id: userData.id, name: userData.name })
        }).catch(err => {
          console.error("Failed to add student to trip record:", err);
        });
      }

      // שמירת המשתמש באופן מקומי והעברה לדאשבורד
      setUser(userData);
      localStorage.setItem("masaon_user", JSON.stringify(userData));
      
      toast({
        title: "התחברת בהצלחה!",
        description: `שלום ${userData.name}, ברוך הבא למסעון.`
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "שגיאה בחיבור",
        description: error.message || "אירעה שגיאה לא צפויה בזמן החיבור למסע."
      });
      throw error; // זריקת השגיאה חזרה ל-AuthScreen כדי לעצור את הטעינה
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

    // עדכון ב-Firestore ללא המתנה (Optimistic)
    setDoc(doc(db, "trips", user.tripId), updated, { merge: true }).catch(err => {
      console.error("Firestore write error:", err);
      toast({
        variant: "destructive",
        title: "שגיאה בשמירת נתונים",
        description: "לא הצלחנו לעדכן את השרת. השינוי נשמר מקומית."
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

  // אם המשתמש מחובר לטיול אך הנתונים עדיין לא נטענו מהשרת
  if (!trip && user.tripId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <p className="text-primary font-bold mb-4">מתחבר לנתוני המסע בשרת...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-6"></div>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          זה עשוי לקחת מספר שניות בחיבור ראשון או במקרה של רשת איטית.
        </p>
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
