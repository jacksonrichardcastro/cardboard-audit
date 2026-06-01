"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Handshake, AlertCircle } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createOfferAction } from "@/app/actions/offers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MakeOfferButtonProps {
  listingId: number;
  priceCents: number;
  title: string;
}

export function MakeOfferButton({ listingId, priceCents, title }: MakeOfferButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const router = useRouter();

  const handleOfferClick = () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/listings/${listingId}`);
      return;
    }
    setError(null);
    setAmountInput("");
    setMessage("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than $0.");
      setLoading(false);
      return;
    }

    const amountCents = Math.round(parsedAmount * 100);

    if (amountCents >= priceCents) {
      setError("Offer must be less than the Buy Now price.");
      setLoading(false);
      return;
    }

    try {
      const res = await createOfferAction(listingId, amountCents, message);

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setOpen(false);
      setToastMessage("Offer sent successfully!");
      setTimeout(() => setToastMessage(null), 3000);
      
    } catch (err: any) {
      setError("Failed to send offer. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleOfferClick}
        variant="outline"
        size="lg"
        className="w-full text-base sm:text-lg h-12 sm:h-14 font-semibold hover:bg-muted/50 transition-colors border-2 px-2 sm:px-8"
      >
        <Handshake className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" /> 
        <span className="sm:hidden">Offer</span>
        <span className="hidden sm:inline">Make Offer</span>
      </Button>

      {/* Minimal Toast overlay */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg font-medium animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl">Make an Offer</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                You are making an offer on <strong>{title}</strong>. Buy Now price is ${(priceCents / 100).toFixed(2)}.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Offer Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message (Optional)</label>
                <textarea
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Add a friendly note to the seller..."
                />
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
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {loading ? "Sending..." : "Send Offer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
