import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ClientPage from "./client-page";

export default async function NewListingServerPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.userId, userId),
  });

  if (!seller || seller.applicationStatus !== "approved") {
    redirect("/seller/become");
  }

  return <ClientPage />;
}
