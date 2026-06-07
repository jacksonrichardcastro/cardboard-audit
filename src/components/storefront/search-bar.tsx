"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, FormEvent } from "react";
import { toast } from "sonner";

export function SearchBar() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      toast("Search coming soon!");
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-8 relative">
      <button type="submit" className="absolute left-4 top-3.5 text-muted-foreground hover:text-white transition-colors" aria-label="Submit search">
        <Search className="w-5 h-5" />
      </button>
      <Input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by player, set, grade..." 
        className="w-full pl-12 h-12 bg-white/5 border-white/10 text-lg rounded-full focus-visible:ring-primary/50"
      />
    </form>
  );
}
