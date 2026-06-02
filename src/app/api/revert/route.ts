import { db } from "@/lib/db";
import { listings, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await db.query.users.findFirst({
    where: eq(users.email, 'junkforcozy@gmail.com')
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await db.update(listings)
    .set({ status: 'pending_marketplace_activation' })
    .where(and(
      eq(listings.sellerId, user.id),
      eq(listings.status, 'active')
    ));

  return NextResponse.json({ success: true, userId: user.id });
}
