"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, Shirt } from "lucide-react";
import { clothingRecommendationForStudent } from "@/ai/flows/clothing-recommendation-for-student-flow";

interface ClothingAdvisorProps {
  location: string;
}

export function ClothingAdvisor({ location }: ClothingAdvisorProps) {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  // Effect to clear recommendation when location changes so we can get a new one
  useEffect(() => {
    setRecommendation(null);
  }, [location]);

  const getAdvice = async () => {
    setLoading(true);
    try {
      // In a real app, we might fetch actual weather for this location
      const mockWeather = `מזג האוויר באזור ${location} כרגע: נעים, שמיים בהירים, כ-20 מעלות.`;
      const result = await clothingRecommendationForStudent({
        location,
        guideGuidelines: "חשוב להקפיד על נעלי הליכה נוחות. בערב עשוי להיות קריר.",
        currentWeather: mockWeather
      });
      setRecommendation(result.recommendation);
    } catch (err) {
      setRecommendation("מצטערים, לא הצלחנו לקבל המלצה כרגע. עדיף להתלבש בשיטת הבצל!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent bg-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shirt className="w-5 h-5 text-accent-foreground" />
          מה כדאי ללבוש ב{location}?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendation ? (
          <div className="animate-in fade-in duration-500 text-right" dir="rtl">
            <p className="text-sm leading-relaxed whitespace-pre-line font-medium text-primary-foreground/90">{recommendation}</p>
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setRecommendation(null)}>
              נקה המלצה
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <p className="text-xs text-muted-foreground mb-4">
              המלצה חכמה המבוססת על מזג האוויר הצפוי ב{location} וניתוח AI.
            </p>
            <Button 
              onClick={getAdvice} 
              disabled={loading}
              className="bg-accent text-accent-foreground hover:bg-accent/80 font-bold shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מנתח תנאים ב{location}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  קבל המלצת לבוש ל{location}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
