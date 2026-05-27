"use client";

import { useState, useEffect } from "react";
import { saveUserPreferences } from "@/app/actions/preferences";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreferencesCaptureModalProps {
  isOpen: boolean;
  onClose: (skipped: boolean) => void;
  onSaved: () => void;
}

const CATEGORIES = [
  {
    title: "Sports",
    options: [
      { id: "basketball", label: "Basketball" },
      { id: "baseball", label: "Baseball" },
      { id: "football", label: "Football" },
      { id: "hockey", label: "Hockey" },
      { id: "soccer", label: "Soccer" },
      { id: "mma-boxing", label: "MMA / Boxing" },
      { id: "golf", label: "Golf" },
      { id: "racing", label: "Racing" }
    ]
  },
  {
    title: "TCG",
    options: [
      { id: "tcg.pokemon", label: "Pokemon" },
      { id: "tcg.magic", label: "Magic the Gathering" },
      { id: "tcg.yugioh", label: "Yu-Gi-Oh" },
      { id: "tcg.lorcana", label: "Lorcana" },
      { id: "tcg.one-piece", label: "One Piece" }
    ]
  },
  {
    title: "Non-Sport",
    options: [
      { id: "non-sport.marvel", label: "Marvel" },
      { id: "non-sport.star-wars", label: "Star Wars" },
      { id: "non-sport.other", label: "Other Non-Sport" }
    ]
  }
];

export function PreferencesCaptureModal({ isOpen, onClose, onSaved }: PreferencesCaptureModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // If not open, render nothing
  if (!isOpen) return null;

  const toggleOption = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
  };

  const handleSave = async () => {
    if (selected.size < 3) return;
    setIsSaving(true);
    try {
      await saveUserPreferences(Array.from(selected));
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem("trax_prefs_skipped", "true");
    onClose(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative">
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 border-b border-white/10">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">What do you collect?</h2>
          <p className="text-zinc-400">Pick at least 3 to personalize your feed</p>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto space-y-8 scrollbar-hide flex-1">
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="space-y-4">
              {cat.title !== "Sports" && (
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{cat.title}</h3>
              )}
              <div className="flex flex-wrap gap-2 md:gap-3">
                {cat.options.map(opt => {
                  const isSelected = selected.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt.id)}
                      className={`
                        px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all
                        ${isSelected 
                          ? 'bg-violet-600 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-violet-500' 
                          : 'bg-white/5 text-zinc-300 border border-violet-500/30 hover:border-violet-400 hover:bg-white/10'}
                      `}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex items-center justify-between rounded-b-2xl">
          <button 
            onClick={handleSkip}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Skip for Now
          </button>
          
          <Button 
            onClick={handleSave} 
            disabled={selected.size < 3 || isSaving}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg px-6"
          >
            {isSaving ? "Saving..." : `Save & Continue (${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
