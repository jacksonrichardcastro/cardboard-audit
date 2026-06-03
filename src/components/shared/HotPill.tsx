import { Flame } from "lucide-react";

export function HotPill({ text = "Hot", className = "" }: { text?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs font-semibold uppercase tracking-wider ${className}`}>
      <Flame className="w-4 h-4 text-violet-600 fill-violet-600" />
      {text}
    </span>
  );
}
