import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Lock } from "lucide-react";

export default function CartPage() {
  const mockCartItem = {
    title: "1999 Base Set Charizard Holo - PSA 9",
    priceCents: 155000,
    shippingCents: 500,
    seller: "Vanguard Vault",
    image: "https://placehold.co/200x280/111/444?text=Charizard"
  };

  const totalCents = mockCartItem.priceCents + mockCartItem.shippingCents;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-[80vh] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Secure Checkout</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Review Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mockCartItem.image} alt="Cart item" className="w-24 h-32 object-cover rounded-lg border border-white/10" />
                <div className="space-y-2 flex-grow">
                  <h3 className="font-semibold text-lg">{mockCartItem.title}</h3>
                  <p className="text-sm text-muted-foreground">Sold by <span className="text-primary">{mockCartItem.seller}</span></p>
                  <p className="font-bold text-xl pt-2">${(mockCartItem.priceCents / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 sticky top-8">
          <Card className="bg-card/60 border-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Subtotal</span>
                <span className="text-foreground">${(mockCartItem.priceCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Shipping (Flat Rate)</span>
                <span className="text-foreground">${(mockCartItem.shippingCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Taxes</span>
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
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Encrypted strictly via Stripe test mode</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
