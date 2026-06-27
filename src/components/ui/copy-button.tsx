"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopy}
      className="flex-shrink-0"
    >
      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}
