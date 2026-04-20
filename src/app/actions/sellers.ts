"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { env } from "@/env";

export async function createSellerApplication(payload: { businessName: string; description: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });

  // 1. Drizzle DB Upsert Application State
  await db.insert(sellers).values({
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
