"use server";

import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { RESERVED_HANDLES } from "@/lib/reserved-handles";

export async function saveProfile(data: { handle: string; displayName: string; bio?: string; city?: string; state?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Check unique handle
  if (RESERVED_HANDLES.has(data.handle.toLowerCase())) {
    throw new Error("This handle is reserved");
  }

  const existing = await db.select().from(sellers).where(eq(sellers.handle, data.handle)).limit(1);
  if (existing.length > 0 && existing[0].userId !== userId) {
    throw new Error("Handle is already taken");
  }

  await db.update(sellers).set({
    handle: data.handle,
    displayName: data.displayName,
    bio: data.bio || null,
    locationCity: data.city || null,
    locationState: data.state || null,
  }).where(eq(sellers.userId, userId));
}
