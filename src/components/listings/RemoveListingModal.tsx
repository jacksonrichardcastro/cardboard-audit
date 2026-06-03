"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { removeListingAction } from "@/app/actions/edit-listing";
import { useRouter } from "next/navigation";

interface RemoveListingModalProps {
  listingId: number;
  triggerNode: React.ReactElement;
  onSuccessRedirectUrl?: string; // e.g. /seller/dashboard?tab=listings
}

export function RemoveListingModal({ listingId, triggerNode, onSuccessRedirectUrl }: RemoveListingModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = (mode: 'unlist' | 'delete') => {
    startTransition(async () => {
      try {
        const res = await removeListingAction(listingId, mode);
        if (res.success) {
          toast.success(mode === 'unlist' ? "Listing removed from marketplace" : "Card deleted from binder");
          setOpen(false);
          
          if (onSuccessRedirectUrl) {
            router.push(onSuccessRedirectUrl);
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to remove listing.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerNode} />
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Remove this listing?</DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">Choose what you'd like to do:</p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <Button 
            variant="outline" 
            disabled={isPending}
            onClick={() => handleAction('unlist')}
            className="flex flex-col items-start h-auto py-3 px-4 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 bg-zinc-900/50"
          >
            <span className="font-semibold text-white">Remove from Marketplace</span>
            <span className="text-xs text-zinc-400 font-normal mt-1 text-left whitespace-normal">Unlist this card from the public marketplace. The card stays in your binder so you can re-list it later.</span>
          </Button>

          <Button 
            variant="destructive" 
            disabled={isPending}
            onClick={() => handleAction('delete')}
            className="flex flex-col items-start h-auto py-3 px-4 bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 text-red-500 hover:text-red-400"
          >
            <span className="font-semibold text-red-500">Delete from Binder</span>
            <span className="text-xs text-red-500/70 font-normal mt-1 text-left whitespace-normal">Remove this card entirely — from the marketplace AND from your binder. This cannot be undone.</span>
          </Button>

          <Button 
            variant="destructive" 
            disabled={isPending}
            onClick={() => handleAction('delete')}
            className="flex flex-col items-start h-auto py-3 px-4 bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 text-red-500 hover:text-red-400"
          >
            <span className="font-semibold text-red-500">Both</span>
            <span className="text-xs text-red-500/70 font-normal mt-1 text-left whitespace-normal">Unlist AND delete from your binder. Same as Delete from Binder above.</span>
          </Button>
        </div>

        <DialogFooter className="sm:justify-start pt-2 border-t border-zinc-800">
          <Button 
            type="button" 
            variant="ghost" 
            disabled={isPending}
            onClick={() => setOpen(false)}
            className="w-full text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
