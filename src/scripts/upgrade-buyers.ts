import { db } from "../lib/db";
import { profiles, users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function upgrade() {
  console.log("Upgrading buyers to sellers...");
  
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
    
  console.log("Upgrade complete.");
  process.exit(0);
}

upgrade().catch(console.error);
