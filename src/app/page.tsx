
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

  useEffect(() => {
    console.log("App mounted, checking local storage...");
    const savedUser = localStorage.getItem("masaon_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log("User restored from storage:", parsedUser.name);
      } catch (e) {
        localStorage.removeItem("masaon_user");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!user || !user.tripId) {
      setTrip(null);
      return;
    }

    console.log("Setting up Firestore listener for trip:", user.tripId);
    const unsub = onSnapshot(doc(db, "trips", user.tripId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Trip;
        setTrip(data);
        console.log("Trip data synced from Firestore");
      } else {
        console.error("Trip document not found in Firestore");
      }
    }, (error) => {
      console.error("Firestore listener error:", error);
    });

    return () => unsub();
  }, [user]);

  const handleLogin = async (userData: User, customJoinCode?: string) => {
    console.log("Starting login process for:", userData.name, "Role:", userData.role);
    try {
      if (userData.role === 'guide' && customJoinCode) {
        const tripId = customJoinCode;
        console.log("Creating new trip with ID:", tripId);
        
        const newTrip: Trip = {
          ...STATIC_INITIAL_TRIP,
          id: tripId,
          joinCode: customJoinCode,
          name: `המסע של ${userData.name}`,
          students: []
        } as Trip;
        
        await setDoc(doc(db, "trips", tripId), newTrip);
        console.log("Trip created successfully in Firestore");
        userData.tripId = tripId;
      }

      if (userData.role === 'student' && userData.tripId) {
        const tripId = userData.tripId.toUpperCase();
        console.log("Joining existing trip with ID:", tripId);
        
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        
        if (!tripSnap.exists()) {
          console.warn("Join code not found:", tripId);
          toast({
            variant: "destructive",
            title: "קוד טיול לא נמצא",
            description: "וודא שהזנת את הקוד הנכון שקיבלת מהמלווה."
          });
          return;
        }
        
        userData.tripId = tripId;
        console.log("Adding student to trip list...");
        await updateDoc(tripRef, {
          students: arrayUnion({ id: userData.id, name: userData.name })
        });
      }

      setUser(userData);
      localStorage.setItem("masaon_user", JSON.stringify(userData));
      console.log("Login sequence complete");
      
      toast({
        title: "התחברת בהצלחה!",
        description: `שלום ${userData.name}, ברוך הבא למסעון.`
      });
    } catch (error: any) {
      console.error("Detailed login error:", error);
      toast({
        variant: "destructive",
        title: "שגיאה בחיבור לשרת",
        description: error.message || "אירעה שגיאה בזמן החיבור למסע. בדוק את חיבור האינטרנט שלך."
      });
      throw error; // Re-throw to let AuthScreen know it failed
    }
  };

  const handleLogout = () => {
    console.log("Logging out...");
    setUser(null);
    setTrip(null);
    localStorage.removeItem("masaon_user");
  };

  const updateTripInFirestore = async (newTripData: Trip | ((prev: Trip) => Trip)) => {
    if (!user?.tripId || !trip) return;
    
    try {
      let updated: Trip;
      if (typeof newTripData === 'function') {
        updated = newTripData(trip);
      } else {
        updated = newTripData;
      }

      await setDoc(doc(db, "trips", user.tripId), updated, { merge: true });
    } catch (error: any) {
      console.error("Firestore write error:", error);
      toast({
        variant: "destructive",
        title: "שגיאה בשמירת נתונים",
        description: "לא הצלחנו לעדכן את השרת. וודא שיש לך הרשאות מתאימות."
      });
    }
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
        <p className="text-primary font-bold mb-4">מתחבר לנתוני המסע בשרת...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
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
