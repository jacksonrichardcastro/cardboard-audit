"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Tag, ShieldCheck } from "lucide-react";

import { StorefrontProfile } from "./site-header";
import { Check, Plus } from "lucide-react";
import { switchActiveStorefrontAction } from "@/app/actions/storefronts";

import { useState } from "react";

export function NavAuthControls({
  isSignedIn,
  storefronts,
  activeStorefrontId,
  isAdmin,
}: {
  isSignedIn: boolean;
  storefronts?: StorefrontProfile[];
  activeStorefrontId?: string | null;
  isAdmin?: boolean;
}) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  
  const activeStorefront = storefronts?.find(s => s.id === activeStorefrontId) || storefronts?.find(s => s.isDefault) || storefronts?.[0];

  if (isSignedIn) {
    // Desktop avatar fallback logic
    const initial = user?.firstName?.charAt(0).toUpperCase() 
      || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() 
      || user?.lastName?.charAt(0).toUpperCase() 
      || "U";
    
    return (
      <>
      <DropdownMenu>
        <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8 hover:opacity-90 transition-opacity">
              <AvatarImage src={activeStorefront?.avatarUrl || ""} alt={activeStorefront?.displayName || activeStorefront?.handle || "User"} />
              <AvatarFallback className="bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300">
                {initial}
              </AvatarFallback>
            </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
                <div className="w-full flex items-center px-2 py-1.5 text-violet-500 font-semibold">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {storefronts && storefronts.length >= 2 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Your Storefronts
              </div>
              {storefronts.map((storefront) => {
                const isActive = activeStorefront?.id === storefront.id;
                return (
                  <DropdownMenuItem 
                    key={storefront.id} 
                    onClick={async () => {
                      const res = await switchActiveStorefrontAction(storefront.id);
                      if (res.success) {
                        window.location.href = `/${storefront.handle}`;
                      }
                    }} 
                    className="cursor-pointer flex items-center justify-between hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 py-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar className="h-5 w-5 rounded">
                        <AvatarImage src={storefront.avatarUrl || ""} alt={storefront.displayName || storefront.handle} />
                        <AvatarFallback className="rounded text-[10px] bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300">
                          {(storefront.displayName || storefront.handle || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[120px] font-medium text-sm">
                        {storefront.displayName || `@${storefront.handle}`}
                      </span>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-violet-500" />}
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuItem onClick={() => router.push("/seller/dashboard?tab=storefronts")} className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
                <div className="w-full flex items-center px-2 py-1.5">
                  <span className="text-sm font-medium pl-[24px]">Manage Storefronts</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={() => router.push("/seller/dashboard")} className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
            <div className="w-full flex items-center px-2 py-1.5">
              <User className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => router.push("/offers")} className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
            <div className="w-full flex items-center px-2 py-1.5">
              <Tag className="mr-2 h-4 w-4" />
              <span>My Offers</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => router.push("/me")} className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
            <div className="w-full flex items-center px-2 py-1.5">
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50" 
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      </>
    );
  }

  return (
    <>
      <Button asChild variant="ghost">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </>
  );
}
