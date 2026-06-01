import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
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
    redirect("/seller/become");
  }

  redirect("/sell/new");
}
