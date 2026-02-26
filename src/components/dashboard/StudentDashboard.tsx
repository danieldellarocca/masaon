
"use client";

import { useState, useEffect, useMemo } from "react";
import { User, Trip } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SOSButton } from "@/components/features/SOSButton";
import { RoomReportForm } from "@/components/features/RoomReportForm";
import { ClothingAdvisor } from "@/components/features/ClothingAdvisor";
import { CountdownTimer } from "@/components/features/CountdownTimer";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  LogOut,
  Bus,
  CheckCircle2,
  PhoneCall,
  Coffee,
  Calendar,
  Clock,
  Loader2,
  Navigation,
  AlertCircle,
  Info,
  Check
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface StudentDashboardProps {
  user: User;
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip>>;
  onLogout: () => void;
}

export function StudentDashboard({ user, trip, setTrip, onLogout }: StudentDashboardProps) {
  const { toast } = useToast();
  const [showRoomReport, setShowRoomReport] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [locationName, setLocationName] = useState<string>("מאתר מיקום...");
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [distanceToNext, setDistanceToNext] = useState<string | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (!coords || !trip.itinerary || trip.itinerary.length === 0) return;

    const currentDay = trip.itinerary[0];
    const nextSite = currentDay?.sites?.find(s => s.name);

    if (nextSite) {
      const siteLat = nextSite.lat || 31.7683;
      const siteLng = nextSite.lng || 35.2137;
      
      const dist = calculateDistance(coords.lat, coords.lng, siteLat, siteLng);
      if (dist < 1) {
        setDistanceToNext(`${(dist * 1000).toFixed(0)} מטר`);
      } else {
        setDistanceToNext(`${dist.toFixed(1)} ק"מ`);
      }
    }
  }, [coords, trip.itinerary]);

  useEffect(() => {
    if (!coords) return;

    const fetchPlaceName = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'he' } }
        );
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        const name = data.display_name.split(',')[0] || data.address?.city || data.address?.town || "מיקום לא ידוע";
        setLocationName(name);
      } catch (e) {
        console.error("Reverse geocoding failed", e);
        setLocationName("בקרבת המיקום שלך");
      }
    };

    fetchPlaceName();
  }, [coords]);

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      const watcher = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("GPS Error", error);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watcher);
    }
  }, []);

  const confirmPresence = (type: 'rest' | 'bus') => {
    setTrip(prev => {
      if (type === 'rest' && prev.activeRestStop) {
        if (prev.activeRestStop.confirmedStudentIds.includes(user.id)) return prev;
        return {
          ...prev,
          activeRestStop: {
            ...prev.activeRestStop,
            confirmedStudentIds: [...prev.activeRestStop.confirmedStudentIds, user.id]
          }
        };
      }
      if (type === 'bus' && prev.activeBoarding) {
        if (prev.activeBoarding.confirmedStudentIds.includes(user.id)) return prev;
        return {
          ...prev,
          activeBoarding: {
            ...prev.activeBoarding,
            confirmedStudentIds: [...prev.activeBoarding.confirmedStudentIds, user.id]
          }
        };
      }
      return prev;
    });
  };

  const markAsFixed = (reportId: string) => {
    setTrip(prev => ({
      ...prev,
      reports: (prev.reports || []).map(r => r.id === reportId ? { ...r, status: 'fixed' } : r)
    }));
    toast({ title: "התקלה סומנה כטופלה", description: "תודה על העדכון!" });
  };

  const currentItineraryLocation = useMemo(() => {
    return trip.itinerary?.[0]?.location || "ירושלים";
  }, [trip.itinerary]);

  const nextSiteName = useMemo(() => {
    return trip.itinerary?.[0]?.sites?.[0]?.name || "האתר הבא";
  }, [trip.itinerary]);

  const myReports = useMemo(() => {
    return (trip.reports || []).filter(r => r.studentId === user.id);
  }, [trip.reports, user.id]);

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-40 relative min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">שלום, {user.name}</h1>
          <p className="text-sm text-muted-foreground">{trip.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="space-y-2">
        {myReports.filter(r => r.status === 'reported').map(report => (
          <Alert key={report.id} className="bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="font-bold">עדכון תקלה - חדר {report.roomNumber}</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <p>המלון עודכן בתקלה שדיווחת והיא בטיפול.</p>
              <Button 
                size="sm" 
                className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                onClick={() => markAsFixed(report.id)}
              >
                <Check className="w-3 h-3 ml-1" />
                סמן כטופל
              </Button>
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {trip.activeRestStop && (
        <Card className="border-green-500 bg-green-50 animate-in slide-in-from-top duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center justify-between text-green-700">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                עצירת רענון
              </div>
              <CountdownTimer targetTime={trip.activeRestStop.endTime} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trip.activeRestStop.confirmedStudentIds.includes(user.id) ? (
              <div className="flex items-center justify-center gap-2 text-green-600 font-bold py-2">
                <CheckCircle2 className="w-5 h-5" />
                אישרת ביקור בשירותים!
              </div>
            ) : (
              <Button onClick={() => confirmPresence('rest')} className="w-full bg-green-600 hover:bg-green-700">
                הייתי בשירותים
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {trip.activeBoarding && (
        <Card className="border-blue-500 bg-blue-50 animate-in slide-in-from-top duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center gap-2 text-blue-700">
              <Bus className="w-5 h-5" />
              עלייה לאוטובוס
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trip.activeBoarding.confirmedStudentIds.includes(user.id) ? (
              <div className="flex items-center justify-center gap-2 text-blue-600 font-bold py-2">
                <CheckCircle2 className="w-5 h-5" />
                אתה על האוטובוס!
              </div>
            ) : (
              <Button onClick={() => confirmPresence('bus')} className="w-full bg-blue-600 hover:bg-blue-700">
                עליתי לאוטובוס
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              {coords ? <MapPin className="w-6 h-6 animate-bounce" /> : <Loader2 className="w-6 h-6 animate-spin" />}
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-80">מיקום נוכחי מאומת</p>
              <h2 className="text-xl font-bold truncate max-w-[200px]">{locationName}</h2>
              {distanceToNext && (
                <div className="flex items-center gap-1 mt-1 text-xs opacity-90">
                  <Navigation className="w-3 h-3 rotate-45" />
                  <span>מרחק ל{nextSiteName}: {distanceToNext}</span>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-center">
            <div className="bg-white/10 rounded-lg p-2">
              <p className="text-[10px] opacity-70">השכמה</p>
              <p className="font-bold">{trip.wakeUpTime || "--:--"}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <p className="text-[10px] opacity-70">כיבוי אורות</p>
              <p className="font-bold">{trip.lightsOutTime || "--:--"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-primary" />
            חיוג מהיר
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {(trip.emergencyContacts || []).map((contact, idx) => (
            <Button 
              key={idx} 
              variant="outline" 
              className="text-xs h-auto py-2 flex flex-col gap-1 border-primary/20 hover:bg-primary/5"
              onClick={() => window.location.href = `tel:${contact.phone}`}
            >
              <span className="font-bold truncate w-full text-right">{contact.name}</span>
              <span className="text-muted-foreground">{contact.phone}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <ClothingAdvisor location={currentItineraryLocation} />

      <div className="grid grid-cols-1 gap-4">
        <Dialog open={showItinerary} onOpenChange={setShowItinerary}>
          <DialogTrigger asChild>
            <Card 
              className="hover:border-primary cursor-pointer transition-colors shadow-sm"
              onClick={() => setShowItinerary(true)}
            >
              <CardContent className="pt-6 flex flex-col items-center gap-2">
                <Calendar className="text-primary w-8 h-8" />
                <span className="text-base font-bold text-primary">לוח זמנים מפורט</span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>לוח זמני המסע</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {trip.itinerary && trip.itinerary.length > 0 ? (
                trip.itinerary.map((day, idx) => (
                  <div key={idx} className="border-r-4 border-primary pr-4 py-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">יום {day.dayNumber} - {day.location}</h3>
                      <span className="text-xs bg-muted px-2 py-1 rounded">{day.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">{day.activities}</p>
                    {day.sites && day.sites.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {day.sites.map((site, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 bg-muted/30 p-2 rounded text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-semibold">{site.time}:</span>
                            <span>{site.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">אין מסלול מוגדר כרגע.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <Button 
          variant="outline" 
          className="w-full flex justify-between h-14 font-bold border-2"
          onClick={() => setShowRoomReport(true)}
        >
          <span>דיווח על תקלה בחדר</span>
          <AlertCircle className="w-5 h-5 text-primary" />
        </Button>
      </div>

      <SOSButton />

      {showRoomReport && (
        <RoomReportForm 
          onClose={() => setShowRoomReport(false)} 
          studentName={user.name} 
          studentId={user.id}
          setTrip={setTrip}
        />
      )}
    </div>
  );
}
