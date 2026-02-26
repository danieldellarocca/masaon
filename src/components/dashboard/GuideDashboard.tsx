"use client";

import { useState } from "react";
import { User, Trip, Notice, BoardingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ClipboardList, 
  Megaphone, 
  Truck, 
  Clock, 
  Shirt, 
  FileText,
  LogOut,
  Bell
} from "lucide-react";
import { NoticeBoard } from "@/components/features/NoticeBoard";
import { BoardingCheck } from "@/components/features/BoardingCheck";
import { ItineraryManager } from "@/components/features/ItineraryManager";
import { useToast } from "@/hooks/use-toast";

interface GuideDashboardProps {
  user: User;
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip>>;
  onLogout: () => void;
}

export function GuideDashboard({ user, trip, setTrip, onLogout }: GuideDashboardProps) {
  const { toast } = useToast();

  const addNotice = (content: string) => {
    const newNotice: Notice = {
      id: Math.random().toString(),
      content,
      timestamp: new Date().toISOString()
    };
    setTrip(prev => ({ ...prev, notices: [newNotice, ...prev.notices] }));
    toast({ title: "הודעה פורסמה", description: "כל החניכים קיבלו עדכון." });
  };

  const updateTimes = (type: 'wake' | 'light', time: string) => {
    setTrip(prev => ({
      ...prev,
      [type === 'wake' ? 'wakeUpTime' : 'lightsOutTime']: time
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-xl font-bold text-primary">{trip.name}</h1>
          <p className="text-sm text-muted-foreground">שלום, {user.name} (מלווה)</p>
          <div className="mt-1 bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full text-xs font-semibold inline-block">
            קוד הצטרפות: {trip.joinCode}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">כללי</TabsTrigger>
          <TabsTrigger value="itinerary">מסלול</TabsTrigger>
          <TabsTrigger value="logistics">לוגיסטיקה</TabsTrigger>
          <TabsTrigger value="notices">הודעות</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  זמנים להיום
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>השכמה:</span>
                  <input 
                    type="time" 
                    value={trip.wakeUpTime} 
                    onChange={(e) => updateTimes('wake', e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>כיבוי אורות:</span>
                  <input 
                    type="time" 
                    value={trip.lightsOutTime} 
                    onChange={(e) => updateTimes('light', e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-primary" />
                  המלצת לבוש
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea 
                  className="w-full text-sm border rounded-md p-2 min-h-[80px]"
                  placeholder="הזן המלצות לבוש למחר..."
                  value={trip.clothingGuide}
                  onChange={(e) => setTrip(prev => ({ ...prev, clothingGuide: e.target.value }))}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                פרסום הודעה מהירה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NoticeBoard onAdd={addNotice} isGuide />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itinerary">
          <ItineraryManager itinerary={trip.itinerary} setItinerary={(newIt) => setTrip(prev => ({...prev, itinerary: newIt}))} />
        </TabsContent>

        <TabsContent value="logistics">
          <BoardingCheck />
        </TabsContent>

        <TabsContent value="notices">
           <div className="space-y-4">
             {trip.notices.map(notice => (
               <Card key={notice.id} className="relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                 <CardContent className="pt-4">
                   <p className="text-sm mb-1">{notice.content}</p>
                   <p className="text-[10px] text-muted-foreground">{new Date(notice.timestamp).toLocaleTimeString()}</p>
                 </CardContent>
               </Card>
             ))}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
