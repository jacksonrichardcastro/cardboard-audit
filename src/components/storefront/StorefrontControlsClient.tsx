"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListTree, Settings2, Loader2, Settings, Eye, Image as ImageIcon } from "lucide-react";
import { updateStorefrontLayout } from "@/app/actions/categories";
import { CategoryManager } from "./CategoryManager";
import { HeaderCustomizer } from "@/components/shared/HeaderCustomizer";
import { useRouter } from "next/navigation";
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
}

export function StorefrontControlsClient({ layout, categories, sports, years, brands, grades, isPreview, binderCards, headerIds }: StorefrontControlsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [manageOpen, setManageOpen] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);
  const router = useRouter();

  const handleLayoutChange = (value: string) => {
    if (value === layout) return;
    startTransition(() => {
      updateStorefrontLayout(value as "grid" | "categories");
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger render={
          isPreview ? (
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full bg-black/60 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 z-[100]">
              <Settings className="w-5 h-5" />
            </Button>
          ) : (
            <Button variant="outline" className="flex items-center gap-2 px-4 py-2 border border-white/20 bg-zinc-900/80 backdrop-blur-sm text-white hover:bg-white/10 rounded-full text-sm font-medium transition-colors h-11">
              <Settings className="w-4 h-4" />
              Manage Storefront
            </Button>
          )
        } />
        <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-white z-[110]">
          <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Layout
          </div>
          <DropdownMenuRadioGroup value={layout} onValueChange={handleLayoutChange}>
            <DropdownMenuRadioItem value="grid" className="cursor-pointer focus:bg-white/10 focus:text-white" onSelect={(e) => e.preventDefault()}>
              <LayoutGrid className="w-4 h-4 mr-2" />
              Grid
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="categories" className="cursor-pointer focus:bg-white/10 focus:text-white" onSelect={(e) => e.preventDefault()}>
              <ListTree className="w-4 h-4 mr-2" />
              Categories
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          
          <DropdownMenuSeparator className="bg-white/10" />
          
          <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white" onSelect={() => setHeaderOpen(true)}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Customize Header
          </DropdownMenuItem>
          
          {layout === "categories" && (
            <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white text-[#7C3AED] focus:text-[#7C3AED] focus:bg-[#7C3AED]/10" onSelect={() => setManageOpen(true)}>
              <Settings2 className="w-4 h-4 mr-2" />
              Manage Categories
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
      
      <HeaderCustomizer 
        cards={binderCards} 
        selectedIds={headerIds}
        open={headerOpen}
        onOpenChange={setHeaderOpen}
      />
    </div>
  );
}
