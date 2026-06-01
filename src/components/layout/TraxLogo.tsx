"use client";

import Link from "next/link";
import { useFiltersStore } from "@/store/useFiltersStore";

export function TraxLogo() {
  const { setIsOpen } = useFiltersStore();

  return (
    <Link 
      href="/" 
      className="flex items-center gap-1"
      onClick={() => setIsOpen(false)}
    >
      <img
        src="/trax-logo.png"
        alt="Trax"
        className="h-7 w-auto"
      />
      <span className="text-xl font-bold tracking-tighter">Marketplace</span>
    </Link>
  );
}
