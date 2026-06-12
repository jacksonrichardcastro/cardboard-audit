import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import EditListingClient from "./client-page";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { id: paramId } = await params;
  const id = parseInt(paramId);
  if (isNaN(id)) return notFound();

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
    with: {
      card: {
        with: {
          photos: true
        }
      },
    },
  });

  if (!listing) return notFound();
  
  if (listing.sellerId !== userId) {
    redirect(`/listings/${id}`); // redirect non-owners back to public view
  }

  const { profiles, users, categories, categoryMemberships, storefronts } = await import("@/lib/db/schema");
  const sellerProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
    orderBy: (c) => [c.displayOrder],
  });

  const cardMemberships = await db.query.categoryMemberships.findMany({
    where: eq(categoryMemberships.cardId, listing.cardId),
  });

  const userStorefronts = await db.query.storefronts.findMany({
    where: eq(storefronts.userId, userId),
    orderBy: (storefronts, { asc }) => [asc(storefronts.createdAt)]
  });

  const autoManagedCatIds = userCategories.filter(c => c.isAutoManaged).map(c => c.id);

  return <EditListingClient 
    listing={listing} 
    card={listing.card} 
    handle={sellerProfile?.handle ?? undefined} 
    categories={userCategories}
    storefrontLayout={user?.storefrontLayout || "grid"}
    cardMemberships={cardMemberships}
    storefronts={userStorefronts}
    autoManagedCatIds={autoManagedCatIds}
  />;
}
