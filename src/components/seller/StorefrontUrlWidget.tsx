"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StorefrontUrlWidget({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const url = `card-bound.vercel.app/${handle}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl mb-8">
      <h3 className="text-sm font-medium text-zinc-300 mb-2">Your Storefront URL</h3>
      <div className="flex gap-2">
        <Input 
          readOnly 
          value={url} 
          className="bg-zinc-950 border-white/10 font-mono text-sm text-violet-300"
        />
        <Button 
          variant="secondary" 
          onClick={copyToClipboard}
          className="shrink-0 flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
