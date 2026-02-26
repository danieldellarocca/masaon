"use client";

import { useState } from "react";
import { User, Trip, Notice } from "@/lib/types";
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
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Calendar,
  Image as ImageIcon
} from "lucide-react";
import { NoticeBoard } from "@/components/features/NoticeBoard";
import { BoardingCheck } from "@/components/features/BoardingCheck";
import { ItineraryManager } from "@/components/features/ItineraryManager";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempTripName, setTempTripName] = useState(trip.name);

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

  const saveTripName = () => {
    setTrip(prev => ({ ...prev, name: tempTripName }));
    setIsEditingName(false);
    toast({ title: "שם המסע עודכן" });
  };

  const resolveReport = (reportId: string) => {
    setTrip(prev => ({
      ...prev,
      reports: (prev.reports || []).map(r => r.id === reportId ? { ...r, status: 'resolved' } : r)
    }));
    toast({ title: "התקלה סומנה כטופלה" });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border">
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input 
                value={tempTripName} 
                onChange={(e) => setTempTripName(e.target.value)}
                className="max-w-[200px]"
              />
              <Button size="icon" variant="ghost" onClick={saveTripName}>
                <Check className="w-4 h-4 text-green-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary">{trip.name}</h1>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditingName(true)}>
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          )}
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
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="overview">כללי</TabsTrigger>
          <TabsTrigger value="itinerary">מסלול</TabsTrigger>
          <TabsTrigger value="logistics">לוגיסטיקה</TabsTrigger>
          <TabsTrigger value="reports" className="relative">
            תקלות
            {trip.reports?.filter(r => r.status === 'open').length ? (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {trip.reports.filter(r => r.status === 'open').length}
              </span>
            ) : null}
          </TabsTrigger>
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

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                דיווחים על תקלות בחדרים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!trip.reports || trip.reports.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">אין תקלות מדווחות כרגע.</div>
              ) : (
                <div className="grid gap-4">
                  {trip.reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(report => (
                    <Card key={report.id} className={report.status === 'resolved' ? 'opacity-60 grayscale' : 'border-destructive/30'}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">חדר {report.roomNumber}</span>
                              {report.status === 'open' ? (
                                <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">פתוח</span>
                              ) : (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">טופל</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{report.studentName}</p>
                          </div>
                          <div className="text-left text-[10px] text-muted-foreground">
                            {new Date(report.timestamp).toLocaleString('he-IL')}
                          </div>
                        </div>
                        
                        <p className="text-sm bg-muted/30 p-2 rounded">{report.description}</p>
                        
                        {report.photoUrl && (
                          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted group">
                            <Image 
                              src={report.photoUrl} 
                              alt="Room fault" 
                              fill 
                              className="object-cover"
                              data-ai-hint="Room fault"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ImageIcon className="text-white w-8 h-8" />
                            </div>
                          </div>
                        )}
                        
                        {report.status === 'open' && (
                          <Button 
                            className="w-full h-8 text-xs bg-green-600 hover:bg-green-700" 
                            onClick={() => resolveReport(report.id)}
                          >
                            <Check className="w-3 h-3 ml-1" />
                            סמן כטופל
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
