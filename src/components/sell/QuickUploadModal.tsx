"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, ImagePlus, LibrarySquare } from "lucide-react";

export function QuickUploadModal({ label = "Add" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1.5 h-8 bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-300"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">What would you like to add?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <Button 
            asChild
            variant="outline" 
            className="h-32 flex flex-col gap-3 bg-zinc-900 border-white/10 hover:bg-zinc-800 hover:border-violet-500/50 group"
          >
            <Link href="/sell/new" onClick={() => setOpen(false)}>
              <ImagePlus className="w-8 h-8 text-zinc-400 group-hover:text-violet-400" />
              <div className="text-center">
                <div className="font-semibold text-white">Draft a Listing</div>
                <div className="text-xs text-zinc-500 font-normal">Prepare a card for sale</div>
              </div>
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="outline" 
            className="h-32 flex flex-col gap-3 bg-zinc-900 border-white/10 hover:bg-zinc-800 hover:border-violet-500/50 group"
          >
            <Link href="/sell/new?mode=binder" onClick={() => setOpen(false)}>
              <LibrarySquare className="w-8 h-8 text-zinc-400 group-hover:text-violet-400" />
              <div className="text-center">
                <div className="font-semibold text-white">Add to Binder</div>
                <div className="text-xs text-zinc-500 font-normal">Add to your collection</div>
              </div>
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
