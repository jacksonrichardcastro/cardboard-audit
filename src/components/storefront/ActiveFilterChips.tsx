"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { SPORT_CATEGORIES, LISTING_TYPES, GRADE_TIERS, PRICE_RANGES, ERAS } from "@/lib/constants/taxonomy";

export function ActiveFilterChips() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getLabelForValue = (key: string, value: string) => {
    if (key === 'sport') {
      for (const cat of SPORT_CATEGORIES) {
        if (cat.id === value) return cat.label;
        if (cat.subOptions) {
          const sub = cat.subOptions.find(s => s.id === value);
          if (sub) return sub.label;
        }
      }
    } else if (key === 'listing_type') {
      return LISTING_TYPES.find(t => t.id === value)?.label || value;
    } else if (key === 'grade') {
      return GRADE_TIERS.find(t => t.id === value)?.label || value;
    } else if (key === 'price') {
      return PRICE_RANGES.find(t => t.id === value)?.label || value;
    } else if (key === 'era') {
      return ERAS.find(t => t.id === value)?.label || value;
    }
    return value;
  };

  const activeFilters: { key: string; value: string; label: string }[] = [];
  const keys = ['sport', 'listing_type', 'grade', 'price', 'era'];
  for (const k of keys) {
    const v = searchParams.get(k);
    if (v) activeFilters.push({ key: k, value: v, label: getLabelForValue(k, v) });
  }

  if (activeFilters.length === 0) return null;

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of keys) {
      params.delete(k);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {activeFilters.map((f) => (
        <Badge key={f.key} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700 h-7 flex items-center px-2.5 rounded-full font-medium">
          {f.label}
          <button onClick={() => removeFilter(f.key)} className="ml-1.5 hover:text-white text-zinc-400">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      {activeFilters.length >= 2 && (
        <button onClick={clearAll} className="text-xs text-[#7C3AED] hover:text-[#9F7AEA] ml-2 font-medium transition-colors">
          Clear All
        </button>
      )}
    </div>
  );
}
