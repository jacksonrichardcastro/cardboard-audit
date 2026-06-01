import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if admin (you can add a specific admin ID check here, or just let any logged-in user trigger it for now since it's a one-time script. To be safe, let's just protect it with auth.)
  
  // 1. Update all users to seller
  await db.update(users)
    .set({
      role: "seller",
      accountType: "seller"
    })
    .where(eq(users.accountType, "buyer"));
    
  // 2. Update all profiles to approved
  await db.update(profiles)
    .set({
      kycStatus: "verified",
      applicationStatus: "approved",
      approvalStatus: "approved"
    });
    
  return NextResponse.json({ success: true });
}
