"use server";

import { withUserContext } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function createSellerApplication(payload: { businessName: string; description: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Single shared Stripe client from @/lib/stripe — pinned API version,
  // consistent appInfo. Previously this file instantiated its own client
  // at the legacy "2023-10-16" API version, which meant seller-KYC
  // requests hit a different Stripe API than every other call site.

  // 1. Drizzle DB Upsert Application State
  // 1. Drizzle DB Upsert Application State
  await withUserContext(userId, async (tx) => {
    await tx.insert(sellers).values({
      userId,
      businessName: payload.businessName,
      description: payload.description,
      applicationStatus: "PENDING",
    }).onConflictDoUpdate({
      target: sellers.userId,
      set: {
         businessName: payload.businessName,
         description: payload.description,
      }
    });
  });

  // 2. Map Stripe Identity KYC Flow natively preventing mock approvals P1-3
  const identitySession = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { userId },
    options: {
      document: { require_matching_selfie: true }
    },
    // We expect the local testing host when dealing with dev hooks
    return_url: `http://localhost:3000/`,
  });

  if (!identitySession.url) throw new Error("Stripe KYC Host Failed to generate");

  return { applicationUrl: identitySession.url };
}
