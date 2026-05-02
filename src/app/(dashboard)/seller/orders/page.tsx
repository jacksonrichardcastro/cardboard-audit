import { getSellerOrders } from "@/app/actions/seller";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Ticket, Truck, AlertCircle, Inbox } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function getFulfillmentBadge(status: string) {
  switch (status) {
    case "PAID":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Action Required: Ship Item</Badge>;
    case "SHIPPED":
    case "IN_TRANSIT":
      return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30"><Truck className="w-3 h-3 mr-1 inline" /> Handled by Carrier</Badge>;
    case "DELIVERED":
    case "BUYER_CONFIRMED":
      return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Cleared for Payout</Badge>;
    case "DISPUTED":
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1 inline" /> Dispute Active</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

type SoldOrderRecord = {
  id: number;
  buyerName: string;
  buyerEmail: string;
  listingTitle: string;
  createdAt: Date;
  totalCents: number;
  shippingCents: number;
  feeCents: number;
  currentState: string;
};

export default async function SellerFulfillmentQueue() {
  const orders = await getSellerOrders();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Fulfillment Center</h1>
        <p className="text-muted-foreground mt-1">Manage outbound packages and track Escrow payout timelines.</p>
      </div>

      <Card className="bg-card/40 border-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            Sold Orders Queue
          </CardTitle>
          <CardDescription>Payouts automatically sweep to your connected bank once carrier APIs register delivery.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              You have no active orders queued for fulfillment.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Date Sold</TableHead>
                  <TableHead>Net Payout</TableHead>
                  <TableHead>Fulfillment Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: SoldOrderRecord) => {
                  const netPayoutCents = (order.totalCents - order.shippingCents) - order.feeCents;
                  return (
                    <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">#{order.id}</TableCell>
                      <TableCell>
                        <p className="font-semibold">{order.buyerName}</p>
                        <p className="text-xs text-muted-foreground">{order.buyerEmail}</p>
                      </TableCell>
                      <TableCell className="font-medium">{order.listingTitle}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-400">
                        ${(netPayoutCents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getFulfillmentBadge(order.currentState)}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.currentState === "PAID" ? (
                          <Button size="sm" className="shadow-lg shadow-primary/20">
                            <Ticket className="w-4 h-4 mr-2" /> Buy Label
                          </Button>
                        ) : (
                          <Button asChild variant="outline" size="sm" className="border-white/10">
                            <Link href={`/orders/${order.id}`}>
                              View Ledger
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
