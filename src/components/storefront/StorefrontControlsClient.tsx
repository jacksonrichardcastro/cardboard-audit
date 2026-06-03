"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListTree, Settings2, Loader2 } from "lucide-react";
import { updateStorefrontLayout } from "@/app/actions/categories";
import { CategoryManager } from "./CategoryManager";

interface StorefrontControlsClientProps {
  layout: "grid" | "categories";
  categories: any[];
  sports: string[];
  years: string[];
  brands: string[];
  grades: string[];
}

export function StorefrontControlsClient({ layout, categories, sports, years, brands, grades }: StorefrontControlsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [manageOpen, setManageOpen] = useState(false);

  const toggleLayout = () => {
    startTransition(() => {
      updateStorefrontLayout(layout === "grid" ? "categories" : "grid");
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleLayout} 
        disabled={isPending}
        className="h-8 bg-black/60 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 rounded-full px-3 text-xs"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
        ) : layout === "grid" ? (
          <ListTree className="w-3.5 h-3.5 mr-2" />
        ) : (
          <LayoutGrid className="w-3.5 h-3.5 mr-2" />
        )}
        Layout: {layout === "grid" ? "Grid" : "Categories"}
      </Button>

      {layout === "categories" && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManageOpen(true)}
            className="h-8 bg-black/60 backdrop-blur-sm border-[#7C3AED]/40 text-[#7C3AED] hover:bg-[#7C3AED]/20 hover:text-white rounded-full px-3 text-xs"
          >
            <Settings2 className="w-3.5 h-3.5 mr-2" />
            Manage Categories
          </Button>
          <CategoryManager 
            open={manageOpen} 
            onOpenChange={setManageOpen} 
            categories={categories}
            sports={sports}
            years={years}
            brands={brands}
            grades={grades}
          />
        </>
      )}
    </div>
  );
}
