"use client";

import { useState, useEffect } from "react";
import { Role, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { UserCircle, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";

interface AuthScreenProps {
  onLogin: (user: User, customJoinCode?: string) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  
  // Captcha state
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");
  const [isHuman, setIsHuman] = useState(false);

  useEffect(() => {
    generateCaptcha();
  }, [role]);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaInput("");
    setIsHuman(false);
  };

  const handleCaptchaChange = (value: string) => {
    setCaptchaInput(value);
    if (parseInt(value) === num1 + num2) {
      setIsHuman(true);
    } else {
      setIsHuman(false);
    }
  };

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleJoin = () => {
    if (!name || !role || !isHuman) return;
    if (role === "student" && !code) return;

    const userId = Math.random().toString(36).substr(2, 9);
    const newJoinCode = role === "guide" ? generateJoinCode() : undefined;

    onLogin({
      id: userId,
      name,
      role,
      tripId: role === "student" ? "trip-1" : undefined
    }, newJoinCode);
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
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא</Label>
                <Input
                  id="name"
                  placeholder="הכנס שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              {role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="code">קוד הצטרפות</Label>
                  <Input
                    id="code"
                    placeholder="הכנס קוד טיול"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
              )}

              {/* Human Verification Section */}
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-primary mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  אימות אנושי
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold bg-white px-3 py-1 rounded border shadow-sm">
                    {num1} + {num2} = ?
                  </div>
                  <Input
                    type="number"
                    placeholder="תשובה"
                    className="w-24"
                    value={captchaInput}
                    onChange={(e) => handleCaptchaChange(e.target.value)}
                  />
                  {isHuman && (
                    <span className="text-green-600 font-bold text-sm animate-in zoom-in duration-300">✓ אומת</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">נא לפתור את התרגיל כדי לוודא שאינך בוט.</p>
              </div>

              <Button 
                onClick={handleJoin} 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={!name || (role === 'student' && !code) || !isHuman}
              >
                {role === "guide" ? "צור טיול והצטרף" : "הצטרף לטיול"}
              </Button>
              
              <Button variant="ghost" onClick={() => setRole(null)} className="w-full">
                חזור לבחירת תפקיד
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
