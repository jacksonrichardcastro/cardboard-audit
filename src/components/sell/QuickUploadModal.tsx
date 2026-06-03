"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, ImagePlus, LibrarySquare } from "lucide-react";

export function QuickUploadModal({ label = "Add" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button 
            variant="outline" 
            size="icon" 
            className="h-11 w-11 bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-300 rounded-full shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">What would you like to add?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <Button 
            variant="outline" 
            className="h-32 flex flex-col gap-3 bg-zinc-900 border-white/10 hover:bg-zinc-800 hover:border-violet-500/50 group"
            onClick={() => {
              setOpen(false);
              router.push('/sell/new?mode=listing');
            }}
          >
            <ImagePlus className="w-8 h-8 text-zinc-400 group-hover:text-violet-400" />
            <div className="text-center">
              <div className="font-semibold text-white">Draft a Listing</div>
              <div className="text-xs text-zinc-500 font-normal">Prepare a card for sale</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-32 flex flex-col gap-3 bg-zinc-900 border-white/10 hover:bg-zinc-800 hover:border-violet-500/50 group"
            onClick={() => {
              setOpen(false);
              router.push('/sell/new?mode=binder');
            }}
          >
            <LibrarySquare className="w-8 h-8 text-zinc-400 group-hover:text-violet-400" />
            <div className="text-center">
              <div className="font-semibold text-white">Add to Binder</div>
              <div className="text-xs text-zinc-500 font-normal">Add to your collection</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
