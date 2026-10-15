"use client";

import { useState } from "react";
import { KeyRound, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  initialKey?: string;
  error?: string | null;
  onSave: (key: string) => void;
  onCancel?: () => void;
}

export function ApiKeySetup({ initialKey = "", error, onSave, onCancel }: Props) {
  const [key, setKey] = useState(initialKey);
  const trimmed = key.trim();

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          מפתח Google Maps
        </CardTitle>
        <CardDescription>
          המשחק משתמש ב-Street View של גוגל, ולכן צריך מפתח API אישי. המפתח נשמר רק בדפדפן הזה.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) onSave(trimmed);
          }}
        >
          <Input
            dir="ltr"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIza..."
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
          <Button type="submit" disabled={!trimmed}>
            שמירה
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              ביטול
            </Button>
          )}
        </form>

        <ol className="list-decimal space-y-2 pr-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            נכנסים ל-
            <a
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
              href="https://console.cloud.google.com/google/maps-apis/start"
              target="_blank"
              rel="noreferrer"
            >
              Google Cloud Console
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            ויוצרים פרויקט חדש.
          </li>
          <li>
            מפעילים את <b className="text-foreground">Maps JavaScript API</b> (זה כל מה שצריך – Street View כלול בו).
          </li>
          <li>מחברים חשבון חיוב. גוגל דורשת את זה, אבל יש מכסה חודשית חינמית שמספיקה בדרך כלל למשחק אישי.</li>
          <li>
            ב-Credentials יוצרים <b className="text-foreground">API key</b>. מומלץ להגביל אותו ל-Maps JavaScript API ולכתובת האתר
            (HTTP referrers).
          </li>
          <li>מדביקים את המפתח כאן.</li>
        </ol>
      </CardContent>
    </Card>
  );
}
