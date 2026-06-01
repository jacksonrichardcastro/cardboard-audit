import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  await db.update(profiles)
    .set({
      accountType: "seller",
      kycStatus: "verified",
      applicationStatus: "approved",
      approvalStatus: "approved"
    })
    .where(eq(profiles.accountType, "buyer"));
    
  await db.update(users)
    .set({
      role: "seller",
      accountType: "seller"
    })
    .where(eq(users.role, "buyer"));
    
  return NextResponse.json({ success: true });
}
