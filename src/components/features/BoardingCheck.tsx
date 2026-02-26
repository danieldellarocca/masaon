"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Users, Bus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MOCK_STUDENTS = [
  { id: "1", name: "ישראל ישראלי", confirmed: true },
  { id: "2", name: "נועה קירל", confirmed: false },
  { id: "3", name: "עדן גולן", confirmed: true },
  { id: "4", name: "עומר אדם", confirmed: false },
  { id: "5", name: "נס וסטילה", confirmed: true },
];

export function BoardingCheck() {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  
  const confirmedCount = students.filter(s => s.confirmed).length;
  const progress = (confirmedCount / students.length) * 100;

  const toggleConfirm = (id: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, confirmed: !s.confirmed } : s));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bus className="w-5 h-5 text-primary" />
              עליה לאוטובוס
            </CardTitle>
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {confirmedCount}/{students.length} אושרו
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          
          <div className="space-y-2">
            {students.map(student => (
              <div 
                key={student.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 cursor-pointer"
                onClick={() => toggleConfirm(student.id)}
              >
                <div className="flex items-center gap-3">
                  {student.confirmed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={student.confirmed ? "font-medium" : ""}>{student.name}</span>
                </div>
                {student.confirmed ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">מאושר</Badge>
                ) : (
                  <Badge variant="outline">ממתין</Badge>
                )}
              </div>
            ))}
          </div>

          {progress === 100 && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center font-bold animate-bounce">
              כל החניכים באוטובוס! אפשר לצאת לדרך. 🚌
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
