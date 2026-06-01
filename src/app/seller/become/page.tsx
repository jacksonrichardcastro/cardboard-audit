import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function BecomeSellerPage() {
  const { userId } = await auth();
  if (userId) {
    const userRow = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    if (userRow?.accountType === "seller" || userRow?.role === "seller") {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId)
      });
      if (profile && profile.handle) {
        redirect(`/${profile.handle}`);
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl min-h-[70vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white mb-6">
        Become a Trax Seller
      </h1>
      
  <div className="flex flex-col space-y-4 text-left max-w-lg w-full mb-10 text-muted-foreground">
    <div className="flex items-start gap-3">
      <div className="mt-1 bg-violet-500/20 p-1 rounded text-violet-400">✓</div>
      <p><strong>5% flat fee</strong> — simple, transparent pricing for all sales</p>
    </div>
    <div className="flex items-start gap-3">
      <div className="mt-1 bg-violet-500/20 p-1 rounded text-violet-400">✓</div>
      <p><strong>Vetted seller community</strong> — by the hobby, for the hobby</p>
    </div>
    <div className="flex items-start gap-3">
      <div className="mt-1 bg-violet-500/20 p-1 rounded text-violet-400">✓</div>
      <p><strong>Your own storefront URL</strong> — share your inventory directly with buyers anywhere</p>
    </div>
    <div className="flex items-start gap-3">
      <div className="mt-1 bg-violet-500/20 p-1 rounded text-violet-400">✓</div>
      <p><strong>Personal onboarding support</strong> — we're here to help you scale</p>
    </div>
  </div>

  <Button asChild size="lg" className="w-full sm:w-auto px-12 py-6 text-lg bg-violet-600 hover:bg-violet-700 mb-8 shadow-lg shadow-violet-500/20">
    <Link href="/seller/onboarding/profile">
      Start Onboarding
    </Link>
  </Button>

  <details className="text-sm text-muted-foreground cursor-pointer group">
    <summary className="font-medium hover:text-white transition-colors">▶ What you'll need</summary>
    <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-left text-xs leading-relaxed space-y-2">
      <p>To comply with financial regulations and secure your payouts, Stripe requires:</p>
      <p>• <strong>Government-issued ID</strong> (Passport, Driver's License, or State ID)</p>
      <p>• <strong>Bank account details</strong> for direct deposit payouts</p>
      <p>• <strong>Tax information</strong> (SSN or EIN) for end-of-year tax reporting</p>
      <p>• <strong>Business details</strong> (if operating as an LLC or Corporation)</p>
      <p className="pt-2 text-violet-400 opacity-80 italic">Note: Verification typically takes 2-5 minutes but can take up to 24 hours. Your sensitive financial data is collected securely by Stripe and is never stored on Trax servers.</p>
    </div>
  </details>
    </div>
  );
}
