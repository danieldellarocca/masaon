"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface NoticeBoardProps {
  onAdd?: (content: string) => void;
  isGuide?: boolean;
}

export function NoticeBoard({ onAdd, isGuide }: NoticeBoardProps) {
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!content.trim() || !onAdd) return;
    onAdd(content);
    setContent("");
  };

  if (!isGuide) return null;

  return (
    <div className="flex gap-2">
      <Input 
        placeholder="כתוב הודעה לחניכים..." 
        value={content} 
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <Button size="icon" onClick={handleSend} disabled={!content.trim()}>
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
