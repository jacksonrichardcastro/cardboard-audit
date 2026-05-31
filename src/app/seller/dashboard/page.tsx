import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditProfileForm } from "@/app/edit-profile/EditProfileForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SellerDashboardPage() {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in?redirect_url=/seller/dashboard");

  const [seller] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  if (!seller) {
    // If no profile exists at all, force them to onboarding
    return redirect("/seller/onboarding/profile");
  }

  // Pre-KYC is allowed here now.

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Seller Dashboard
        </h1>
        {seller.handle && (
          <Button asChild variant="outline">
            <Link href={`/${seller.handle}`}>View Storefront</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="mb-8 overflow-x-auto w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0">
          <TabsTrigger 
            value="settings" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none px-4 py-2"
          >
            Settings
          </TabsTrigger>
          <TabsTrigger 
            value="listings" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none px-4 py-2"
          >
            Listings
          </TabsTrigger>
          <TabsTrigger 
            value="offers" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none px-4 py-2"
          >
            Offers
          </TabsTrigger>
          <TabsTrigger 
            value="sales" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none px-4 py-2"
          >
            Sales History
          </TabsTrigger>
          <TabsTrigger 
            value="payouts" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none px-4 py-2"
          >
            Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-6">Storefront Profile</h2>
            <EditProfileForm 
              initialData={{
                bio: seller.bio,
                locationCity: seller.locationCity,
                profilePhotoUrl: seller.profilePhotoUrl,
                headerStyle: seller.headerStyle,
                bannerImageUrl: seller.bannerImageUrl,
                presenceStatus: seller.presenceStatus || "online",
              }} 
            />
          </div>
        </TabsContent>

        <TabsContent value="listings">
          <div className="text-center py-24 bg-card/50 border border-white/10 rounded-xl">
            <p className="text-zinc-500">Listings management coming soon.</p>
            <Button asChild className="mt-4 bg-violet-600 hover:bg-violet-700">
              <Link href="/sell/new">Create New Listing</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="offers">
          <div className="text-center py-24 bg-card/50 border border-white/10 rounded-xl">
            <p className="text-zinc-500">Manage all your active offers.</p>
            <Button asChild className="mt-4 bg-violet-600 hover:bg-violet-700">
              <Link href="/offers">View Offers Hub</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="text-center py-24 bg-card/50 border border-white/10 rounded-xl">
            <p className="text-zinc-500">Sales history coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="payouts">
          <div className="text-center py-24 bg-card/50 border border-white/10 rounded-xl">
            <p className="text-zinc-500">Payout management coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
