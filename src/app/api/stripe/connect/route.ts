import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sellers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Fetch current seller profile
    const [seller] = await db.select().from(sellers).where(eq(sellers.userId, userId));
    
    if (!seller) {
      return new NextResponse("Seller profile not found", { status: 404 });
    }

    let accountId = seller.stripeConnectAccountId;

    // 2. Create the Express account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
      });
      
      accountId = account.id;

      // Persist to DB securely
      await db.update(sellers)
        .set({ stripeConnectAccountId: accountId })
        .where(eq(sellers.userId, userId));
    }

    // 3. Generate the magic connect link allowing the user to KYC
    // Generate the onboarding link
    const host = req.headers.get("origin") || env.NEXT_PUBLIC_APP_URL;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${host}/seller/settings?stripe_refresh=true`,
      return_url: `${host}/seller/settings?stripe_success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("[STRIPE_CONNECT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
