"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { bulkMoveListingsAction } from "@/app/actions/listings";

export function BulkMoveListingsModal({
  isOpen,
  setIsOpen,
  selectedListingIds,
  userStorefronts,
  currentStorefrontId,
  onSuccess
}: {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  selectedListingIds: number[];
  userStorefronts: any[];
  currentStorefrontId: string | number;
  onSuccess: () => void;
}) {
  const [targetStorefrontId, setTargetStorefrontId] = useState("");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [isPending, startTransition] = useTransition();

  const otherStorefronts = userStorefronts.filter(s => String(s.id) !== String(currentStorefrontId));
  const targetStorefront = otherStorefronts.find(s => String(s.id) === targetStorefrontId);
  const targetCategories = targetStorefront?.categories || [];

  const handleMove = () => {
    if (!targetStorefrontId) return;
    startTransition(async () => {
      try {
        const res = await bulkMoveListingsAction(selectedListingIds, targetStorefrontId, targetCategoryId || undefined);
        if (res.error) {
          alert(res.error);
        } else {
          setIsOpen(false);
          onSuccess();
        }
      } catch (err: any) {
        alert(err.message || "Failed to move listings");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {selectedListingIds.length} Listings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-zinc-400">
            These {selectedListingIds.length} cards will move off <strong>{userStorefronts.find(s => String(s.id) === String(currentStorefrontId))?.displayName || `@${userStorefronts.find(s => String(s.id) === String(currentStorefrontId))?.handle}` || "this storefront"}</strong> and onto <strong>{targetStorefront ? (targetStorefront.displayName || `@${targetStorefront.handle}`) : "the selected storefront"}</strong>.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Storefront</label>
            <select 
              value={targetStorefrontId}
              onChange={e => {
                setTargetStorefrontId(e.target.value);
                setTargetCategoryId("");
              }}
              className="w-full h-10 px-3 bg-background border rounded-md"
            >
              <option value="">Select a storefront...</option>
              {otherStorefronts.map(s => (
                <option key={s.id} value={s.id}>{s.displayName || `@${s.handle}`}</option>
              ))}
            </select>
          </div>
          {targetStorefrontId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Category (Optional)</label>
              <select 
                value={targetCategoryId}
                onChange={e => setTargetCategoryId(e.target.value)}
                className="w-full h-10 px-3 bg-background border rounded-md"
              >
                <option value="">Leave Uncategorized</option>
                {targetCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleMove} disabled={!targetStorefrontId || isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Move Listings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
