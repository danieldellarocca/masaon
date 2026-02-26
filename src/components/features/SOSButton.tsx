"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
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
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`SOS Location: ${latitude}, ${longitude}`);
          
          // Simulate sending to guide
          setTimeout(() => {
            setSending(false);
            toast({
              variant: "destructive",
              title: "התראת SOS נשלחה",
              description: `המיקום שלך (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) נשלח למלווה. הישאר במקומך!`,
            });
          }, 1500);
        },
        (error) => {
          setSending(false);
          toast({
            variant: "destructive",
            title: "שגיאת GPS",
            description: "לא הצלחנו להשיג את המיקום המדויק שלך, אך ההתראה הכללית נשלחה למלווה.",
          });
        }
      );
    } else {
      setSending(false);
      toast({
        variant: "destructive",
        title: "SOS נשלח",
        description: "ההתראה נשלחה, אך המכשיר שלך אינו תומך בשיתוף מיקום GPS.",
      });
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] pointer-events-auto">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            size="lg" 
            disabled={sending}
            className="rounded-full w-24 h-24 shadow-2xl bg-destructive hover:bg-destructive/90 animate-pulse border-4 border-white flex flex-col items-center justify-center p-0"
          >
            {sending ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <AlertTriangle className="w-10 h-10 mb-1" />
                <span className="text-xs font-black">מצוקה SOS</span>
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir="rtl" className="z-[150]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive text-right text-2xl">קריאת SOS דחופה</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-foreground text-lg">
              האם אתה בטוח? לחיצה תשלח את מיקומך המדויק לכל המלווים בטיול באופן מיידי.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 mt-6">
            <AlertDialogAction onClick={handleSOS} className="bg-destructive hover:bg-destructive/90 flex-1 h-14 text-lg">
              שלח עכשיו
            </AlertDialogAction>
            <AlertDialogCancel className="flex-1 h-14 text-lg">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
