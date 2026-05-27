import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ClientPage from "./client-page";

export default async function NewListingServerPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  if (!seller || seller.applicationStatus !== "approved") {
    redirect("/seller/become");
  }

  return <ClientPage />;
}
