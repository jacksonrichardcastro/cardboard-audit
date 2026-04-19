"use client";

import { use } from "react";
import { TransparencyLedger, OrderState } from "@/components/shared/transparency-ledger";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Mock fetching the order
const MOCK_ORDER = {
  id: "ord_12345",
  title: "1999 Base Set Charizard Holo - PSA 9",
  priceCents: 155000,
  shippingCents: 500,
  taxCents: 0,
  currentState: "SHIPPED" as OrderState,
  buyerHandle: "@buyer_jackson",
  sellerHandle: "@VanguardVault",
  history: [
    { newState: "PAID", createdAt: "2024-05-10T14:00:00Z", actorId: "buyer1" },
    { newState: "SELLER_RECEIVED", createdAt: "2024-05-11T09:00:00Z", actorId: "seller1" },
    { newState: "PACKAGED", createdAt: "2024-05-11T16:00:00Z", actorId: "seller1" },
    { newState: "SHIPPED", createdAt: "2024-05-12T10:00:00Z", actorId: "seller1", trackingNumber: "1Z9999W99999999999" },
  ]
};

export default function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  // Using React's new `use` hook to correctly unwrap params natively
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.orderId;

  const order = MOCK_ORDER;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none mb-2">Order View</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Order #{orderId}</h1>
          <p className="text-muted-foreground mt-1 text-lg">Purchased from <span className="text-foreground">{order.sellerHandle}</span></p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="text-primary">●</span> Transparency Ledger
            </h2>
            <TransparencyLedger currentState={order.currentState} history={order.history} />
          </section>
        </div>

        <div className="space-y-6 sticky top-8">
          <Card className="bg-card/40 border-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Financials locked on purchase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Item</span>
                <span>${(order.priceCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Shipping</span>
                <span>${(order.shippingCents / 100).toFixed(2)}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>Total</span>
                <span>${((order.priceCents + order.shippingCents) / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-primary">Seller Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button disabled variant="secondary" className="w-full opacity-50 cursor-not-allowed">Mark as Packaged</Button>
              <Button variant="outline" className="w-full border-primary/50 text-white hover:bg-primary/20">Update Tracking Data</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
