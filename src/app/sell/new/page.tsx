import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles, users, categories, cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ClientPage from "./client-page";

export default async function NewListingServerPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const isDemo = params.demo === "1";

  const seller = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  if (!seller) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    const isSeller = user?.accountType === "seller" || user?.role === "seller";
    if (!isDemo && !isSeller) {
      redirect("/seller/become");
    }
  }

  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
    orderBy: (c) => [c.displayOrder],
  });

  const userStorefronts = await db.query.storefronts.findMany({
    where: eq(storefronts.userId, userId),
    orderBy: (storefronts, { asc }) => [asc(storefronts.createdAt)]
  });

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const storefrontLayout = user?.storefrontLayout || "grid";

  let initialCard = null;
  const cardIdParam = (params as any).cardId as string | undefined;
  if (cardIdParam) {
    const cardId = parseInt(cardIdParam, 10);
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: {
        photos: true
      }
    });
    if (card && card.ownerId === userId) {
      initialCard = card;
    }
  }

  return <ClientPage categories={userCategories} storefrontLayout={storefrontLayout} initialCard={initialCard} storefronts={userStorefronts} />;
}
