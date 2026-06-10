"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListTree, Settings2, Loader2, Settings, Eye, Image as ImageIcon, Sparkles, Palette, Trees } from "lucide-react";
import { updateStorefrontLayout } from "@/app/actions/categories";
import { updateStorefrontTheme } from "@/app/actions/profile";
import { updateWoodTrimStyle } from "@/app/actions/storefronts";
import { toast } from "sonner";
import { CategoryManager } from "./CategoryManager";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StorefrontControlsClientProps {
  layout: "grid" | "categories";
  categories: any[];
  sports: string[];
  years: string[];
  brands: string[];
  grades: string[];
  isPreview: boolean;
  binderCards: any[];
  headerIds: number[];
  sellerHandle: string;
  theme: string;
  themeScope: string;
  woodTrimStyle: string;
  storefrontId: string;
}

export function StorefrontControlsClient({ layout, categories, sports, years, brands, grades, isPreview, binderCards, headerIds, sellerHandle, theme, themeScope, woodTrimStyle, storefrontId }: StorefrontControlsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [manageOpen, setManageOpen] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const router = useRouter();

  const [arrowTop, setArrowTop] = useState<number>(400); // sensible default

  useEffect(() => {
    if (!isPreview) return;

    const updatePosition = () => {
      const el = document.getElementById("seller-status-row");
      const wrapper = document.getElementById("storefront-controls-wrapper");
      if (el && wrapper) {
        const elRect = el.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        // Nudge up so the arrow visually centers in the gap
        setArrowTop((elRect.bottom - wrapperRect.top) - 14);
      }
    };

    updatePosition();
    // Use ResizeObserver for more robust layout updates if images load
    const observer = new ResizeObserver(updatePosition);
    if (document.body) observer.observe(document.body);
    window.addEventListener("resize", updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [isPreview]);

  const handleLayoutChange = (value: string) => {
    if (value === layout) return;
    startTransition(() => {
      updateStorefrontLayout(value as "grid" | "categories");
    });
  };

  const handleThemeChange = (value: string) => {
    if (value === theme) return;
    startTransition(() => {
      updateStorefrontTheme(value, (value === "trax-cosmos" || value === "trax-wood") ? themeScope : null)
        .then(() => toast.success("Theme updated"));
    });
  };

  const handleScopeChange = (value: string) => {
    if (value === themeScope) return;
    startTransition(() => {
      updateStorefrontTheme(theme, value)
        .then(() => toast.success("Theme scope updated"));
    });
  };

  const handleTrimChange = (trimStyle: 'c2' | 'c3') => {
    if (trimStyle === woodTrimStyle) return;
    startTransition(() => {
      updateWoodTrimStyle(storefrontId, trimStyle)
        .then(() => toast.success("Trim style updated"));
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isPreview && (
        <button 
          onClick={() => setShowChrome(!showChrome)}
          className="absolute right-0 z-[100] p-2 bg-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/30 hover:text-white backdrop-blur-md rounded-l-lg border-y border-l border-[#7C3AED]/30 transition-all shadow-lg flex items-center justify-center -mt-4"
          title="Toggle Screenshot Mode"
          style={{ top: `${arrowTop}px` }}
        >
          {showChrome ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {(showChrome || !isPreview) && (
        <DropdownMenu>
          <DropdownMenuTrigger render={
            isPreview ? (
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-full bg-[#7C3AED]/20 backdrop-blur-md border-[#7C3AED]/30 text-white hover:bg-[#7C3AED]/40 z-[100] shadow-[0_0_10px_rgba(124,58,237,0.3)]">
                <Settings className="w-5 h-5" />
              </Button>
            ) : (
            <Button variant="outline" className="flex items-center gap-2 px-4 py-2 border border-white/20 bg-zinc-900/80 backdrop-blur-sm text-white hover:bg-white/10 rounded-full text-sm font-medium transition-colors h-11">
              <Settings className="w-4 h-4" />
              Manage Storefront
            </Button>
          )
        } />
        <DropdownMenuContent align="end" className="w-56 !bg-violet-600/10 backdrop-blur-3xl border border-[#7C3AED]/30 text-white z-[110]">
          <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Layout
          </div>
          <DropdownMenuRadioGroup value={layout} onValueChange={handleLayoutChange}>
            <DropdownMenuRadioItem value="grid" className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-white group" onSelect={(e) => e.preventDefault()}>
              <LayoutGrid className="w-4 h-4 mr-2 group-data-[state=checked]:text-[#7C3AED]" />
              <span className="group-data-[state=checked]:text-[#7C3AED]">Grid</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="categories" className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-white group" onSelect={(e) => e.preventDefault()}>
              <ListTree className="w-4 h-4 mr-2 group-data-[state=checked]:text-[#7C3AED]" />
              <span className="group-data-[state=checked]:text-[#7C3AED]">Categories</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          
          <DropdownMenuSeparator className="bg-white/10" />
          
          <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Background Theme
          </div>
          <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
            <DropdownMenuRadioItem value="trax-default" className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-white group" onSelect={(e) => e.preventDefault()}>
              <Palette className="w-4 h-4 mr-2 group-data-[state=checked]:text-[#7C3AED]" />
              <span className="group-data-[state=checked]:text-[#7C3AED]">Trax Theme</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="trax-cosmos" className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-white group" onSelect={(e) => e.preventDefault()}>
              <Sparkles className="w-4 h-4 mr-2 group-data-[state=checked]:text-[#7C3AED]" />
              <div className="flex flex-col">
                <span className="group-data-[state=checked]:text-[#7C3AED]">Trax Cosmos</span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="trax-wood" className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-white group" onSelect={(e) => e.preventDefault()}>
              <Trees className="w-4 h-4 mr-2 group-data-[state=checked]:text-[#7C3AED]" />
              <div className="flex flex-col">
                <span className="group-data-[state=checked]:text-[#7C3AED]">Trax Wood</span>
                <span className="text-[10px] text-zinc-500 group-data-[state=checked]:text-[#7C3AED]/70">Warm wood grain backdrop.</span>
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          {(theme === "trax-cosmos" || theme === "trax-wood") && (
            <div className="px-2 py-1.5 mt-1 ml-4 border-l border-white/10">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Apply to
              </div>
              <DropdownMenuRadioGroup value={themeScope} onValueChange={handleScopeChange}>
                <DropdownMenuRadioItem value="storefront-only" className="cursor-pointer text-xs focus:bg-[#7C3AED]/15 focus:text-white group h-7" onSelect={(e) => e.preventDefault()}>
                  <span className="group-data-[state=checked]:text-[#7C3AED]">Storefront only</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="profile-wide" className="cursor-pointer text-xs focus:bg-[#7C3AED]/15 focus:text-white group h-7" onSelect={(e) => e.preventDefault()}>
                  <span className="group-data-[state=checked]:text-[#7C3AED]">Profile-wide</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </div>
          )}
          
          {theme === "trax-wood" && (
            <div className="px-2 py-1.5 mt-2 ml-4 border-l border-white/10">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Gold Trim Style
              </div>
              <div className="flex gap-2 pl-1">
                <button onClick={() => handleTrimChange('c3')} className={`flex-1 flex flex-col items-center p-1.5 rounded border transition-colors ${woodTrimStyle === 'c3' ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 hover:border-white/20'}`}>
                  <img src="/themes/trax-gold-trim.jpg" className="w-full h-3 object-cover rounded-sm mb-1" />
                  <span className={`text-[10px] ${woodTrimStyle === 'c3' ? 'text-[#d4af37]' : 'text-zinc-400'}`}>Polished</span>
                </button>
                <button onClick={() => handleTrimChange('c2')} className={`flex-1 flex flex-col items-center p-1.5 rounded border transition-colors ${woodTrimStyle === 'c2' ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 hover:border-white/20'}`}>
                  <img src="/themes/trax-gold-trim-c2.jpg" className="w-full h-3 object-cover rounded-sm mb-1" />
                  <span className={`text-[10px] ${woodTrimStyle === 'c2' ? 'text-[#d4af37]' : 'text-zinc-400'}`}>Antique</span>
                </button>
              </div>
            </div>
          )}

          <DropdownMenuSeparator className="bg-white/10" />
          
          {layout === "categories" && (
            <DropdownMenuItem className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-[#7C3AED] text-[#7C3AED] transition-colors" onClick={() => setManageOpen(true)}>
              <Settings2 className="w-4 h-4 mr-2" />
              Manage Categories
            </DropdownMenuItem>
          )}

          {isPreview && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-[#7C3AED] text-red-400 transition-colors" onClick={() => router.push(`/${sellerHandle}`)}>
                Exit Preview
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      )}

      {!isPreview && (
        <Button variant="outline" onClick={() => router.push("?preview=true")} className="flex items-center gap-2 px-4 py-2 border border-white/20 bg-zinc-900/80 backdrop-blur-sm text-white hover:bg-white/10 rounded-full text-sm font-medium transition-colors h-11">
          <Eye className="w-4 h-4" />
          View Storefront
        </Button>
      )}

      {/* Render the dialogs outside the DropdownMenu so they don't get unmounted/blocked by the menu closing */}
      <CategoryManager 
        open={manageOpen} 
        onOpenChange={setManageOpen} 
        categories={categories}
        sports={sports}
        years={years}
        brands={brands}
        grades={grades}
        storefrontId={storefrontId}
      />
    </div>
  );
}
