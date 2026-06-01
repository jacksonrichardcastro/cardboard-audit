"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";

export function BinderValueToggle({ isOwner }: { isOwner: boolean }) {
  const [isPrivate, setIsPrivate] = useState(true);

  if (!isOwner) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-white/5">
        <Lock className="w-4 h-4 text-zinc-500" />
        <span className="text-xs font-semibold text-zinc-400">Private Value</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsPrivate(!isPrivate)}
      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-lg border border-white/5 cursor-pointer"
    >
      {isPrivate ? (
        <>
          <Lock className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400">Private Value</span>
        </>
      ) : (
        <>
          <Unlock className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400">Tracker Coming Soon</span>
        </>
      )}
    </button>
  );
}
