"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Edit3, Loader2 } from "lucide-react";
import { updateHeaderCustomization } from "@/app/actions/profile";

interface Card {
  id: number;
  title: string;
  photos: string[];
}

interface HeaderCustomizerProps {
  cards: Card[];
  selectedIds: number[];
}

export function HeaderCustomizer({ cards, selectedIds }: HeaderCustomizerProps) {
  const [open, setOpen] = useState(false);
  const [localSelection, setLocalSelection] = useState<number[]>(selectedIds);
  const [isPending, startTransition] = useTransition();

  const toggleCard = (id: number) => {
    setLocalSelection(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      }
      if (prev.length >= 8) return prev; // max 8
      return [...prev, id];
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateHeaderCustomization(localSelection);
        setOpen(false);
      } catch (err) {
        alert("Failed to update header");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (val) setLocalSelection(selectedIds);
      setOpen(val);
    }}>
      <DialogTrigger className="absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold hover:bg-white/10 transition-colors">
        <Edit3 className="w-3.5 h-3.5" />
        Customize Header
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Customize Header Cards</DialogTitle>
          <p className="text-sm text-zinc-400">
            Select up to 8 cards from your binder to feature in your profile header. ({localSelection.length}/8 selected)
          </p>
        </DialogHeader>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto py-4 pr-2">
          {cards.map(card => {
            const isSelected = localSelection.includes(card.id);
            const photoUrl = (Array.isArray(card.photos) && card.photos.length > 0 && card.photos[0]) 
              ? card.photos[0] 
              : 'https://placehold.co/400x550';

            return (
              <div 
                key={card.id} 
                onClick={() => toggleCard(card.id)}
                className={`relative aspect-[5/7] rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${isSelected ? 'border-[#7C3AED]' : 'border-transparent hover:border-zinc-700'}`}
              >
                <img src={photoUrl} alt={card.title} className="w-full h-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-[#7C3AED]/20 flex items-center justify-center">
                    <div className="bg-[#7C3AED] rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {cards.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
              You don't have any cards in your binder yet.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
