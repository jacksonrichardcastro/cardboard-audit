"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-8 relative">
      <Search className="absolute left-4 top-3.5 text-muted-foreground w-5 h-5 pointer-events-none" />
      <Input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by player, set, grade..." 
        className="w-full pl-12 h-12 bg-white/5 border-white/10 text-lg rounded-full focus-visible:ring-primary/50"
      />
      <button type="submit" hidden aria-hidden="true" />
    </form>
  );
}
