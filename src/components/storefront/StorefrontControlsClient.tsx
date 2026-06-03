"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListTree, Settings2, Loader2, Settings, Eye, Image as ImageIcon } from "lucide-react";
import { updateStorefrontLayout } from "@/app/actions/categories";
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
}

export function StorefrontControlsClient({ layout, categories, sports, years, brands, grades, isPreview, binderCards, headerIds, sellerHandle }: StorefrontControlsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [manageOpen, setManageOpen] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const router = useRouter();

  const handleLayoutChange = (value: string) => {
    if (value === layout) return;
    startTransition(() => {
      updateStorefrontLayout(value as "grid" | "categories");
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isPreview && (
        <button 
          onClick={() => setShowChrome(!showChrome)}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-[100] p-2 bg-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED]/30 hover:text-white backdrop-blur-md rounded-l-lg border-y border-l border-[#7C3AED]/30 transition-all shadow-lg flex items-center justify-center"
          title="Toggle Screenshot Mode"
        >
          {showChrome ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {isPreview && showChrome && (
        <div className="fixed top-[max(env(safe-area-inset-top),20px)] left-1/2 -translate-x-1/2 z-[100]">
          <Link href={`/${sellerHandle}`} className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white font-semibold rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:bg-[#6D28D9] transition-all text-sm border border-white/20">
            Exit Preview
          </Link>
        </div>
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
        <DropdownMenuContent align="end" className="w-56 bg-[#7C3AED]/10 backdrop-blur-md border border-[#7C3AED]/30 text-white z-[110]">
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
          
          {layout === "categories" && (
            <DropdownMenuItem className="cursor-pointer focus:bg-[#7C3AED]/15 focus:text-[#7C3AED] text-[#7C3AED] transition-colors" onClick={() => setManageOpen(true)}>
              <Settings2 className="w-4 h-4 mr-2" />
              Manage Categories
            </DropdownMenuItem>
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
      />
    </div>
  );
}
