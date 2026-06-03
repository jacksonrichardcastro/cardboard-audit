import { describe, it, expect, vi, beforeAll } from "vitest";
import { db, withUserContext } from "@/lib/db";
import { users, cards, listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Mock Next.js dependencies before importing the action
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
// Also mock Supabase client creation since edit-listing uses it
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        remove: vi.fn().mockResolvedValue({ error: null })
      })
    }
  })
}));

import { auth } from "@clerk/nextjs/server";
import { removeListingAction } from "@/app/actions/edit-listing";

describe("Directive 13: removeListingAction", () => {
  let testListingId: number;
  let testCardId: number;

  beforeAll(async () => {
    await withUserContext("system", async (tx) => {
      await tx.insert(users).values([
        { id: "owner_user", email: "owner@test.local", role: "seller" },
        { id: "malicious_user", email: "evil@test.local", role: "seller" },
      ]).onConflictDoNothing();

      const [card] = await tx.insert(cards).values({
        ownerId: "owner_user",
        title: "Test Delete Card",
        category: "TCG",
        condition: "Mint",
      }).returning();
      testCardId = card.id;

      const [listing] = await tx.insert(listings).values({
        sellerId: "owner_user",
        cardId: testCardId,
        title: "Test Delete Listing",
        category: "TCG",
        condition: "Mint",
        priceCents: 100,
        status: "active",
      }).returning();
      testListingId = listing.id;
    });
  });

  it("403 Forbidden: non-owner attempting to remove listing", async () => {
    // Mock auth to return non-owner
    vi.mocked(auth).mockResolvedValue({ userId: "malicious_user" } as any);

    await expect(removeListingAction(testListingId, "delete")).rejects.toThrow("Forbidden: Non-owner attempt");

    // Verify no DB mutation occurred
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, testListingId)
    });
    expect(listing).toBeDefined();
    expect(listing?.status).toBe("active");
  });

  it("FK cascade verification: owner deleting card from binder", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "owner_user" } as any);

    // Call the action with 'delete' mode
    await removeListingAction(testListingId, "delete");

    // Verify card is deleted
    const card = await db.query.cards.findFirst({ where: eq(cards.id, testCardId) });
    expect(card).toBeUndefined();

    // Verify listing is cascade deleted
    const listing = await db.query.listings.findFirst({ where: eq(listings.id, testListingId) });
    expect(listing).toBeUndefined();
  });
});
