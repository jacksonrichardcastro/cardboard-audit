import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
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

  if (!seller || seller.applicationStatus !== "approved") {
    if (!isDemo) {
      redirect("/seller/become");
    }
  }

  return <ClientPage />;
}
