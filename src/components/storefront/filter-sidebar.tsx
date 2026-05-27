"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { SPORT_CATEGORIES, LISTING_TYPES, GRADE_TIERS, PRICE_RANGES, ERAS } from "@/lib/constants/taxonomy";

interface FilterSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, defaultExpanded = true, children }: FilterSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="border-b border-white/10 py-4">
      <button 
        className="flex w-full items-center justify-between text-sm font-semibold text-white hover:text-zinc-300 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {title}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && <div className="mt-4 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export function FilterSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const toggleParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ['sport', 'listing_type', 'grade', 'price', 'era'].forEach(k => params.delete(k));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = ['sport', 'listing_type', 'grade', 'price', 'era'].some(k => searchParams.has(k));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <h2 className="text-lg font-bold text-white">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs font-semibold text-[#7C3AED] hover:text-[#9F7AEA] transition-colors">
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-col">
        <FilterSection title="Sport / Category">
          {SPORT_CATEGORIES.map(cat => {
            const isSelected = searchParams.get('sport') === cat.id;
            const hasSubActive = cat.subOptions?.some(sub => searchParams.get('sport') === sub.id);
            const isExpanded = isSelected || hasSubActive;
            
            return (
              <div key={cat.id} className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                    {cat.label}
                  </span>
                  <input type="radio" className="hidden" checked={isSelected} onChange={() => toggleParam('sport', cat.id)} />
                </label>

                {cat.subOptions && isExpanded && (
                  <div className="ml-7 flex flex-wrap gap-2 mt-1 mb-2">
                    {cat.subOptions.map(sub => {
                      const isSubSelected = searchParams.get('sport') === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => toggleParam('sport', sub.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-md transition-colors border ${isSubSelected ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-[#7C3AED]' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </FilterSection>

        <FilterSection title="Listing Type">
          {LISTING_TYPES.map(opt => {
            const isSelected = searchParams.get('listing_type') === opt.id;
            return (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  {opt.label}
                </span>
                <input type="radio" className="hidden" checked={isSelected} onChange={() => toggleParam('listing_type', opt.id)} />
              </label>
            );
          })}
        </FilterSection>

        <FilterSection title="Grade Tier">
          {GRADE_TIERS.map(opt => {
            const isSelected = searchParams.get('grade') === opt.id;
            return (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  {opt.label}
                </span>
                <input type="radio" className="hidden" checked={isSelected} onChange={() => toggleParam('grade', opt.id)} />
              </label>
            );
          })}
        </FilterSection>

        <FilterSection title="Price Range">
          {PRICE_RANGES.map(opt => {
            const isSelected = searchParams.get('price') === opt.id;
            return (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  {opt.label}
                </span>
                <input type="radio" className="hidden" checked={isSelected} onChange={() => toggleParam('price', opt.id)} />
              </label>
            );
          })}
        </FilterSection>

        <FilterSection title="Era">
          {ERAS.map(opt => {
            const isSelected = searchParams.get('era') === opt.id;
            return (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                  {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  {opt.label}
                </span>
                <input type="radio" className="hidden" checked={isSelected} onChange={() => toggleParam('era', opt.id)} />
              </label>
            );
          })}
        </FilterSection>
      </div>
    </div>
  );
}
