"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { dismissWelcomeModal } from "@/app/actions/user";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function WelcomeModal({ isFoundingSeller }: { isFoundingSeller: boolean }) {
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissWelcomeModal();
      setOpen(false);
      router.push("/onboarding/preferences");
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="bg-[#0A0A0A] border-white/10 sm:max-w-md p-0 overflow-hidden">
        <div className="relative h-32 w-full bg-gradient-to-br from-[#7C3AED]/30 via-transparent to-transparent flex items-center justify-center border-b border-white/5">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          <img src="/trax-logo.png" alt="Trax Logo" className="h-12 w-auto relative z-10 opacity-90" />
        </div>
        
        <div className="p-6">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-xl font-medium tracking-wide text-white">
              {isFoundingSeller ? "Welcome to Trax" : "Welcome to Trax Beta."}
            </DialogTitle>
            {isFoundingSeller && (
              <DialogDescription className="text-zinc-400 mt-2 text-sm leading-relaxed">
                Founding Seller Access — Beta Phase
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 mb-6">
            {isFoundingSeller ? (
              <>
                <p className="text-sm text-zinc-300 text-center">
                  You are among the first to experience the Trax Marketplace. As a Founding Seller, your profile is pre-verified and ready to go.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-zinc-400">
                  <span className="text-white font-medium block mb-1">What to do next:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Customize your storefront — header style, display name, online status, bio</li>
                    <li>Populate your binder with the cards in your collection</li>
                    <li>Draft listings for your storefront — set prices, conditions, specials</li>
                    <li>Share your storefront link</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-sm text-zinc-300 space-y-3">
                <p className="text-center">
                  Trax is a premium trading card marketplace, in early Beta. Our marketplace isn't live yet, but feel free to explore.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-zinc-400">
                  <span className="text-white font-medium block mb-1">You can:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Browse listings + see what early sellers have up</li>
                    <li>Customize your binder to track your cards.</li>
                    <li>Open your own storefront if you want to sell</li>
                  </ul>
                </div>
                <p className="text-center">
                  We ship improvements daily based on seller feedback. Reply to any X post or DM @TraxMarketplace if you spot something off or have an ask.
                </p>
                <p className="text-zinc-500 pt-1 text-center">— Jackson</p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleDismiss} 
            disabled={isPending}
            className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white transition-colors font-semibold tracking-wide h-11"
          >
            {isPending ? "Setting up..." : "Get started."}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
