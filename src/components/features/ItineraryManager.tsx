"use client";

import { useState } from "react";
import { ItineraryDay } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Loader2, Sparkles, Plus, Trash2 } from "lucide-react";
import { analyzeItineraryForGuide } from "@/ai/flows/itinerary-analysis-for-guide";
import { useToast } from "@/hooks/use-toast";

interface ItineraryManagerProps {
  itinerary: ItineraryDay[];
  setItinerary: (it: ItineraryDay[]) => void;
}

export function ItineraryManager({ itinerary, setItinerary }: ItineraryManagerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const result = await analyzeItineraryForGuide({
            documentDataUri: base64,
            documentFileName: file.name
          });
          
          if (result.itineraryDays) {
            setItinerary(result.itineraryDays);
            toast({ title: "המסלול נותח בהצלחה!", description: `זוהו ${result.itineraryDays.length} ימי טיול.` });
          }
        } catch (err) {
          toast({ variant: "destructive", title: "שגיאה בניתוח הקובץ", description: "אנא נסה שוב או הזן ידנית." });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setLoading(false);
    }
  };

  const addDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([...itinerary, { dayNumber: nextDay, date: "", location: "", activities: "" }]);
  };

  const deleteDay = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 bg-muted/20">
        <CardContent className="pt-6 text-center">
          <Label htmlFor="file-upload" className="cursor-pointer space-y-2 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              {loading ? <Loader2 className="animate-spin text-primary" /> : <FileUp className="text-primary" />}
            </div>
            <p className="font-bold text-lg">טען תוכנית טיול (PDF/Word)</p>
            <p className="text-sm text-muted-foreground">הבינה המלאכותית שלנו תחלץ עבורך את הימים והפעילויות</p>
            <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={loading} />
            <Button variant="outline" className="mt-2" disabled={loading}>
              <Sparkles className="w-4 h-4 ml-2 text-accent" />
              ניתוח מסלול חכם
            </Button>
          </Label>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">פירוט ימי המסע</h3>
          <Button size="sm" onClick={addDay} className="gap-2">
            <Plus className="w-4 h-4" />
            הוסף יום
          </Button>
        </div>

        {itinerary.map((day, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 bg-muted/50">
              <span className="font-bold">יום {day.dayNumber}</span>
              <Button variant="ghost" size="icon" onClick={() => deleteDay(idx)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>תאריך</Label>
                <Input type="date" value={day.date} onChange={(e) => {
                  const newIt = [...itinerary];
                  newIt[idx].date = e.target.value;
                  setItinerary(newIt);
                }} />
              </div>
              <div className="space-y-1">
                <Label>מיקום</Label>
                <Input value={day.location} onChange={(e) => {
                  const newIt = [...itinerary];
                  newIt[idx].location = e.target.value;
                  setItinerary(newIt);
                }} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>פעילויות</Label>
                <textarea 
                  className="w-full text-sm border rounded-md p-2 h-20"
                  value={day.activities}
                  onChange={(e) => {
                    const newIt = [...itinerary];
                    newIt[idx].activities = e.target.value;
                    setItinerary(newIt);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
