
"use client";

import { useState } from "react";
import { User, Trip, Notice, EmergencyContact } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  LogOut,
  Bell,
  Coffee,
  Bus,
  Phone,
  Plus,
  Trash2
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
  const [stopMinutes, setStopMinutes] = useState("15");
  const [newContact, setNewContact] = useState({ name: "", phone: "" });

  const addNotice = (content: string) => {
    const newNotice: Notice = {
      id: Math.random().toString(),
      content,
      timestamp: new Date().toISOString()
    };
    setTrip(prev => ({ ...prev, notices: [newNotice, ...(prev.notices || [])] }));
    toast({ title: "הודעה פורסמה", description: "כל החניכים קיבלו עדכון." });
  };

  const startRestStop = () => {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + parseInt(stopMinutes));
    setTrip(prev => ({
      ...prev,
      activeRestStop: {
        endTime: endTime.toISOString(),
        confirmedStudentIds: []
      }
    }));
    addNotice(`עצירת רענון ל-${stopMinutes} דקות. נא לסמן שהייתם בשירותים באפליקציה!`);
  };

  const endRestStop = () => {
    setTrip(prev => {
      const { activeRestStop, ...rest } = prev;
      return rest as Trip;
    });
    toast({ title: "העצירה הסתיימה" });
  };

  const startBoarding = () => {
    setTrip(prev => ({
      ...prev,
      activeBoarding: {
        confirmedStudentIds: []
      }
    }));
    addNotice("עלייה לאוטובוס החלה! כולם לעלות ולסמן נוכחות.");
  };

  const endBoarding = () => {
    setTrip(prev => {
      const { activeBoarding, ...rest } = prev;
      return rest as Trip;
    });
    toast({ title: "העלייה לאוטובוס הסתיימה" });
  };

  const updateTimes = (type: 'wake' | 'light', time: string) => {
    setTrip(prev => ({
      ...prev,
      [type === 'wake' ? 'wakeUpTime' : 'lightsOutTime']: time
    }));
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setTrip(prev => ({
      ...prev,
      emergencyContacts: [...(prev.emergencyContacts || []), { ...newContact }]
    }));
    setNewContact({ name: "", phone: "" });
  };

  const removeContact = (index: number) => {
    setTrip(prev => ({
      ...prev,
      emergencyContacts: (prev.emergencyContacts || []).filter((_, i) => i !== index)
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
          <TabsTrigger value="emergency">חירום</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2 border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  ניהול אירועים בזמן אמת
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <Coffee className="w-4 h-4" />
                    עצירת שירותים / רענון
                  </div>
                  {trip.activeRestStop ? (
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 font-medium">עצירה פעילה!</div>
                      <Button variant="destructive" size="sm" className="w-full" onClick={endRestStop}>
                        סיים עצירה
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        value={stopMinutes} 
                        onChange={(e) => setStopMinutes(e.target.value)} 
                        className="w-20"
                      />
                      <Button size="sm" className="flex-1" onClick={startRestStop}>התחל עצירה</Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <Bus className="w-4 h-4" />
                    עלייה לאוטובוס
                  </div>
                  {trip.activeBoarding ? (
                    <div className="space-y-2">
                      <div className="text-sm text-blue-600 font-medium">עלייה פעילה!</div>
                      <Button variant="destructive" size="sm" className="w-full" onClick={endBoarding}>
                        סיים עלייה
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" onClick={startBoarding}>התחל עלייה לאוטובוס</Button>
                  )}
                </div>
              </CardContent>
            </Card>

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
                    value={trip.wakeUpTime || ""} 
                    onChange={(e) => updateTimes('wake', e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>כיבוי אורות:</span>
                  <input 
                    type="time" 
                    value={trip.lightsOutTime || ""} 
                    onChange={(e) => updateTimes('light', e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  פרסום הודעה מהירה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NoticeBoard onAdd={addNotice} isGuide />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="itinerary">
          <ItineraryManager itinerary={trip.itinerary || []} setItinerary={(newIt) => setTrip(prev => ({...prev, itinerary: newIt}))} />
        </TabsContent>

        <TabsContent value="logistics">
          <BoardingCheck trip={trip} setTrip={setTrip} />
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                אנשי קשר לחירום
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="שם (לדוגמה: מדריך ראשי)" 
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input 
                  placeholder="טלפון" 
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Button className="col-span-2" onClick={addContact}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף איש קשר
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                {(trip.emergencyContacts || []).map((contact, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-bold">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeContact(idx)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
