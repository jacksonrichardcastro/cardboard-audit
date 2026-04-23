import { getSellerInventory } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PackageSearch, Plus, Eye, Edit3 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type InventoryItem = {
  id: number;
  title: string;
  category: string;
  condition: string;
  priceCents: number;
  createdAt: Date;
};

export default async function SellerInventoryPage() {
  const inventory = await getSellerInventory();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your storefront listings and optimize pricing.</p>
        </div>
        <Link href="/seller/listings/new">
          <Button className="h-12 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" /> Create New Listing
          </Button>
        </Link>
      </div>

      <Card className="bg-card/40 border-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-primary" />
            Product Catalog
          </CardTitle>
          <CardDescription>All items currently active in the CardBound algorithm.</CardDescription>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              You have no active listings on the market.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Card Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Listed Price</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item: InventoryItem) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-semibold">{item.title}</TableCell>
                    <TableCell><Badge variant="outline" className="border-white/10">{item.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{item.condition}</TableCell>
                    <TableCell className="font-bold text-primary">${(item.priceCents / 100).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">
                       {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/listing/${item.id}`}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white mr-2">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="border-white/10">
                        <Edit3 className="w-4 h-4 mr-1.5" /> Edit
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
