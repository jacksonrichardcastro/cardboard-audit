"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner is used for toasts, if not I'll just use a generic alert/fallback UI or check nextjs hot toast. Wait, the project doesn't specify. I'll just use simple state.

export function BuyNowButton({ listingId, price }: { listingId: number, price: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: [listingId] }),
      });

      if (!res.ok) {
        // Handle mock data discrepancy securely
        if (res.status === 404) {
          alert("Prototype Mode: The checkout flow requires a verified backend connection. The mock listing does not exist in the live database.");
        } else {
          alert("Checkout initialization failed.");
        }
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      alert("Network error during checkout initialization.");
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
