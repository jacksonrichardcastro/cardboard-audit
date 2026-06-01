"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function dismissWelcomeModal() {
  const { userId } = await auth();
  if (!userId) return;
  await db.update(users).set({ welcomeModalDismissed: true }).where(eq(users.id, userId));
  revalidatePath("/");
}
