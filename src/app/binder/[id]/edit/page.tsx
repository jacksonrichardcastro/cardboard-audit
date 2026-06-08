import { db } from "@/lib/db";
import { cards, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import EditBinderClient from "./client-page";

export default async function EditBinderPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { id: paramId } = await params;
  const id = parseInt(paramId);
  if (isNaN(id)) return notFound();

  const card = await db.query.cards.findFirst({
    where: eq(cards.id, id),
    with: {
      photos: true,
      listings: true, // Needed to check if tied to an active listing
      categoryMemberships: true,
      owner: {
        with: {
          profile: true
        }
      }
    },
  });

  if (!card) return notFound();
  
  if (card.ownerId !== userId) {
    // redirect non-owners back to public view of owner's binder
    redirect(`/${card.owner?.profile?.handle || ''}?tab=binder`); 
  }

  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
    orderBy: (categories, { asc }) => [asc(categories.displayOrder)]
  });

  return <EditBinderClient card={card} categories={userCategories} />;
}
