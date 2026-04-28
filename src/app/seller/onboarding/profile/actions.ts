"use server";

import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
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

  const existing = await db.select().from(sellers).where(eq(sellers.handle, data.handle)).limit(1);
  if (existing.length > 0 && existing[0].userId !== userId) {
    throw new Error("Handle is already taken");
  }

  await db.insert(sellers)
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
      target: sellers.userId,
      set: {
        handle: data.handle,
        displayName: data.displayName,
        bio: data.bio || null,
        locationCity: data.city || null,
        locationState: data.state || null,
      },
    });
}
