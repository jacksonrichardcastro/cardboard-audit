"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createStripeConnectAccount } from "./actions";

export default function StripeOnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = await createStripeConnectAccount();
      window.location.href = url;
    } catch (e: any) {
      setError(e.message || "Failed to connect Stripe");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl text-center min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Verify your identity</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-lg">
        Trax uses Stripe to verify your identity and send your payouts securely. 
        You'll need a government ID and your bank account details.
      </p>
      
      {error && <div className="p-4 mb-6 bg-red-500/20 text-red-400 rounded">{error}</div>}

      <Button size="lg" className="px-12 bg-indigo-600 hover:bg-indigo-700" onClick={handleConnect} disabled={loading}>
        {loading ? "Connecting..." : "Verify with Stripe"}
      </Button>
      
      <p className="mt-6 text-xs text-muted-foreground">
        Trax does not store your sensitive financial information.
      </p>
    </div>
  );
}
