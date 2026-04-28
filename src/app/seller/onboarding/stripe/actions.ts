"use server";

import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { syncUserFromClerk } from "@/lib/auth-sync";

export async function createStripeConnectAccount() {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) throw new Error("Unauthorized");

  // Sync user locally to ensure FKs are satisfied
  await syncUserFromClerk();

  const [seller] = await db.select().from(sellers).where(eq(sellers.userId, userId)).limit(1);
  if (!seller) throw new Error("Seller profile not found");

  let accountId = seller.stripeConnectAccountId;

  if (!accountId) {
    const email = user.emailAddresses[0]?.emailAddress;
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    accountId = account.id;
    await db.update(sellers).set({ stripeConnectAccountId: accountId }).where(eq(sellers.userId, userId));
  }

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${protocol}://${host}/seller/onboarding/stripe`,
    return_url: `${protocol}://${host}/seller/onboarding/legal`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}
