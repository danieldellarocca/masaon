"use client";

import { useState } from "react";
import { ItineraryDay, SiteVisit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Loader2, Sparkles, Plus, Trash2, Clock, AlertCircle } from "lucide-react";
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

    // Gemini Google AI model supports PDF and Images, but not Word documents directly via multimodal input
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "סוג קובץ לא נתמך",
        description: "אנא העלה קובץ PDF או תמונה (JPG, PNG). קבצי Word אינם נתמכים כרגע בניתוח האוטומטי."
      });
      // Clear input
      e.target.value = '';
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const result = await analyzeItineraryForGuide({
          documentDataUri: base64,
          documentFileName: file.name
        });
        
        if (result && result.itineraryDays) {
          const normalizedDays: ItineraryDay[] = result.itineraryDays.map(day => ({
            dayNumber: day.dayNumber,
            date: day.date || "",
            location: day.location || "",
            activities: day.activities || "",
            sites: day.sites || []
          }));
          
          setItinerary(normalizedDays);
          toast({ 
            title: "המסלול נותח!", 
            description: `זוהו ${result.itineraryDays.length} ימי טיול. המידע חולץ באופן חלקי, אנא השלם חוסרים ידנית.` 
          });
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err: any) {
        console.error("Analysis error:", err);
        toast({ 
          variant: "destructive", 
          title: "שגיאה בניתוח הקובץ", 
          description: err.message || "לא הצלחנו לנתח את הקובץ. ודא שהקובץ הוא PDF או תמונה ברורה." 
        });
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setLoading(false);
      toast({ variant: "destructive", title: "שגיאה בקריאת הקובץ" });
    };

    reader.readAsDataURL(file);
  };

  const addDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([...itinerary, { dayNumber: nextDay, date: "", location: "", activities: "", sites: [] }]);
  };

  const deleteDay = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index));
  };

  const addSite = (dayIdx: number) => {
    const newIt = [...itinerary];
    if (!newIt[dayIdx].sites) newIt[dayIdx].sites = [];
    newIt[dayIdx].sites!.push({ name: "", time: "" });
    setItinerary(newIt);
  };

  const removeSite = (dayIdx: number, siteIdx: number) => {
    const newIt = [...itinerary];
    newIt[dayIdx].sites = newIt[dayIdx].sites?.filter((_, i) => i !== siteIdx);
    setItinerary(newIt);
  };

  const updateSite = (dayIdx: number, siteIdx: number, field: keyof SiteVisit, value: string) => {
    const newIt = [...itinerary];
    if (newIt[dayIdx].sites) {
      newIt[dayIdx].sites![siteIdx][field] = value;
    }
    setItinerary(newIt);
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 bg-muted/20">
        <CardContent className="pt-6 text-center">
          <Label htmlFor="file-upload" className="cursor-pointer space-y-2 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              {loading ? <Loader2 className="animate-spin text-primary" /> : <FileUp className="text-primary" />}
            </div>
            <p className="font-bold text-lg">טען תוכנית טיול (PDF או תמונה)</p>
            <p className="text-sm text-muted-foreground">ה-AI יחלץ את מה שניתן (ימים, אתרים ושעות)</p>
            <div className="flex items-center gap-1 text-[10px] text-orange-600 mt-1">
              <AlertCircle className="w-3 h-3" />
              <span>קבצי Word יש להמיר ל-PDF תחילה</span>
            </div>
            <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={loading} accept=".pdf,image/*" />
            <Button variant="outline" className="mt-2 pointer-events-none" disabled={loading}>
              <Sparkles className="w-4 h-4 ml-2 text-accent" />
              {loading ? "מנתח מסלול..." : "ניתוח מסלול חכם"}
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
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Input value={day.location} placeholder="לדוגמה: ירושלים" onChange={(e) => {
                    const newIt = [...itinerary];
                    newIt[idx].location = e.target.value;
                    setItinerary(newIt);
                  }} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>פעילויות כלליות</Label>
                <textarea 
                  className="w-full text-sm border rounded-md p-2 h-20"
                  placeholder="פירוט כללי על היום..."
                  value={day.activities}
                  onChange={(e) => {
                    const newIt = [...itinerary];
                    newIt[idx].activities = e.target.value;
                    setItinerary(newIt);
                  }}
                />
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">אתרים ושעות ביקור (יפורט לחניך)</Label>
                  <Button variant="outline" size="sm" onClick={() => addSite(idx)} className="h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" /> הוסף אתר
                  </Button>
                </div>
                <div className="space-y-2">
                  {(day.sites || []).map((site, sIdx) => (
                    <div key={sIdx} className="flex gap-2 items-center">
                      <Input 
                        placeholder="שעות (08:00-10:00)" 
                        value={site.time} 
                        className="flex-1 text-xs"
                        onChange={(e) => updateSite(idx, sIdx, 'time', e.target.value)}
                      />
                      <Input 
                        placeholder="שם האתר" 
                        value={site.name} 
                        className="flex-[2] text-xs"
                        onChange={(e) => updateSite(idx, sIdx, 'name', e.target.value)}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSite(idx, sIdx)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
