"use client";

import { useState } from "react";
import { Role, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { UserCircle, GraduationCap, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleJoin = () => {
    if (!name || !role) return;
    if (role === "student" && !code) return;

    onLogin({
      id: Math.random().toString(36).substr(2, 9),
      name,
      role,
      tripId: role === "student" ? "trip-1" : undefined
    });
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
              <Button onClick={handleJoin} className="w-full bg-primary hover:bg-primary/90">
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
