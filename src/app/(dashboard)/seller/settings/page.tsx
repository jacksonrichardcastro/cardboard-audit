"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Banknote, Store } from "lucide-react";

export default function SellerSettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleConnectBank = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch(e) {
      console.error(e);
      alert("Failed to connect bank at this time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-700 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seller Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your storefront and payout integrations.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-card/40 border-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-500" />
              Payout Configuration
            </CardTitle>
            <CardDescription>
              Connect your bank account via Stripe to receive automatic escrow payouts when buyers confirm delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm">
              <ShieldCheck className="w-5 h-5 inline-block mr-2 text-primary" />
              <span className="font-medium text-primary">Stripe handles your tax forms.</span> CardBound does not hold your full funds.
            </div>
            
            <Button 
              onClick={handleConnectBank} 
              disabled={loading}
              className="w-full text-lg h-12 shadow-xl shadow-primary/20 border border-white/10"
            >
              {loading ? "Connecting..." : "Connect Bank Account"}
            </Button>
          </CardContent>
        </Card>

        {/* Placeholder for future settings */}
        <Card className="bg-card/40 border-white/5 backdrop-blur-xl opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Store Profile
            </CardTitle>
            <CardDescription>Update your public banner and return policy constraints.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button variant="outline" disabled className="w-full">Coming Soon</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
