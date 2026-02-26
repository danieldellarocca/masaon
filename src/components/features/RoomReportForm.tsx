"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Camera, Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trip, RoomReport } from "@/lib/types";

interface RoomReportFormProps {
  onClose: () => void;
  studentName: string;
  studentId: string;
  setTrip: React.Dispatch<React.SetStateAction<Trip>>;
}

export function RoomReportForm({ onClose, studentName, studentId, setTrip }: RoomReportFormProps) {
  const [room, setRoom] = useState("");
  const [desc, setDesc] = useState("");
  const [photoAdded, setPhotoAdded] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !desc) return;

    const newReport: RoomReport = {
      id: Math.random().toString(36).substr(2, 9),
      studentId,
      studentName,
      roomNumber: room,
      description: desc,
      status: 'open',
      timestamp: new Date().toISOString(),
      photoUrl: photoAdded ? `https://picsum.photos/seed/${Math.random()}/600/400` : undefined
    };

    setTrip(prev => ({
      ...prev,
      reports: [...(prev.reports || []), newReport]
    }));

    toast({
      title: "הדיווח התקבל",
      description: "המלווה קיבל את הודעתך ויטפל בהקדם.",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl text-right w-full">דיווח על תקלה</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-right">
              <Label htmlFor="room-num">מספר חדר</Label>
              <Input 
                id="room-num" 
                placeholder="לדוגמה: 204" 
                value={room} 
                onChange={(e) => setRoom(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-1 text-right">
              <Label htmlFor="issue-desc">תיאור התקלה</Label>
              <textarea 
                id="issue-desc"
                className="w-full text-sm border rounded-md p-2 h-24"
                placeholder="תאר את הבעיה (נזילה, חוסר במגבות, מזגן לא עובד...)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
              />
            </div>
            <div 
              onClick={() => setPhotoAdded(!photoAdded)}
              className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${photoAdded ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}`}
            >
              {photoAdded ? (
                <>
                  <Check className="w-8 h-8 text-primary" />
                  <span className="text-xs font-bold text-primary">תמונה צורפה בהצלחה!</span>
                </>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">צרף צילום של התקלה (אופציונלי)</span>
                </>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>ביטול</Button>
          <Button type="submit" form="report-form" className="flex-1 bg-primary">
            <Send className="w-4 h-4 ml-2" />
            שלח דיווח
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
