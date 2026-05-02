import { getBuyerOrders } from "@/app/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Package, Truck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function getStatusBadge(status: string) {
  switch (status) {
    case "PAID":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Secured In Escrow</Badge>;
    case "SHIPPED":
    case "IN_TRANSIT":
      return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30"><Truck className="w-3 h-3 mr-1 inline" /> In Transit</Badge>;
    case "DELIVERED":
    case "BUYER_CONFIRMED":
      return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Complete</Badge>;
    case "DISPUTED":
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1 inline" /> Disputed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

type OrderRecord = {
  id: number;
  currentState: string;
  totalCents: number;
  createdAt: Date;
  listingTitle: string;
  listingImage: string[] | null;
  sellerName: string;
};

export default async function BuyerOrdersPage() {
  const orders = await getBuyerOrders();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Vault</h1>
        <p className="text-muted-foreground mt-1">Track your active purchases and secured inventory.</p>
      </div>

      <Card className="bg-card/40 border-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order History
          </CardTitle>
          <CardDescription>All purchases are strictly protected by our Transparency Ledger.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              You haven&apos;t purchased any holy grails yet.
              <br />
              <Button asChild variant="outline" className="mt-4 border-white/10 hover:bg-white/5">
                <Link href="/">
                  Browse Storefront
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: OrderRecord) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={order.listingImage?.[0] || 'https://placehold.co/100x140'} 
                          alt="Thumbnail" 
                          className="w-12 h-16 object-cover rounded-md border border-white/10" 
                        />
                        <span className="font-semibold">{order.listingTitle}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.sellerName}</TableCell>
                    <TableCell className="text-muted-foreground">
                       {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      ${(order.totalCents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.currentState)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                        <Link href={`/orders/${order.id}`}>
                          View Ledger
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
