
"use client";

import { useState, useEffect } from "react";
import { Role, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UserCircle, GraduationCap, MapPin, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";

interface AuthScreenProps {
  onLogin: (user: User, customJoinCode?: string) => Promise<void>;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const joinCode = searchParams.get("join");
    if (joinCode) {
      setCode(joinCode.toUpperCase().trim());
      setRole("student");
    }
  }, [searchParams]);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleJoin = async () => {
    if (!name || !role || isLoading) return;
    if (role === "student" && !code) return;

    setIsLoading(true);
    try {
      const userId = Math.random().toString(36).substr(2, 9);
      const normalizedCode = code.trim().toUpperCase();
      const newJoinCode = role === "guide" ? generateJoinCode() : undefined;

      await onLogin({
        id: userId,
        name,
        role,
        tripId: role === "student" ? normalizedCode : undefined
      }, newJoinCode);
      
    } catch (error) {
      console.error("AuthScreen error:", error);
      setIsLoading(false);
    }
    // הערה: ה-isLoading לא משתנה ל-false אם הכל הצליח כי אנחנו עוברים דף
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-primary/10 to-accent/10">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
              <MapPin className="text-primary-foreground w-10 h-10" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">מסעון</CardTitle>
          <CardDescription className="text-lg">השותף שלך למסע מוצלח</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!role ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
                onClick={() => setRole("guide")}
              >
                <UserCircle className="w-8 h-8" />
                <span>מלווה</span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
                onClick={() => setRole("student")}
              >
                <GraduationCap className="w-8 h-8" />
                <span>חניך</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2 text-right">
                <Label htmlFor="name">שם מלא</Label>
                <Input
                  id="name"
                  placeholder="הכנס שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-right"
                  disabled={isLoading}
                />
              </div>
              
              {role === "student" && (
                <div className="space-y-2 text-right">
                  <Label htmlFor="code">קוד הצטרפות</Label>
                  <Input
                    id="code"
                    placeholder="הכנס קוד טיול"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="text-right font-mono"
                    disabled={isLoading}
                  />
                </div>
              )}

              <Button 
                onClick={handleJoin} 
                className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold"
                disabled={!name || (role === 'student' && !code) || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  role === "guide" ? "צור טיול והצטרף" : "הצטרף לטיול"
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setRole(null)} 
                className="w-full"
                disabled={isLoading}
              >
                חזור לבחירת תפקיד
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
