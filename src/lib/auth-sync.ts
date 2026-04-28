import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";

export async function syncUserFromClerk() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  await db.insert(users)
    .values({
      id: user.id,
      email: email,
      role: "buyer", // default role, or keep existing if conflict
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: email,
      },
    });

  return user.id;
}
