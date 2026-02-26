"use client";

import { useState } from "react";
import { Trip } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Bus, Coffee } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// In a real app, this would be fetched from a students collection
const MOCK_STUDENTS = [
  { id: "1", name: "ישראל ישראלי" },
  { id: "2", name: "נועה קירל" },
  { id: "3", name: "עדן גולן" },
  { id: "4", name: "עומר אדם" },
  { id: "5", name: "נס וסטילה" },
];

interface BoardingCheckProps {
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip>>;
}

export function BoardingCheck({ trip, setTrip }: BoardingCheckProps) {
  const activeSession = trip.activeRestStop || trip.activeBoarding;
  const sessionType = trip.activeRestStop ? 'rest' : (trip.activeBoarding ? 'bus' : null);
  
  const confirmedIds = activeSession?.confirmedStudentIds || [];
  const progress = MOCK_STUDENTS.length > 0 ? (confirmedIds.length / MOCK_STUDENTS.length) * 100 : 0;

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
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {confirmedIds.length}/{MOCK_STUDENTS.length} אושרו
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionType ? (
            <div className="text-center py-8 text-muted-foreground">
              אין פעילות נוכחות פעילה ברגע זה. התחל פעילות בדף הראשי.
            </div>
          ) : (
            <>
              <Progress value={progress} className="h-2" />
              
              <div className="space-y-2">
                {MOCK_STUDENTS.map(student => {
                  const isConfirmed = confirmedIds.includes(student.id);
                  return (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {isConfirmed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className={isConfirmed ? "font-medium" : ""}>{student.name}</span>
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

              {progress === 100 && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center font-bold animate-bounce border border-green-200">
                  {sessionType === 'bus' ? 'כל החניכים באוטובוס! אפשר לצאת לדרך. 🚌' : 'כל החניכים חזרו! אפשר להמשיך. ☕'}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
