"use client";

import { useState } from "react";
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
  Clock
} from "lucide-react";

interface StudentDashboardProps {
  user: User;
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip>>;
  onLogout: () => void;
}

export function StudentDashboard({ user, trip, setTrip, onLogout }: StudentDashboardProps) {
  const [showRoomReport, setShowRoomReport] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);

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

  const currentDay = trip.itinerary && trip.itinerary.length > 0 ? trip.itinerary[0] : null;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-32 relative min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">שלום, {user.name}</h1>
          <p className="text-sm text-muted-foreground">{trip.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Active Session Alerts */}
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

      {/* Hero: Current Status */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">מיקום נוכחי</p>
              <h2 className="text-xl font-bold">{currentDay?.location || "בדרך..."}</h2>
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

      {/* Quick Calls */}
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
              <span className="font-bold truncate w-full">{contact.name}</span>
              <span className="text-muted-foreground">{contact.phone}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* AI Features */}
      <ClothingAdvisor location={currentDay?.location || "ירושלים"} />

      {/* Main Grid Actions */}
      <div className="grid grid-cols-1 gap-4">
        <Dialog open={showItinerary} onOpenChange={setShowItinerary}>
          <DialogTrigger asChild>
            <Card className="hover:border-primary cursor-pointer transition-colors">
              <CardContent className="pt-6 flex flex-col items-center gap-2">
                <Calendar className="text-primary" />
                <span className="text-sm font-semibold">לוח זמנים מפורט</span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>לוח זמני המסע</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {trip.itinerary.map((day, idx) => (
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
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Issues */}
      <div className="space-y-4">
        <Button 
          variant="outline" 
          className="w-full flex justify-between h-12"
          onClick={() => setShowRoomReport(true)}
        >
          <span>דיווח על תקלה בחדר</span>
          <CheckCircle2 className="w-4 h-4 opacity-50" />
        </Button>
      </div>

      <SOSButton />

      {showRoomReport && (
        <RoomReportForm onClose={() => setShowRoomReport(false)} studentName={user.name} />
      )}
    </div>
  );
}
