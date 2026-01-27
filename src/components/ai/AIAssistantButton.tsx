import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { XPAIAssistant } from "./XPAIAssistant";

export function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 glow-primary"
        size="icon"
        title="XP Infrastructure AI"
      >
        <Brain className="h-6 w-6" />
      </Button>

      <XPAIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
