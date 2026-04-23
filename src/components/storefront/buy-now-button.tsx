"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { createCheckoutSessionAction } from "@/app/actions/orders";

export function BuyNowButton({ listingId, price }: { listingId: number, price: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await createCheckoutSessionAction([listingId]);

      if (res.error) {
        alert(res.error);
        return;
      }

      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert("Network error during checkout initialization. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Primary In-Flow Button */}
      <Button 
        onClick={handleBuy}
        disabled={loading}
        size="lg"
        className="w-full text-lg h-14 font-semibold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
      >
        <ShoppingCart className="w-5 h-5 mr-2" /> 
        {loading ? "Initializing..." : "Buy Now"}
      </Button>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border/50 z-50 shadow-2xl pb-safe">
        <Button 
          onClick={handleBuy}
          disabled={loading}
          size="lg"
          className="w-full text-lg h-12 font-semibold shadow-lg shadow-primary/20"
        >
          {loading ? "Initializing..." : `Buy Now • $${(price / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </Button>
      </div>
    </>
  );
}
