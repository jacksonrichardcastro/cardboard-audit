import { db } from "../src/lib/db";
import { categories, cards, users } from "../src/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

async function testAuthLogic(userId: string, categoryId: number, cardIds: number[]) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId)
  });

  if (!category || category.userId !== userId) {
    throw new Error("403 Forbidden: You do not own this category");
  }

  if (cardIds.length === 0) {
    return { success: true };
  }

  const userCards = await db.query.cards.findMany({
    where: inArray(cards.id, cardIds)
  });

  if (userCards.length !== cardIds.length) {
    throw new Error("403 Forbidden: One or more cards not found or not owned by you");
  }

  for (const card of userCards) {
    if (card.ownerId !== userId) {
      throw new Error("403 Forbidden: You do not own one or more of these cards");
    }
  }
  return { success: true };
}

async function run() {
  const category = await db.query.categories.findFirst();
  if (!category) {
    console.log("No categories found");
    return;
  }
  const myUserId = category.userId;

  const [fakeUser] = await db.insert(users).values({
    id: "hacker_user",
    email: "hacker@test.com",
    accountType: "buyer"
  }).returning();

  const [fakeCard] = await db.insert(cards).values({
    ownerId: fakeUser.id,
    title: "Hacked Card",
    category: "Sports",
    condition: "Near Mint",
  }).returning();

  console.log(`Testing with User A (${myUserId}) and Card owned by User B (hacker_user)`);
  try {
    await testAuthLogic(myUserId, category.id, [fakeCard.id]);
    console.log("FAIL: Action allowed inserting a card owned by someone else.");
  } catch (err: any) {
    console.log("PASS: Blocked cross-user insert. Error:", err.message);
  } finally {
    // cleanup
    await db.delete(cards).where(eq(cards.id, fakeCard.id));
  }
}

run().catch(console.error).finally(() => process.exit(0));
