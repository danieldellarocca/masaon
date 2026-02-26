"use client";

import { Trip } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Bus, Coffee, MousePointer2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BoardingCheckProps {
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip>>;
}

export function BoardingCheck({ trip, setTrip }: BoardingCheckProps) {
  const activeSession = trip.activeRestStop || trip.activeBoarding;
  const sessionType = trip.activeRestStop ? 'rest' : (trip.activeBoarding ? 'bus' : null);
  
  const confirmedIds = activeSession?.confirmedStudentIds || [];
  const students = trip.students || [];
  const progress = students.length > 0 ? (confirmedIds.length / students.length) * 100 : 0;

  const toggleStudentStatus = (studentId: string) => {
    if (!sessionType) return;

    setTrip(prev => {
      const currentSession = prev.activeRestStop || prev.activeBoarding;
      if (!currentSession) return prev;

      const isConfirmed = currentSession.confirmedStudentIds.includes(studentId);
      const newConfirmedIds = isConfirmed
        ? currentSession.confirmedStudentIds.filter(id => id !== studentId)
        : [...currentSession.confirmedStudentIds, studentId];

      if (prev.activeRestStop) {
        return {
          ...prev,
          activeRestStop: {
            ...prev.activeRestStop,
            confirmedStudentIds: newConfirmedIds
          }
        };
      } else if (prev.activeBoarding) {
        return {
          ...prev,
          activeBoarding: {
            ...prev.activeBoarding,
            confirmedStudentIds: newConfirmedIds
          }
        };
      }
      return prev;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              {sessionType === 'bus' ? <Bus className="w-5 h-5 text-primary" /> : <Coffee className="w-5 h-5 text-primary" />}
              {sessionType === 'bus' ? 'בדיקת עלייה לאוטובוס' : 'בדיקת חזרה מעצירה'}
              {!sessionType && 'בדיקת נוכחות'}
            </CardTitle>
            <Badge variant={progress === 100 && students.length > 0 ? "default" : "secondary"}>
              {confirmedIds.length}/{students.length} אושרו
            </Badge>
          </div>
          {sessionType && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              <MousePointer2 className="w-3 h-3" />
              ניתן ללחוץ על חניך כדי לסמן אותו ידנית
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionType ? (
            <div className="text-center py-8 text-muted-foreground">
              אין פעילות נוכחות פעילה ברגע זה. התחל פעילות בדף הראשי.
            </div>
          ) : (
            <>
              {students.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground italic text-sm">
                  טרם נרשמו חניכים למסע. חניכים שיצטרפו יופיעו כאן.
                </div>
              ) : (
                <>
                  <Progress value={progress} className="h-2" />
                  
                  <div className="space-y-2">
                    {students.map(student => {
                      const isConfirmed = confirmedIds.includes(student.id);
                      return (
                        <div 
                          key={student.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg bg-card cursor-pointer transition-all hover:border-primary/50 ${isConfirmed ? 'bg-primary/5' : ''}`}
                          onClick={() => toggleStudentStatus(student.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isConfirmed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className={isConfirmed ? "font-bold" : ""}>{student.name}</span>
                          </div>
                          {isConfirmed ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">מאושר</Badge>
                          ) : (
                            <Badge variant="outline">ממתין</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {progress === 100 && students.length > 0 && (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center font-bold animate-bounce border border-green-200">
                      {sessionType === 'bus' ? 'כל החניכים באוטובוס! אפשר לצאת לדרך. 🚌' : 'כל החניכים חזרו! אפשר להמשיך. ☕'}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
