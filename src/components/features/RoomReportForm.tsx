"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Camera, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoomReportFormProps {
  onClose: () => void;
  studentName: string;
}

export function RoomReportForm({ onClose, studentName }: RoomReportFormProps) {
  const [room, setRoom] = useState("");
  const [desc, setDesc] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !desc) return;

    toast({
      title: "הדיווח התקבל",
      description: "המלווה קיבל את הודעתך ויטפל בהקדם.",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">דיווח על תקלה</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
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
            <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">צרף צילום של התקלה (אופציונלי)</span>
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
