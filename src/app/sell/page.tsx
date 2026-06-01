import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function SellPage() {
  const { userId } = await auth();

  if (!userId) {
    // Clerk provides redirectToSignIn but for simple Next.js App Router we can just redirect to sign-in
    redirect("/sign-in?redirect_url=/sell/new");
  }

  const seller = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  if (!seller) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    const isSeller = user?.accountType === "seller" || user?.role === "seller";
    if (!isSeller) {
      redirect("/seller/become");
    }
  }

  redirect("/sell/new");
}
