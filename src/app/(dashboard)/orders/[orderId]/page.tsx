import { TransparencyLedger } from "@/components/shared/transparency-ledger";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrderWithLedger } from "@/app/actions/orders";
import { notFound } from "next/navigation";

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const parsedId = parseInt(orderId, 10);

  if (isNaN(parsedId)) return notFound();

  const order = await getOrderWithLedger(parsedId);
  if (!order) return notFound();

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none mb-2">Order View</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Order #{order.id}</h1>
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
              {order.taxCents > 0 && (
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${(order.taxCents / 100).toFixed(2)}</span>
                </div>
              )}
              <Separator className="bg-white/10" />
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>Total</span>
                <span>${((order.priceCents + order.shippingCents + order.taxCents) / 100).toFixed(2)}</span>
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
