import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOffersReceived, getOffersMade } from "@/lib/db/queries/offers";
import { OfferCard } from "@/components/offers/offer-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "Offers | Trax Marketplace",
  description: "Manage your received and made offers on Trax.",
};

export default async function OffersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [receivedOffers, madeOffers] = await Promise.all([
    getOffersReceived(userId),
    getOffersMade(userId),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Offers</h1>
        <p className="text-muted-foreground mt-2">
          Manage your incoming and outgoing offers.
        </p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received">
            Offers Received ({receivedOffers.length})
          </TabsTrigger>
          <TabsTrigger value="made">
            Offers Made ({madeOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedOffers.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <h3 className="text-lg font-medium text-foreground">No offers received yet</h3>
              <p className="text-muted-foreground mt-1">When buyers make offers on your listings, they'll appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {receivedOffers.map((offer: any) => (
                <OfferCard 
                  key={offer.id} 
                  offer={offer} 
                  currentUserId={userId} 
                  role="seller" 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="made" className="space-y-4">
          {madeOffers.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <h3 className="text-lg font-medium text-foreground">No offers made yet</h3>
              <p className="text-muted-foreground mt-1">When you make offers on listings, you can track them here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {madeOffers.map((offer: any) => (
                <OfferCard 
                  key={offer.id} 
                  offer={offer} 
                  currentUserId={userId} 
                  role="buyer" 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
