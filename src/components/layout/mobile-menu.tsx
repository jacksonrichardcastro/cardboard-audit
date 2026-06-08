"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Flame, Menu, User, Tag, ShieldCheck, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { HotPill } from "@/components/shared/HotPill";
import { switchActiveStorefrontAction } from "@/app/actions/storefronts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Plus } from "lucide-react";
import { CreateStorefrontModal } from "@/components/storefront/CreateStorefrontModal";

export type StorefrontProfile = {
  id: string;
  handle: string;
  avatarUrl: string | null;
  displayName: string | null;
  isDefault: boolean;
};

export function MobileMenu({ 
  isSignedIn, 
  isAdmin, 
  userProfile,
  storefronts,
  activeStorefrontId
}: { 
  isSignedIn: boolean; 
  isAdmin?: boolean;
  userProfile?: { handle: string | null; displayName: string | null; avatarUrl?: string | null } | null;
  storefronts?: StorefrontProfile[];
  activeStorefrontId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const activeStorefront = storefronts?.find(s => s.id === activeStorefrontId) || storefronts?.find(s => s.isDefault) || storefronts?.[0];

  const handleLinkClick = () => {
    setOpen(false);
  };

  const handleSignOut = () => {
    setOpen(false);
    signOut({ redirectUrl: "/" });
  };

  return (
    <>
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
            <HotPill text={isSignedIn ? "Trending" : "Hot"} />
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
                {storefronts && storefronts.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-xs font-semibold text-violet-500 uppercase tracking-wider">
                      Your Storefronts
                    </div>
                    {storefronts.map((storefront) => {
                      const isActive = activeStorefront?.id === storefront.id;
                      return (
                        <button
                          key={storefront.id}
                          onClick={async () => {
                            if (!isActive) {
                              const res = await switchActiveStorefrontAction(storefront.id);
                              if (res.success) {
                                window.location.reload();
                              }
                            }
                            handleLinkClick();
                          }}
                          className={`flex items-center justify-between text-sm font-medium px-4 py-2 ${isActive ? 'text-violet-500' : 'text-zinc-300 hover:text-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-6 w-6 rounded">
                              <AvatarImage src={storefront.avatarUrl || ""} alt={storefront.displayName || storefront.handle} />
                              <AvatarFallback className="rounded text-[10px] bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300">
                                {(storefront.displayName || storefront.handle || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[200px]">
                              {storefront.displayName || `@${storefront.handle}`}
                            </span>
                          </div>
                          {isActive && <Check className="h-4 w-4 text-violet-500" />}
                        </button>
                      );
                    })}
                    <button onClick={() => { handleLinkClick(); setCreateModalOpen(true); }} className="text-sm font-medium flex items-center gap-3 px-4 py-2 text-violet-500 hover:text-violet-400">
                      <div className="h-6 w-6 rounded border border-violet-500/30 flex items-center justify-center bg-violet-500/10">
                        <Plus className="h-4 w-4" />
                      </div>
                      Add Storefront
                    </button>
                    <button onClick={() => { handleLinkClick(); router.push("/seller/dashboard?tab=storefronts"); }} className="text-sm font-medium flex items-center gap-2 pl-4 pt-2 text-zinc-300 hover:text-white text-left">
                      Manage Storefronts
                    </button>
                    <div className="h-px bg-border/50 mx-4 mt-2" />
                  </>
                )}
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
    <CreateStorefrontModal 
      open={createModalOpen} 
      onOpenChange={setCreateModalOpen} 
      onCreated={() => {
        setCreateModalOpen(false);
      }} 
    />
    </>
  );
}
