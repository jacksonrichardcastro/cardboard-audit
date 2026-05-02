import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

export default async function SellerDashboardPage() {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in?redirect_url=/seller/dashboard");

  const [seller] = await db.select().from(sellers).where(eq(sellers.userId, userId)).limit(1);

  if (!seller || seller.approvalStatus === "unsubmitted") {
    return redirect("/seller/become");
  }

  if (seller.approvalStatus === "pending_review") {
    return redirect("/seller/onboarding/pending");
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Welcome to your store, {seller.displayName || seller.businessName}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Create a Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Add new inventory to your store.</p>
            <Button asChild className="w-full bg-violet-600 hover:bg-violet-700">
              <Link href="/sell/new">New Listing</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>View my store</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">See how buyers view your listings.</p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/store/${seller.handle}`}>Storefront</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Manage payouts and profile.</p>
            {seller.stripeConnectAccountId && (
              <a href={`https://dashboard.stripe.com/`} target="_blank" rel="noreferrer" className="block text-sm text-violet-400 hover:text-violet-300 mb-4 truncate">
                Stripe Dashboard ({seller.stripeConnectAccountId})
              </a>
            )}
            <Button variant="secondary" className="w-full" disabled>Settings (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
