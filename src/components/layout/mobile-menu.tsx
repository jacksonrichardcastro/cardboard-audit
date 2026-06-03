"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Flame, Menu, User, Tag, ShieldCheck, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { HotPill } from "@/components/shared/HotPill";

export function MobileMenu({ 
  isSignedIn, 
  isAdmin, 
  userProfile 
}: { 
  isSignedIn: boolean; 
  isAdmin?: boolean;
  userProfile?: { handle: string | null; displayName: string | null; avatarUrl?: string | null } | null;
}) {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLinkClick = () => {
    setOpen(false);
  };

  const handleSignOut = () => {
    setOpen(false);
    signOut({ redirectUrl: "/" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger 
        render={
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col gap-6 pt-[max(env(safe-area-inset-top),5rem)] pb-safe pl-4 pr-4">
          <Link href="/for-you" onClick={handleLinkClick} className="text-sm font-medium flex items-center gap-1.5 pl-4">
            <HotPill text={isSignedIn ? "For You" : "Hot"} />
          </Link>
          <Link href="/tracker" onClick={handleLinkClick} className="text-sm font-medium inline-flex items-center gap-2 pl-4">
            Tracker
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
              Soon
            </span>
          </Link>
          <Link href="/breaks" onClick={handleLinkClick} className="text-sm font-medium inline-flex items-center gap-2 pl-4">
            Live Breaks
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
              Soon
            </span>
          </Link>
          <div className="pl-4 pr-4">
            <Button asChild className="w-full">
              <Link href="/seller/onboarding/stripe" onClick={handleLinkClick}>Sell</Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            {!isSignedIn ? (
              <div className="flex flex-col gap-3 pl-4 pr-4">
                <Button asChild variant="ghost" onClick={handleLinkClick}>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild onClick={handleLinkClick}>
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {isAdmin && (
                  <>
                    <Link href="/admin" onClick={handleLinkClick} className="text-sm font-medium flex items-center gap-2 pl-4 text-violet-500">
                      <ShieldCheck className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                    <div className="h-px bg-border/50 mx-4" />
                  </>
                )}
                
                <Link href="/seller/dashboard" onClick={handleLinkClick} className="text-sm font-medium flex items-center gap-2 pl-4 hover:text-violet-400">
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link href="/offers" onClick={handleLinkClick} className="text-sm font-medium flex items-center gap-2 pl-4 hover:text-violet-400">
                  <Tag className="w-4 h-4" />
                  My Offers
                </Link>

                <button onClick={() => { handleLinkClick(); router.push("/me"); }} className="text-sm font-medium flex items-center gap-2 pl-4 hover:text-violet-400 w-full text-left">
                  <User className="w-4 h-4" />
                  My Profile
                </button>

                <div className="h-px bg-border/50 mx-4 mt-2 mb-2" />

                <button 
                  onClick={handleSignOut}
                  className="text-sm font-medium flex items-center gap-2 pl-4 text-red-500 hover:text-red-400 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
