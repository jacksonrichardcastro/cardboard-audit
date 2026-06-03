"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { removeCardAction } from "@/app/actions/edit-binder";
import { useRouter } from "next/navigation";

interface RemoveCardModalProps {
  cardId: number;
  triggerNode: React.ReactElement;
  onSuccessRedirectUrl?: string; // e.g. /username?tab=binder
}

export function RemoveCardModal({ cardId, triggerNode, onSuccessRedirectUrl }: RemoveCardModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = () => {
    startTransition(async () => {
      try {
        const res = await removeCardAction(cardId);
        if (res.success) {
          toast.success("Card deleted from binder");
          setOpen(false);
          
          if (onSuccessRedirectUrl) {
            router.push(onSuccessRedirectUrl);
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to remove card.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerNode} />
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Delete this card?</DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">This card will be removed from your binder. This cannot be undone.</p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <Button 
            variant="destructive" 
            disabled={isPending}
            onClick={handleAction}
            className="w-full"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete from Binder
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
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
