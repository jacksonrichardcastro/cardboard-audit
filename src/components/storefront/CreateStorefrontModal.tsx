"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createStorefrontAction } from "@/app/actions/storefronts";
import { useRouter } from "next/navigation";

export function CreateStorefrontModal({ 
  open, 
  onOpenChange,
  onCreated
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      toast.error("Handle is required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await createStorefrontAction(handle, displayName || undefined);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Storefront created successfully!");
        setHandle("");
        setDisplayName("");
        onCreated();
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Failed to create storefront");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Storefront</DialogTitle>
          <DialogDescription>
            Create a new storefront to organize your listings under a different handle and brand.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="handle">Handle (URL)</Label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted-foreground text-sm">trax.cards/</span>
              <Input 
                id="handle" 
                value={handle} 
                onChange={(e) => setHandle(e.target.value.toLowerCase())} 
                placeholder="your-new-shop" 
                className="pl-[84px]"
                maxLength={30}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Only lowercase letters, numbers, and hyphens.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (Optional)</Label>
            <Input 
              id="displayName" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              placeholder="Your New Shop" 
              maxLength={100}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700">
              {isLoading ? "Creating..." : "Create Storefront"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
