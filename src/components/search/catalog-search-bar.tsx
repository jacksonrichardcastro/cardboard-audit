"use client";

import { useState, useEffect, useRef } from "react";
import { searchCatalog, SearchResult } from "@/app/actions/search";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
export function CatalogSearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ sets: SearchResult[]; cards: SearchResult[]; parallels: SearchResult[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchCatalog(query);
        setResults(res);
        setIsOpen(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={ref} className={`relative w-full max-w-2xl mx-auto ${className || ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2 && results) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2 && results) setIsOpen(true);
          }}
          placeholder="Search players, sets, teams, or card numbers..."
          className="w-full pl-10 pr-10 py-6 text-base md:text-lg rounded-2xl bg-white/5 border-white/10 focus-visible:ring-violet-500/50 shadow-xl"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && results && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto flex flex-col">
          {results.sets.length === 0 && results.cards.length === 0 && results.parallels.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No results found for "{query}".
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-4">
              {results.cards.length > 0 && (
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Cards</h3>
                  <div className="flex flex-col gap-1">
                    {results.cards.map((c) => (
                      <Link 
                        key={`card-${c.id}`} 
                        href={`/checklists/${c.setSlug}#card-${c.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <span className="font-medium text-white">{c.name}</span>
                        <span className="text-sm text-muted-foreground flex gap-2">
                          <span>#{c.cardNumber}</span>
                          <span>•</span>
                          <span className="truncate">{c.setSlug?.replace(/-/g, ' ')}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.sets.length > 0 && (
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Sets</h3>
                  <div className="flex flex-col gap-1">
                    {results.sets.map((s) => (
                      <Link 
                        key={`set-${s.id}`} 
                        href={`/checklists/${s.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-3 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium text-white"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.parallels.length > 0 && (
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Parallels</h3>
                  <div className="flex flex-col gap-1">
                    {results.parallels.map((p) => (
                      <div key={`parallel-${p.id}`} className="px-3 py-2 text-white opacity-80 cursor-default">
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
