import { db } from "../lib/db";
import { profiles, users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function upgrade() {
  console.log("Upgrading buyers to sellers...");
  
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
    
  console.log("Upgrade complete.");
  process.exit(0);
}

upgrade().catch(console.error);
