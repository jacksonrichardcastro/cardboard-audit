"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { SPORT_CATEGORIES, LISTING_TYPES, GRADE_TIERS, PRICE_RANGES, ERAS } from "@/lib/constants/taxonomy";

interface FilterSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, defaultExpanded = false, children }: FilterSectionProps) {
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

export function FiltersDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Local state for the drawer before applying
  const [localParams, setLocalParams] = useState<URLSearchParams>(new URLSearchParams(searchParams.toString()));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      setLocalParams(new URLSearchParams(searchParams.toString()));
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, searchParams]);

  const toggleParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(localParams.toString());
    if (nextParams.get(key) === value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
      // For 2-tier sports logic: if clicking a parent while a child is active, replace with parent.
      // If clicking a child while parent is active, replace with child.
      // (This is implicitly handled by single-select `set(key, value)`)
    }
    setLocalParams(nextParams);
  };

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

  const applyFilters = () => {
    router.replace(`${pathname}?${localParams.toString()}`);
    setIsOpen(false);
  };

  const clearAll = () => {
    const nextParams = new URLSearchParams(localParams.toString());
    ['sport', 'listing_type', 'grade', 'price', 'era'].forEach(k => nextParams.delete(k));
    setLocalParams(nextParams);
  };

  const activeLocalCount = ['sport', 'listing_type', 'grade', 'price', 'era'].filter(k => localParams.has(k)).length;

  const renderChips = () => {
    const chips: { key: string; value: string; label: string }[] = [];
    ['sport', 'listing_type', 'grade', 'price', 'era'].forEach(k => {
      const v = localParams.get(k);
      if (v) chips.push({ key: k, value: v, label: getLabelForValue(k, v) });
    });
    
    if (chips.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {chips.map(c => (
          <div key={c.key} className="bg-zinc-800 text-xs text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-zinc-700">
            {c.label}
            <button onClick={() => toggleParam(c.key, c.value)} className="hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors text-xs font-semibold"
      >
        <Filter className="w-3.5 h-3.5" />
        Filters
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            // If click is in the top-left area (Trax logo), navigate home
            if (e.clientY <= 64 && e.clientX <= 200) {
              setIsOpen(false);
              router.push("/");
            } else {
              setIsOpen(false);
            }
          }}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-16 right-0 h-[calc(100vh-64px)] w-full sm:w-[360px] bg-[#0A0A0A] border-l border-white/10 z-[210] transform transition-transform duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Filters</h2>
            {activeLocalCount > 0 && (
              <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeLocalCount}
              </span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          {renderChips()}

          <FilterSection title="Sport / Category">
            {SPORT_CATEGORIES.map(cat => {
              const isSelected = localParams.get('sport') === cat.id;
              const hasSubActive = cat.subOptions?.some(sub => localParams.get('sport') === sub.id);
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
                    {/* Invisible radio just for semantic/a11y though custom div controls it */}
                    <input type="radio" className="hidden" checked={isSelected} onChange={() => toggleParam('sport', cat.id)} />
                  </label>

                  {cat.subOptions && isExpanded && (
                    <div className="ml-7 flex flex-wrap gap-2 mt-1 mb-2">
                      {cat.subOptions.map(sub => {
                        const isSubSelected = localParams.get('sport') === sub.id;
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
              const isSelected = localParams.get('listing_type') === opt.id;
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
              const isSelected = localParams.get('grade') === opt.id;
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
              const isSelected = localParams.get('price') === opt.id;
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
              const isSelected = localParams.get('era') === opt.id;
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
          
          <div className="h-8" />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-[#0A0A0A] shrink-0 flex items-center justify-between">
          <button 
            onClick={clearAll}
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
          <button 
            onClick={applyFilters}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>

      </div>
    </>
  );
}
