import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
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

  return <ClientPage />;
}
