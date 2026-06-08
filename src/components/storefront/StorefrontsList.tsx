import { db } from "@/lib/db";
import { storefronts, listings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { StorefrontsManager } from "./StorefrontsManager";
import { cookies } from "next/headers";

export async function StorefrontsList() {
  const { userId } = await auth();
  if (!userId) return null;

  const userStorefronts = await db.query.storefronts.findMany({
    where: eq(storefronts.userId, userId),
    orderBy: (storefronts, { asc }) => [asc(storefronts.createdAt)]
  });

  // Calculate stats (listings count) per storefront
  const storefrontIds = userStorefronts.map(s => s.id);
  
  let listingsCounts: Record<string, number> = {};
  
  if (storefrontIds.length > 0) {
    const counts = await db.select({
      storefrontId: listings.storefrontId,
      count: sql<number>`count(*)`
    })
    .from(listings)
    .groupBy(listings.storefrontId);
    
    counts.forEach(row => {
      if (row.storefrontId) {
        listingsCounts[row.storefrontId] = Number(row.count);
      }
    });
  }

  const storefrontsData = userStorefronts.map(s => ({
    id: s.id,
    handle: s.handle,
    displayName: s.displayName,
    avatarUrl: s.avatarUrl,
    isDefault: s.isDefaultForUser,
    listingsCount: listingsCounts[s.id] || 0,
  }));

  const cookieStore = await cookies();
  const activeStorefrontId = cookieStore.get("active_storefront_id")?.value || null;

  return (
    <StorefrontsManager 
      initialStorefronts={storefrontsData} 
      activeStorefrontId={activeStorefrontId} 
    />
  );
}
