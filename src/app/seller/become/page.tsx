import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BecomeSellerPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl min-h-[70vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white mb-6">
        Become a Trax Seller
      </h1>
      
      <div className="flex flex-col space-y-4 text-left max-w-lg w-full mb-10 text-muted-foreground">
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-violet-500/20 p-1 rounded text-violet-400">✓</div>
          <p><strong>5% fee structure</strong> (0% for first 90 days for founding sellers)</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-violet-500/20 p-1 rounded text-violet-400">✓</div>
          <p><strong>Vetted seller community</strong></p>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-violet-500/20 p-1 rounded text-violet-400">✓</div>
          <p><strong>Direct buyer share links</strong></p>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-1 bg-violet-500/20 p-1 rounded text-violet-400">✓</div>
          <p><strong>Personal onboarding support</strong></p>
        </div>
      </div>

      <Link href="/seller/onboarding/profile">
        <Button size="lg" className="w-full sm:w-auto px-12 py-6 text-lg bg-violet-600 hover:bg-violet-700 mb-8 shadow-lg shadow-violet-500/20">
          Start Onboarding
        </Button>
      </Link>

      <details className="text-sm text-muted-foreground cursor-pointer group">
        <summary className="font-medium hover:text-white transition-colors">What you'll need</summary>
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-left text-xs leading-relaxed space-y-2">
          <p>• Government-issued ID</p>
          <p>• Bank account info for payouts</p>
          <p>• Basic business info (if operating as an entity)</p>
          <p className="pt-2 text-violet-400 opacity-80 italic">Securely collected by Stripe during KYC.</p>
        </div>
      </details>
    </div>
  );
}
