"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { removeCardFromHeaderAction } from "@/app/actions/profile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function RemoveFromHeaderButton({ cardId }: { cardId: number }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleRemove = async () => {
    startTransition(async () => {
      try {
        const res = await removeCardFromHeaderAction(cardId);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Removed from your header");
          setOpen(false);
        }
      } catch (err) {
        toast.error("Failed to remove from header");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
        <X className="w-4 h-4 mr-2" />
        Remove from Header
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from header?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            This card will no longer appear in your profile header. You can re-add it anytime from your Customize Header drawer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="bg-transparent border-white/20 hover:bg-white/5 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleRemove();
            }}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED]/90 focus-visible:outline-none disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Remove from header
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
