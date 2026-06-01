"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MapPin, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createCheckoutSessionAction } from "@/app/actions/orders";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BuyNowButtonProps {
  listingId: number;
  price: number;
  title: string;
  photoUrl: string;
  shipsFrom: string;
  shippingEstimate: string;
}

export function BuyNowButton({ listingId, price, title, photoUrl, shipsFrom, shippingEstimate }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const router = useRouter();

  const handleBuyClick = () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/listings/${listingId}`);
      return;
    }
    setError(null);
    setOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createCheckoutSessionAction([listingId]);

      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setError("Network error during checkout initialization. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Primary In-Flow Button */}
      <Button 
        onClick={handleBuyClick}
        size="lg"
        className="w-full text-base sm:text-lg h-12 sm:h-14 font-semibold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform px-2 sm:px-8"
      >
        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" /> 
        <span className="sm:hidden">Buy</span>
        <span className="hidden sm:inline">Buy Now</span>
      </Button>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border/50 z-50 shadow-2xl pb-safe">
        <Button 
          onClick={handleBuyClick}
          size="lg"
          className="w-full text-lg h-12 font-semibold shadow-lg shadow-primary/20"
        >
          {`Buy • $${(price / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Purchase</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex gap-4">
              <div className="w-20 h-28 shrink-0 rounded-md overflow-hidden bg-neutral-900 border border-border/50">
                <img 
                  src={photoUrl} 
                  alt={title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-sm line-clamp-2">{title}</h4>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  ${(price / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex gap-3 text-sm">
              <MapPin className="w-5 h-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Ships from {shipsFrom}</p>
                <p className="text-muted-foreground">{shippingEstimate}</p>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm}
              disabled={loading}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Initializing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
