import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-black/95 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-white/10 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl">Stripe Checkout Simulation</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            In production, this routes to a secure Stripe Elements payload generating separate sub-transfers for all vendors in your cart via distinct PaymentIntents or destination charges.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 mt-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary/90 text-center">
            Total to pay: <strong>$2,160.00</strong>
          </div>
          
          <div className="space-y-4 opacity-50 pointer-events-none">
            <div className="space-y-2">
              <Label>Card Information</Label>
              <Input placeholder="4242 4242 4242 4242" className="bg-black/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry</Label>
                <Input placeholder="MM/YY" className="bg-black/50" />
              </div>
              <div className="space-y-2">
                <Label>CVC</Label>
                <Input placeholder="123" className="bg-black/50" />
              </div>
            </div>
          </div>

          <Button className="w-full h-12 text-lg cursor-not-allowed">
            Pay $2,160.00
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
