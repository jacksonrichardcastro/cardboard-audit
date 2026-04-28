import { db } from "@/lib/db";
import { sellers, sellerApprovalQueue } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

export default async function AdminSellersPage() {
  const pendingSellers = await db
    .select({
      seller: sellers,
      queue: sellerApprovalQueue,
    })
    .from(sellers)
    .innerJoin(sellerApprovalQueue, eq(sellers.userId, sellerApprovalQueue.sellerId))
    .where(eq(sellers.approvalStatus, "pending_review"))
    .orderBy(sellerApprovalQueue.submittedAt); // default ascending

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Pending Applications</h1>
      
      {pendingSellers.length === 0 ? (
        <div className="text-center py-24 bg-card/30 rounded-xl border border-white/10">
          <p className="text-lg text-muted-foreground">No pending applications. Catch your breath.</p>
        </div>
      ) : (
        <div className="bg-card/50 rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSellers.map(({ seller, queue }) => (
                <TableRow key={seller.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {seller.profilePhotoUrl ? (
                        <img src={seller.profilePhotoUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
                          {(seller.displayName || seller.businessName).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{seller.displayName || seller.businessName}</p>
                        <p className="text-xs text-muted-foreground">@{seller.handle}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{seller.locationCity ? `${seller.locationCity}, ${seller.locationState}` : "—"}</TableCell>
                  <TableCell>{queue.submittedAt ? formatDistanceToNow(queue.submittedAt, { addSuffix: true }) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${seller.kycStatus === 'verified' ? 'bg-green-500' : seller.kycStatus === 'incomplete' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                      <span className="capitalize text-sm">{seller.kycStatus}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/sellers/${seller.userId}`}>
                      <Button variant="outline" size="sm">Review</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
