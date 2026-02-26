"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SOSButton() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleSOS = () => {
    setSending(true);
    // Simulate getting GPS and sending alert
    setTimeout(() => {
      setSending(false);
      toast({
        variant: "destructive",
        title: "התראת SOS נשלחה",
        description: "המיקום שלך נשלח למלווה ברגע זה. הישאר במקומך.",
      });
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            size="lg" 
            className="rounded-full w-20 h-20 shadow-2xl bg-destructive hover:bg-destructive/90 animate-pulse border-4 border-white flex flex-col"
          >
            <AlertTriangle className="w-8 h-8 mb-1" />
            <span className="text-[10px] font-bold">SOS</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive text-right">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              לחיצה על כפתור זה תשלח את מיקומך המדויק לכל המלווים בטיול באופן מיידי. השתמש בכך רק במקרי חירום אמיתיים.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={handleSOS} className="bg-destructive hover:bg-destructive/90 flex-1">
              שלח עכשיו
            </AlertDialogAction>
            <AlertDialogCancel className="flex-1">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
