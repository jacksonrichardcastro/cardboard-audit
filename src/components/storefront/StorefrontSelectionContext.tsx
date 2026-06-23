"use client";

import React, { createContext, useContext, useState } from "react";
import { BulkMoveListingsModal } from "./BulkMoveListingsModal";
import { Button } from "@/components/ui/button";

interface StorefrontSelectionContextType {
  isSelectMode: boolean;
  setIsSelectMode: (v: boolean) => void;
  selectedListingIds: number[];
  toggleSelection: (e: React.MouseEvent, id: number) => void;
  clearSelection: () => void;
}

const StorefrontSelectionContext = createContext<StorefrontSelectionContextType | undefined>(undefined);

export function useStorefrontSelection() {
  const context = useContext(StorefrontSelectionContext);
  if (!context) throw new Error("useStorefrontSelection must be used within a StorefrontSelectionProvider");
  return context;
}

export function StorefrontSelectionProvider({ 
  children, 
  isOwner,
  userStorefronts,
  currentStorefrontId
}: { 
  children: React.ReactNode;
  isOwner: boolean;
  userStorefronts?: any[];
  currentStorefrontId?: string | number;
}) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedListingIds, setSelectedListingIds] = useState<number[]>([]);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);

  const toggleSelection = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedListingIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const clearSelection = () => {
    setSelectedListingIds([]);
  };

  const handleCancel = () => {
    setIsSelectMode(false);
    clearSelection();
  };

  return (
    <StorefrontSelectionContext.Provider value={{ isSelectMode, setIsSelectMode, selectedListingIds, toggleSelection, clearSelection }}>
      {children}
      
      {isOwner && isSelectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-zinc-950 border-t border-zinc-800 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{selectedListingIds.length} listings selected</span>
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button 
            onClick={() => setIsBulkMoveOpen(true)} 
            disabled={selectedListingIds.length === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Move to storefront
          </Button>
        </div>
      )}

      {isOwner && userStorefronts && currentStorefrontId && (
        <BulkMoveListingsModal 
          isOpen={isBulkMoveOpen}
          setIsOpen={setIsBulkMoveOpen}
          selectedListingIds={selectedListingIds}
          userStorefronts={userStorefronts}
          currentStorefrontId={currentStorefrontId}
          onSuccess={() => {
            clearSelection();
            setIsSelectMode(false);
          }}
        />
      )}
    </StorefrontSelectionContext.Provider>
  );
}
