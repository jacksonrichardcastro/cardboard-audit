"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

export function FilterSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCategory = searchParams.get("category");
  const hasMinPrice = searchParams.has("minPrice");

  // A generic URL updater bypassing React state delays
  const updateUrl = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/");
  };

  const categories = ["TCG", "Sports", "Other"];

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
      <div className="flex items-center gap-2">
         <Filter className="w-5 h-5 text-muted-foreground" />
         <span className="font-semibold text-lg">Filters:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <Badge 
            key={cat} 
            variant={currentCategory === cat ? "default" : "outline"} 
            className={`cursor-pointer text-sm h-8 px-4 ${currentCategory !== cat ? "border-white/10 hover:bg-white/5" : ""}`}
            onClick={() => updateUrl("category", currentCategory === cat ? null : cat)}
          >
            {cat}
          </Badge>
        ))}

        <Badge 
          variant={hasMinPrice ? "default" : "outline"} 
          className={`cursor-pointer text-sm h-8 px-4 ${!hasMinPrice ? "border-white/10 hover:bg-white/5" : ""}`}
          onClick={() => updateUrl("minPrice", hasMinPrice ? null : "500")}
        >
          $500+ Grails
        </Badge>
      </div>

      {(currentCategory || hasMinPrice) && (
        <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-white flex items-center ml-auto">
          Clear all <X className="w-3 h-3 ml-1" />
        </button>
      )}
    </div>
  );
}
