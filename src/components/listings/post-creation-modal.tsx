"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PostCreationModal({ sellerHandle }: { sellerHandle: string | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setOpen(true);
      // Remove query param without triggering navigation
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("created");
      const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, pathname]);

  const handleDismiss = () => {
    setOpen(false);
  };

  const handleNewListing = () => {
    router.push("/sell/new");
  };

  const handleViewStorefront = () => {
    if (sellerHandle) {
      router.push(`/${sellerHandle}`);
    } else {
      router.push("/seller/dashboard?tab=listings");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-black/95 border-[#7C3AED]/30 text-white shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">Listing live</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Button 
            className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white" 
            onClick={handleNewListing}
            autoFocus
          >
            New Listing
          </Button>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto border-[#7C3AED]/50 bg-transparent text-white hover:bg-[#7C3AED]/10" 
            onClick={handleDismiss}
          >
            View Listing
          </Button>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto border-[#7C3AED]/50 bg-transparent text-white hover:bg-[#7C3AED]/10" 
            onClick={handleViewStorefront}
          >
            View Storefront
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
