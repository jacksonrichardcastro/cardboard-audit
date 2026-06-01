"use server";

import { db } from "@/lib/db";
import { profiles, sellerApprovalQueue } from "@/lib/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { RESERVED_HANDLES } from "@/lib/reserved-handles";
import { syncUserFromClerk } from "@/lib/auth-sync";

export async function saveProfile(data: { handle: string; displayName: string; bio?: string; city?: string; state?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Run the belt-and-suspenders user upsert
  await syncUserFromClerk();

  // Check unique handle
  if (RESERVED_HANDLES.has(data.handle.toLowerCase())) {
    throw new Error("This handle is reserved");
  }

  const existing = await db.select().from(profiles).where(eq(profiles.handle, data.handle)).limit(1);
  if (existing.length > 0 && existing[0].userId !== userId) {
    throw new Error("Handle is already taken");
  }

  await db.insert(profiles)
    .values({
      userId,
      businessName: data.displayName || data.handle,
      handle: data.handle,
      displayName: data.displayName,
      bio: data.bio || null,
      locationCity: data.city || null,
      locationState: data.state || null,
      applicationStatus: 'pending',
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        handle: data.handle,
        displayName: data.displayName,
        bio: data.bio || null,
        locationCity: data.city || null,
        locationState: data.state || null,
      },
    });

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();

  const ALLOWLIST = [
    "superiorparadigm@gmail.com", "hiimwage@gmail.com", "AVIIICollectibles@gmail.com",
    "trey@dealercompassgroup.com", "mattrennick89@gmail.com", "cd3.cards@gmail.com",
    "terrapincards@gmail.com", "Patrick2e65@gmail.com", "hobbychad@proton.me",
    "Essantiago09@att.net", "marty.truax@gmail.com", "madmancardstx@gmail.com",
    "christiangarcia6610@gmail.com", "rabermudez@gmail.com", "rc_magnate@yahoo.com",
    "ckraker27@gmail.com", "gotdemcards@gmail.com", "abjeffcoat@gmail.com",
    "darin.bergmann@gmail.com", "Daniel.C.Sturman@gmail.com", "shuakop@gmail.com",
    "Joeblemaire@gmail.com", "sneakordz@gmail.com", "Junkforcozy@gmail.com",
    "Cris.a.1996@hotmail.com", "nadroj117@gmail.com", "HitMachineSports@Gmail.com",
    "rkgreen19@gmail.com", "raptordelivery1@gmail.com", "Greenescardco@hotmail.com",
    "itsgreeny17@gmail.com", "ShopHPM@gmail.com"
  ].map(e => e.toLowerCase());

  if (email && ALLOWLIST.includes(email)) {
    // Update profile approval status directly
    await db.update(profiles)
      .set({ approvalStatus: "approved" })
      .where(eq(profiles.userId, userId));
      
    // Insert into queue for admin dashboard visibility
    await db.insert(sellerApprovalQueue)
      .values({ sellerId: userId, reviewedAt: new Date() })
      .onConflictDoNothing();
  }
}
