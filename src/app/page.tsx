
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
          // אם אנחנו מלווה, אולי הטיול בדרך? ניתן לו צ'אנס
          if (user.role === 'guide') {
            console.log("Waiting for trip document to be created...");
          } else {
            setSyncError("לא מצאנו את נתוני המסע בשרת. וודא שהקוד שקיבלת נכון.");
          }
        }
      }, 
      (error) => {
        console.error("Firestore sync error:", error);
        // לא נקפוץ מיד לשגיאה כי לפעמים זה לוקח זמן להתחבר בסביבת פיתוח
        if (error.code !== 'permission-denied') {
          setSyncError("שגיאה בחיבור לשרת. נסה לרענן.");
        }
      }
    );

    return () => unsub();
  }, [user?.tripId, user?.role]);

  const handleLogin = async (userData: User, customJoinCode?: string) => {
    try {
      const normalizedTripId = (customJoinCode || userData.tripId || "").trim().toUpperCase();
      
      if (!normalizedTripId) {
        throw new Error("קוד מסע חסר.");
      }

      userData.tripId = normalizedTripId;

      // מלווה יוצר טיול חדש - ללא await כדי למנוע תקיעה
      if (userData.role === 'guide' && customJoinCode) {
        const newTrip: Trip = {
          ...STATIC_INITIAL_TRIP,
          id: normalizedTripId,
          joinCode: normalizedTripId,
          name: `המסע של ${userData.name}`,
          students: []
        } as Trip;
        
        // שליחה לשרת ברקע
        setDoc(doc(db, "trips", normalizedTripId), newTrip, { merge: true }).catch(err => {
          console.error("Failed to create trip document:", err);
        });
      }

      // חניך מצטרף לטיול קיים
      if (userData.role === 'student') {
        const tripRef = doc(db, "trips", normalizedTripId);
        // כאן אנחנו חייבים לוודא שהטיול קיים, אבל עם טיפול בשגיאות
        try {
          const tripSnap = await getDoc(tripRef);
          if (!tripSnap.exists()) {
            throw new Error("קוד הטיול אינו קיים. אנא בדוק שוב עם המלווה.");
          }
          // עדכון החניך ברקע
          updateDoc(tripRef, {
            students: arrayUnion({ id: userData.id, name: userData.name })
          }).catch(e => console.error("Sync error for student join:", e));
        } catch (e: any) {
          if (e.message.includes("offline")) {
            // אם אנחנו אופליין, נאפשר לו להיכנס ונקווה שהסנכרון יעבוד בהמשך
            console.warn("Offline join attempt");
          } else {
            throw e;
          }
        }
      }

      // המשך מיידי לממשק
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
        title: "שגיאה בתהליך הכניסה",
        description: error.message || "לא הצלחנו להתחבר כרגע."
      });
      throw error; // חשוב כדי שה-AuthScreen יפסיק את מצב הטעינה
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
    setTimeout(() => {
      setIsRetrying(false);
      // רענון החיבור על ידי שינוי קטן במצב
      if (user) {
        const temp = {...user};
        setUser(null);
        setTimeout(() => setUser(temp), 10);
      }
    }, 1000);
  };

  const updateTripInFirestore = (newTripData: Trip | ((prev: Trip) => Trip)) => {
    if (!user?.tripId || !trip) return;
    
    let updated: Trip;
    if (typeof newTripData === 'function') {
      updated = newTripData(trip);
    } else {
      updated = newTripData;
    }

    // עדכון אופטימי בשרת (ללא await)
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
              <h2 className="text-xl font-bold">מתחבר לנתוני המסע...</h2>
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
