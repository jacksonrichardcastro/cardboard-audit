import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import EditListingClient from "./client-page";

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const id = parseInt(params.id);
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

  return <EditListingClient listing={listing} card={listing.card} />;
}
