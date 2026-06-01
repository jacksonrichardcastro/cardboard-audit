"use client";

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";

const CAPTIONS = [
  "By the hobby. For the hobby.",
  "Curated by collectors, for collectors.",
  "Hand-vetted sellers. Always.",
  "Marketplace built for the bench.",
  "Where the hobby trades.",
  "Beta launched May 31, 2026."
];

export function TickerPill() {
  const [caption, setCaption] = useState("");
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    setCaption(CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)]);
  }, []);

  useEffect(() => {
    if (textRef.current && containerRef.current) {
      if (textRef.current.scrollWidth > containerRef.current.clientWidth) {
        setNeedsScroll(true);
      }
    }
  }, [caption]);

  if (!caption) return null;

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-block;
          white-space: nowrap;
          animation: ticker-scroll 10s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
      <Badge className="bg-slate-800/40 text-slate-300 border border-white/5 hover:bg-slate-800/60 py-1.5 px-4 rounded-full text-xs font-medium overflow-hidden max-w-[280px] md:max-w-xs inline-flex items-center group relative">
        <span className="inline-block w-2 h-2 shrink-0 rounded-full bg-[#7C3AED] mr-2 animate-pulse relative z-10"></span>
        <div className="overflow-hidden w-full relative z-0" ref={containerRef}>
          <div className={needsScroll ? "animate-ticker" : "whitespace-nowrap"}>
            <span ref={textRef} className="pr-4">{caption}</span>
            {needsScroll && <span className="pr-4">{caption}</span>}
          </div>
        </div>
      </Badge>
    </>
  );
}
