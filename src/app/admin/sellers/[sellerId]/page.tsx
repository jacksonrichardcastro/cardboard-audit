import { db } from "@/lib/db";
import { sellers, sellerApprovalQueue } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { stripe } from "@/lib/stripe";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { approveSellerAction, rejectSellerAction } from "../actions";

export default async function SellerReviewPage(props: { params: Promise<{ sellerId: string }> }) {
  const params = await props.params;
  const sellerId = params.sellerId;

  const [seller] = await db.select().from(sellers).where(eq(sellers.userId, sellerId)).limit(1);
  if (!seller) return notFound();

  const [queueEntry] = await db.select().from(sellerApprovalQueue).where(eq(sellerApprovalQueue.sellerId, sellerId)).limit(1);
  const client = await clerkClient();
  const user = await client.users.getUser(sellerId);
  const email = user.emailAddresses[0]?.emailAddress;

  let stripeLink = null;
  if (seller.stripeConnectAccountId) {
    try {
      const loginLink = await stripe.accounts.createLoginLink(seller.stripeConnectAccountId);
      stripeLink = loginLink.url;
    } catch (e) {
      // Ignore if account isn't valid for login link yet
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/sellers" className="text-violet-400 hover:underline">&larr; Back to Queue</Link>
      </div>
      <div className="flex items-start gap-6 bg-card/50 p-8 rounded-xl border border-white/10 mb-8">
        {seller.profilePhotoUrl ? (
          <img src={seller.profilePhotoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold">
            {(seller.displayName || seller.businessName).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{seller.displayName || seller.businessName}</h1>
            <p className="text-muted-foreground">@{seller.handle}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Email</p>
            <p>{email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Location</p>
            <p>{seller.locationCity ? `${seller.locationCity}, ${seller.locationState}` : "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Bio</p>
            <p>{seller.bio || "—"}</p>
          </div>
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Submitted</p>
              <p>{queueEntry?.submittedAt?.toLocaleString() || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">KYC Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${seller.kycStatus === 'verified' ? 'bg-green-500' : seller.kycStatus === 'incomplete' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                <span className="capitalize">{seller.kycStatus}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">TOS Accepted</p>
              <p>{seller.tosAcceptedAt ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Stripe Dashboard</p>
              {stripeLink ? (
                <a href={stripeLink} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">View in Stripe</a>
              ) : (
                <p>—</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-card/30 p-6 rounded-xl border border-white/10">
        <h2 className="text-lg font-semibold">Decide</h2>
        <form action={async () => {
          "use server";
          await approveSellerAction(sellerId);
        }}>
          <Button className="w-full bg-violet-600 hover:bg-violet-700">Approve Seller</Button>
        </form>
        
        <form action={async (formData: FormData) => {
          "use server";
          const reason = formData.get("reason") as string;
          await rejectSellerAction(sellerId, reason);
        }} className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-3">
          <label className="text-sm font-medium text-red-400">Reject Seller</label>
          <textarea 
            name="reason" 
            placeholder="Reason for rejection (will be shown to the seller)" 
            className="w-full bg-black/50 border border-white/10 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[100px]"
            required
          />
          <Button variant="destructive" className="w-full" type="submit">Reject</Button>
        </form>
      </div>
    </div>
  );
}
