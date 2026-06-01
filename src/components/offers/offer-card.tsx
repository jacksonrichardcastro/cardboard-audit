"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Handshake, AlertCircle } from "lucide-react";
import { acceptOfferAction, declineOfferAction, counterOfferAction } from "@/app/actions/offers";
import { useRouter } from "next/navigation";

interface OfferCardProps {
  offer: {
    id: string;
    listingId: number;
    currentAmountCents: number;
    currentMessage: string | null;
    state: string;
    roundsUsed: number;
    lastActorId: string;
    updatedAt: Date;
    listingTitle: string;
    listingPriceCents: number;
    listingThumbnail: string;
    counterpartyHandle: string | null;
    counterpartyName: string | null;
    counterpartyAvatar: string | null;
  };
  currentUserId: string;
  role: "buyer" | "seller";
}

export function OfferCard({ offer, currentUserId, role }: OfferCardProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState<string>("");
  const [counterMessage, setCounterMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isTheirTurn = 
    (offer.state === "pending" || offer.state === "countered") && 
    offer.lastActorId !== currentUserId;

  const handleAccept = async () => {
    setLoadingAction("accept");
    setError(null);
    const res = await acceptOfferAction(offer.id);
    if (res.error) {
      setError(res.error);
    } else {
      setToastMessage("Offer accepted!");
      setTimeout(() => setToastMessage(null), 3000);
      router.refresh();
    }
    setLoadingAction(null);
  };

  const handleDecline = async () => {
    setLoadingAction("decline");
    setError(null);
    const res = await declineOfferAction(offer.id);
    if (res.error) {
      setError(res.error);
    } else {
      setToastMessage("Offer declined.");
      setTimeout(() => setToastMessage(null), 3000);
      router.refresh();
    }
    setLoadingAction(null);
  };

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("counter");
    setError(null);

    const parsedAmount = parseFloat(counterAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than $0.");
      setLoadingAction(null);
      return;
    }

    const amountCents = Math.round(parsedAmount * 100);

    const res = await counterOfferAction(offer.id, amountCents, counterMessage);
    if (res.error) {
      setError(res.error);
      setLoadingAction(null);
    } else {
      setIsCounterModalOpen(false);
      setToastMessage("Counter offer sent!");
      setTimeout(() => setToastMessage(null), 3000);
      router.refresh();
      setLoadingAction(null);
    }
  };

  const renderBadge = () => {
    switch (offer.state) {
      case "pending":
      case "countered":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Awaiting Response</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white">Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      case "expired":
        return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
      default:
        return null;
    }
  };

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="bg-card border rounded-lg p-4 sm:p-6 shadow-sm flex flex-col gap-4 relative">
      {/* Toast overlay */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border">
            <AvatarImage src={offer.counterpartyAvatar || ""} alt={offer.counterpartyName || "User"} />
            <AvatarFallback>{(offer.counterpartyName || "U")[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">
              {offer.counterpartyName || "User"} 
              <span className="text-muted-foreground ml-1 font-normal">
                @{offer.counterpartyHandle || "user"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(offer.updatedAt))} ago
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {renderBadge()}
          <span className="text-xs text-muted-foreground">
            {offer.roundsUsed < 3 ? `Round ${offer.roundsUsed} of 3` : `Round 3 of 3 — Final`}
          </span>
        </div>
      </div>

      {/* Listing Snapshot */}
      <div className="flex gap-4 p-3 bg-muted/50 rounded-md items-center">
        {offer.listingThumbnail ? (
          <img 
            src={offer.listingThumbnail} 
            alt={offer.listingTitle} 
            className="w-12 h-16 object-cover rounded shadow-sm border border-border/50" 
          />
        ) : (
          <div className="w-12 h-16 bg-muted rounded border flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">No Photo</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/listings/${offer.listingId}`} className="font-medium text-sm hover:underline line-clamp-2">
            {offer.listingTitle}
          </Link>
          <div className="text-xs text-muted-foreground mt-1">
            Listed at {formatMoney(offer.listingPriceCents)}
          </div>
        </div>
      </div>

      {/* Offer Details */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">Current Offer</span>
          <span className="text-2xl font-bold">{formatMoney(offer.currentAmountCents)}</span>
        </div>
        {offer.currentMessage && (
          <div className="text-sm bg-muted/30 p-3 rounded-md italic text-muted-foreground border-l-2 border-primary/20">
            "{offer.currentMessage}"
          </div>
        )}
        {error && !isCounterModalOpen && (
          <div className="text-sm text-destructive mt-2">{error}</div>
        )}
      </div>

      {/* Action Area */}
      {isTheirTurn && (
        <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
          <Button 
            onClick={handleAccept} 
            disabled={loadingAction !== null}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1"
          >
            {loadingAction === "accept" ? "Accepting..." : <><Check className="w-4 h-4 mr-1" /> Accept</>}
          </Button>
          
          <Button 
            onClick={() => setIsCounterModalOpen(true)}
            disabled={loadingAction !== null || offer.roundsUsed >= 3}
            variant="outline"
            className="flex-1"
          >
            {loadingAction === "counter" ? "Countering..." : <><Handshake className="w-4 h-4 mr-1" /> Counter</>}
          </Button>
          
          <Button 
            onClick={handleDecline} 
            disabled={loadingAction !== null}
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive flex-none"
          >
            {loadingAction === "decline" ? "..." : <X className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {!isTheirTurn && offer.state === "accepted" && (
        <div className="pt-2 border-t mt-2">
          {role === "seller" ? (
            <div className="text-sm font-medium text-indigo-600 text-center py-2 bg-indigo-50 rounded-md">
              Buyer pending checkout
            </div>
          ) : (
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                setToastMessage("Trax payment infrastructure activates Wednesday. Your accepted offer is locked in — checkout opens with full payment verification Wednesday morning.");
                setTimeout(() => setToastMessage(null), 5000);
              }}
            >
              Accepted — proceed to checkout
            </Button>
          )}
        </div>
      )}

      {/* Counter Modal */}
      <Dialog open={isCounterModalOpen} onOpenChange={setIsCounterModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCounterSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl">Counter Offer</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                You are countering an offer of {formatMoney(offer.currentAmountCents)}. 
                This will be Round {offer.roundsUsed + 1} of 3.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Counter Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message (Optional)</label>
                <textarea
                  maxLength={1000}
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  placeholder="Explain your counter offer..."
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
                onClick={() => setIsCounterModalOpen(false)}
                disabled={loadingAction === "counter"}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loadingAction === "counter"}
                className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {loadingAction === "counter" ? "Sending..." : "Send Counter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
