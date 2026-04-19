import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Lock, Store } from "lucide-react";

export default function CartPage() {
  const mockCartItems = [
    {
      id: "1",
      title: "1999 Base Set Charizard Holo - PSA 9",
      priceCents: 155000,
      seller: "Vanguard Vault",
      image: "https://placehold.co/200x280/111/444?text=Charizard"
    },
    {
      id: "4",
      title: "Shohei Ohtani Bowman Chrome - PSA 10",
      priceCents: 60000,
      seller: "Retro Breaks",
      image: "https://placehold.co/200x280/111/444?text=Ohtani"
    }
  ];

  // Group items by seller for UI
  const groupedBySeller = mockCartItems.reduce((acc, item) => {
    if (!acc[item.seller]) acc[item.seller] = [];
    acc[item.seller].push(item);
    return acc;
  }, {} as Record<string, typeof mockCartItems>);

  const FLAT_SHIPPING_CENTS_PER_SELLER = 500;
  const sellerCount = Object.keys(groupedBySeller).length;
  
  const subtotalCents = mockCartItems.reduce((sum, item) => sum + item.priceCents, 0);
  const totalShippingCents = sellerCount * FLAT_SHIPPING_CENTS_PER_SELLER;
  const totalCents = subtotalCents + totalShippingCents;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-[80vh] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Secure Checkout</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {Object.entries(groupedBySeller).map(([sellerName, items]) => (
            <Card key={sellerName} className="bg-black/40 border-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-white/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="w-5 h-5 text-primary" />
                  Package from {sellerName}
                </CardTitle>
                <CardDescription>Escrow protects these items until delivery.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-6 items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.title} className="w-20 h-28 object-cover rounded-lg border border-white/10" />
                    <div className="space-y-1 flex-grow">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="font-bold text-lg text-primary pt-1">${(item.priceCents / 100).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6 sticky top-8">
          <Card className="bg-card/60 border-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Multi-vendor cart checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Subtotal ({mockCartItems.length} items)</span>
                <span className="text-foreground">${(subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Shipping ({sellerCount} separate packages)</span>
                <span className="text-foreground">${(totalShippingCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Estimated Taxes</span>
                <span className="text-foreground">Calculated next</span>
              </div>
              
              <Separator className="bg-white/10" />
              
              <div className="flex justify-between text-2xl font-bold text-primary">
                <span>Total</span>
                <span>${(totalCents / 100).toFixed(2)}</span>
              </div>

              <Link href="/checkout" className="block pt-4">
                <Button className="w-full h-12 text-lg shadow-xl shadow-primary/20">
                  <Lock className="w-4 h-4 mr-2" /> Proceed to Pay
                </Button>
              </Link>
              
              <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="leading-tight">A single charge handles Stripe Connect transfers to {sellerCount} separate vendors automatically.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
