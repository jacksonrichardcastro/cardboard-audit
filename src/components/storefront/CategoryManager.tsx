"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { addCategory, removeCategory, autoPopulateCategories, autoPopulateMyCollection } from "@/app/actions/categories";

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: any[];
  sports: string[];
  years: string[];
  brands: string[];
  grades: string[];
}

const CURATED_CATEGORIES = [
  { name: "🔥 Weekly Discounts", autoManaged: true },
  { name: "💎 Fresh Pulls", autoManaged: false },
  { name: "🏆 Investment Grade", autoManaged: false },
  { name: "📈 Rookie Watch", autoManaged: false },
  { name: "🔓 Vault Steals", autoManaged: false },
  { name: "Personal Favorites", autoManaged: false },
  { name: "My Collection", autoManaged: false },
];

export function CategoryManager({ open, onOpenChange, categories, sports, years, brands, grades }: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showMyCollectionPrompt, setShowMyCollectionPrompt] = useState(false);

  const activeNames = categories.map(c => c.name);

  // Filter out already active items
  const availableCurated = CURATED_CATEGORIES.filter(c => !activeNames.includes(c.name));
  const availableSports = sports.filter(s => !activeNames.includes(s));
  const availableYears = years.filter(y => !activeNames.includes(y));
  const availableBrands = brands.filter(b => !activeNames.includes(b));
  const availableGrades = grades.filter(g => !activeNames.includes(g));

  const handleAddCategory = () => {
    if (!selectedCategory) return;
    
    // Check if it's My Collection
    if (selectedCategory === "My Collection") {
      setShowMyCollectionPrompt(true);
      return;
    }

    const isAuto = selectedCategory === "🔥 Weekly Discounts";
    
    startTransition(async () => {
      await addCategory(selectedCategory, isAuto);
      setSelectedCategory("");
    });
  };

  const handleMyCollectionChoice = (autoPopulate: boolean) => {
    startTransition(async () => {
      if (autoPopulate) {
        await autoPopulateMyCollection();
      } else {
        await addCategory("My Collection", false);
      }
      setShowMyCollectionPrompt(false);
      setSelectedCategory("");
    });
  };

  const handleRemove = (id: number) => {
    startTransition(async () => {
      await removeCategory(id);
    });
  };

  const handleAutoPopulate = () => {
    startTransition(async () => {
      await autoPopulateCategories();
    });
  };

  // Only show auto-populate if they have non-curated categories
  const hasAutoDataCategory = categories.some(c => !CURATED_CATEGORIES.some(curated => curated.name === c.name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false} disablePointerDismissal>
      <DialogContent hideOverlay={true} className="max-w-md !bg-violet-600/10 backdrop-blur-3xl border-[#7C3AED]/30 text-white shadow-2xl z-[120]">
        <DialogHeader>
          <DialogTitle className="text-xl">Manage Categories</DialogTitle>
          <p className="text-sm text-zinc-300">
            Organize your storefront by adding category rows.
          </p>
        </DialogHeader>

        {showMyCollectionPrompt ? (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <h3 className="text-lg font-medium text-white">Auto-populate from binder?</h3>
            <p className="text-sm text-zinc-300">
              Would you like to automatically fill "My Collection" with all cards currently in your binder?
            </p>
            <div className="flex gap-3 mt-4 w-full">
              <Button variant="outline" className="flex-1 border-[#7C3AED]/30 bg-black/40 text-white hover:bg-black/60" onClick={() => handleMyCollectionChoice(false)} disabled={isPending}>
                Add my own
              </Button>
              <Button className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]" onClick={() => handleMyCollectionChoice(true)} disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Auto Populate"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4">
            {/* Add Category */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-200">Add a Category Row</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-black/40 border border-[#7C3AED]/30 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  disabled={isPending}
                >
                  <option value="" disabled className="bg-zinc-900">Select a category...</option>
                  
                  {availableCurated.length > 0 && <optgroup label="CURATED" className="bg-zinc-900"></optgroup>}
                  {availableCurated.map(c => (
                    <option key={c.name} value={c.name} className="bg-zinc-900">{c.name}</option>
                  ))}
                  
                  {availableSports.length > 0 && <optgroup label="BY SPORT" className="bg-zinc-900"></optgroup>}
                  {availableSports.map(s => (
                    <option key={s} value={s} className="bg-zinc-900">{s}</option>
                  ))}
                  
                  {availableYears.length > 0 && <optgroup label="BY YEAR" className="bg-zinc-900"></optgroup>}
                  {availableYears.map(y => (
                    <option key={y} value={y} className="bg-zinc-900">{y}</option>
                  ))}
                  
                  {availableBrands.length > 0 && <optgroup label="BY BRAND" className="bg-zinc-900"></optgroup>}
                  {availableBrands.map(b => (
                    <option key={b} value={b} className="bg-zinc-900">{b}</option>
                  ))}
                  
                  {availableGrades.length > 0 && <optgroup label="BY GRADE TIER" className="bg-zinc-900"></optgroup>}
                  {availableGrades.map(g => (
                    <option key={g} value={g} className="bg-zinc-900">{g}</option>
                  ))}
                </select>
                <Button onClick={handleAddCategory} disabled={!selectedCategory || isPending} className="bg-black/40 border border-[#7C3AED]/30 text-white hover:bg-black/60">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Auto Populate Button */}
            {hasAutoDataCategory && (
              <Button 
                onClick={handleAutoPopulate} 
                disabled={isPending}
                className="w-full bg-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/30 border border-[#7C3AED]/50"
              >
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Auto Populate Categories and Reorganize
              </Button>
            )}

            {/* Active Categories List */}
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2">
              <label className="text-sm font-medium text-zinc-200">Active Rows</label>
              {categories.length === 0 ? (
                <p className="text-sm text-[#7C3AED]/70 italic">No categories added yet.</p>
              ) : (
                categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-black/40 border border-[#7C3AED]/20 hover:border-[#7C3AED]/40 transition-colors">
                    <span className="text-sm text-white font-medium">{c.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemove(c.id)} 
                      disabled={isPending}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
