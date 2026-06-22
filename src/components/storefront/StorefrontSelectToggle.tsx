"use client";

import { useStorefrontSelection } from "./StorefrontSelectionContext";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";

export function StorefrontSelectToggle() {
  const { isSelectMode, setIsSelectMode, clearSelection } = useStorefrontSelection();

  if (isSelectMode) {
    return (
      <Button 
        variant="secondary"
        size="sm"
        className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 text-white"
        onClick={() => {
          setIsSelectMode(false);
          clearSelection();
        }}
      >
        Done
      </Button>
    );
  }

  return (
    <Button 
      variant="outline"
      size="sm" 
      className="h-9 px-3 border-white/10 hover:bg-white/5"
      onClick={() => setIsSelectMode(true)}
    >
      <CheckSquare className="w-4 h-4 mr-2" />
      Select
    </Button>
  );
}
