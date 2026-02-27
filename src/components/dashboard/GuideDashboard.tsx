
"use client";

import { useState } from "react";
import { User, Trip, Notice, TripStudent } from "@/lib/types";
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
  Image as ImageIcon,
  CheckCircle,
  Users,
  Share2,
  Copy
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
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState("");

  const shareJoinLink = () => {
    // הקישור משתמש בדומיין הנוכחי. בסביבת ייצור זה יהיה הדומיין הקצר שלך.
    const link = `${window.location.origin}?join=${trip.joinCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "הקישור הועתק!",
      description: "שלח אותו לחניכים בוואטסאפ כדי שיצטרפו למסע.",
    });
  };

  const copyOnlyCode = () => {
    navigator.clipboard.writeText(trip.joinCode);
    toast({
      title: "הקוד הועתק!",
      description: `קוד המסע: ${trip.joinCode}`,
    });
  };

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

  const markAsReportedToHotel = (reportId: string) => {
    setTrip(prev => ({
      ...prev,
      reports: (prev.reports || []).map(r => r.id === reportId ? { ...r, status: 'reported' } : r)
    }));
    toast({ title: "התקלה דווחה למלון", description: "החניך קיבל עדכון על כך." });
  };

  const deleteReport = (reportId: string) => {
    setTrip(prev => ({
      ...prev,
      reports: (prev.reports || []).filter(r => r.id !== reportId)
    }));
    toast({ title: "הדיווח נמחק" });
  };

  const removeStudent = (studentId: string) => {
    setTrip(prev => ({
      ...prev,
      students: (prev.students || []).filter(s => s.id !== studentId)
    }));
    toast({ title: "החניך הוסר מהמסע" });
  };

  const startEditStudent = (student: TripStudent) => {
    setEditingStudentId(student.id);
    setEditingStudentName(student.name);
  };

  const saveStudentName = () => {
    if (!editingStudentId) return;
    setTrip(prev => ({
      ...prev,
      students: (prev.students || []).map(s => s.id === editingStudentId ? { ...s, name: editingStudentName } : s)
    }));
    setEditingStudentId(null);
    toast({ title: "שם החניך עודכן" });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24" dir="rtl">
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
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              קוד: {trip.joinCode}
            </div>
            <Button variant="outline" size="sm" onClick={shareJoinLink} className="h-8 gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
              <Share2 className="w-3 h-3" />
              שיתוף קישור
            </Button>
            <Button variant="ghost" size="sm" onClick={copyOnlyCode} className="h-8 gap-2 text-xs">
              <Copy className="w-3 h-3" />
              העתק קוד בלבד
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-6 mb-6">
          <TabsTrigger value="overview">כללי</TabsTrigger>
          <TabsTrigger value="itinerary">מסלול</TabsTrigger>
          <TabsTrigger value="students">חניכים</TabsTrigger>
          <TabsTrigger value="logistics">נוכחות</TabsTrigger>
          <TabsTrigger value="reports" className="relative">
            תקלות
            {trip.reports?.filter(r => r.status === 'open').length ? (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {trip.reports.filter(r => r.status === 'open').length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="emergency">חירום</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2 border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  ניהול אירועים בזמן אמת
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <Coffee className="w-4 h-4 text-orange-500" />
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
                    <Bus className="w-4 h-4 text-blue-500" />
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
                  <span className="text-sm">זמן השכמה:</span>
                  <input 
                    type="time" 
                    value={trip.wakeUpTime || ""} 
                    onChange={(e) => updateTimes('wake', e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">כיבוי אורות:</span>
                  <input 
                    type="time" 
                    value={trip.lightsOutTime || ""} 
                    onChange={(e) => updateTimes('light', e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
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

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                חניכים רשומים ({trip.students?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!trip.students || trip.students.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>טרם נרשמו חניכים למסע.</p>
                  <Button variant="link" onClick={shareJoinLink} className="mt-2">שתף קישור הזמנה</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {trip.students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors">
                      {editingStudentId === student.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input 
                            value={editingStudentName} 
                            onChange={(e) => setEditingStudentName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" onClick={saveStudentName}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      )}
                      <div className="flex gap-1">
                        {editingStudentId !== student.id && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditStudent(student)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeStudent(student.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
            <CardContent className="space-y-6">
              {(!trip.reports || trip.reports.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">אין תקלות מדווחות כרגע.</div>
              ) : (
                <div className="grid gap-6">
                  {trip.reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(report => (
                    <div key={report.id} className="space-y-0 border rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center bg-muted/30 px-4 py-2 border-b">
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(report.timestamp).toLocaleString('he-IL', { 
                            dateStyle: 'short', 
                            timeStyle: 'short' 
                          })}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteReport(report.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className={`${report.status === 'fixed' ? 'opacity-50 grayscale bg-muted/20' : ''} p-4 space-y-3`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-lg">חדר {report.roomNumber}</span>
                              {report.status === 'open' && (
                                <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">חדש</span>
                              )}
                              {report.status === 'reported' && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">דווח למלון</span>
                              )}
                              {report.status === 'fixed' && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">טופל</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">מדווח: {report.studentName}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm bg-muted/40 p-3 rounded-md border">{report.description}</p>
                        
                        {report.photoUrl && (
                          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                            <Image 
                              src={report.photoUrl} 
                              alt="Room fault" 
                              fill 
                              className="object-cover"
                              data-ai-hint="hotel room"
                            />
                          </div>
                        )}
                        
                        {report.status === 'open' && (
                          <Button 
                            className="w-full h-9 bg-blue-600 hover:bg-blue-700" 
                            onClick={() => markAsReportedToHotel(report.id)}
                          >
                            <Bell className="w-3 h-3 ml-2" />
                            סמן כ"דווח למלון"
                          </Button>
                        )}
                        
                        {report.status === 'reported' && (
                          <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 py-2 rounded-md border border-blue-100">
                            <CheckCircle className="w-4 h-4" />
                            הדיווח הועבר. ממתין לאישור סופי מהחניך.
                          </div>
                        )}
                      </div>
                    </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input 
                  placeholder="שם (לדוגמה: מוקד ביטחון)" 
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input 
                  placeholder="מספר טלפון" 
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Button className="sm:col-span-2 w-full" onClick={addContact} disabled={!newContact.name || !newContact.phone}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף איש קשר
                </Button>
              </div>

              <div className="space-y-2 mt-6">
                {(trip.emergencyContacts || []).map((contact, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold">{contact.name}</span>
                      <span className="text-sm text-primary font-mono">{contact.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.location.href = `tel:${contact.phone}`}>
                        <Phone className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeContact(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
