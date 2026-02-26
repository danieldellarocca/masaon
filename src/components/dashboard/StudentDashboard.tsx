"use client";

import { useState } from "react";
import { User, Trip } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SOSButton } from "@/components/features/SOSButton";
import { RoomReportForm } from "@/components/features/RoomReportForm";
import { ClothingAdvisor } from "@/components/features/ClothingAdvisor";
import { 
  MapPin, 
  Clock, 
  Megaphone, 
  Calendar, 
  BookOpen, 
  LogOut,
  CloudSun
} from "lucide-react";

interface StudentDashboardProps {
  user: User;
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip>>;
  onLogout: () => void;
}

export function StudentDashboard({ user, trip, onLogout }: StudentDashboardProps) {
  const [showRoomReport, setShowRoomReport] = useState(false);

  const currentDay = trip.itinerary[0]; // Simplified for demo

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">שלום, {user.name}</h1>
          <p className="text-sm text-muted-foreground">{trip.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

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

      {/* Announcements */}
      {trip.notices.length > 0 && (
        <Card className="border-accent/40 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-accent-foreground">
              <Megaphone className="w-4 h-4" />
              הודעה אחרונה מהמלווה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{trip.notices[0].content}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Grid Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="hover:border-primary cursor-pointer transition-colors" onClick={() => {}}>
          <CardContent className="pt-6 flex flex-col items-center gap-2">
            <Calendar className="text-primary" />
            <span className="text-sm font-semibold">לוח זמנים</span>
          </CardContent>
        </Card>
        <Card className="hover:border-primary cursor-pointer transition-colors">
          <CardContent className="pt-6 flex flex-col items-center gap-2">
            <BookOpen className="text-primary" />
            <span className="text-sm font-semibold">כיס-ספר</span>
          </CardContent>
        </Card>
      </div>

      {/* AI Features */}
      <ClothingAdvisor guideGuidelines={trip.clothingGuide || ""} location={currentDay?.location || "ירושלים"} />

      {/* Report Issues */}
      <div className="space-y-4">
        <Button 
          variant="outline" 
          className="w-full flex justify-between h-12"
          onClick={() => setShowRoomReport(true)}
        >
          <span>דיווח על תקלה בחדר</span>
          <BookOpen className="w-4 h-4 opacity-50" />
        </Button>
      </div>

      {/* Footer / Permanent UI */}
      <SOSButton />

      {showRoomReport && (
        <RoomReportForm onClose={() => setShowRoomReport(false)} studentName={user.name} />
      )}
    </div>
  );
}
