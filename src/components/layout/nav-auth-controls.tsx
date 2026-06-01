"use client";

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

type UserProfile = {
  handle: string | null;
  avatarUrl: string | null;
  displayName: string | null;
};

export function NavAuthControls({
  isSignedIn,
  userProfile,
  isAdmin,
}: {
  isSignedIn: boolean;
  userProfile?: UserProfile | null;
  isAdmin?: boolean;
}) {
  const { signOut } = useClerk();
  const { user } = useUser();

  if (isSignedIn) {
    const hasValidHandle = userProfile?.handle && userProfile.handle !== "kyc_user";
    
    // Desktop avatar fallback logic
    const initial = user?.firstName?.charAt(0).toUpperCase() 
      || user?.lastName?.charAt(0).toUpperCase() 
      || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() 
      || "U";
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8 hover:opacity-90 transition-opacity">
              <AvatarImage src={userProfile?.avatarUrl || ""} alt={userProfile?.displayName || userProfile?.handle || "User"} />
              <AvatarFallback className="bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300">
                {initial}
              </AvatarFallback>
            </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          {isAdmin && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
                <Link href="/admin" className="w-full flex items-center px-2 py-1.5 text-violet-500 font-semibold">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem asChild className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
            <Link href="/seller/dashboard" className="w-full flex items-center px-2 py-1.5">
              <User className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
            <Link href="/offers" className="w-full flex items-center px-2 py-1.5">
              <Tag className="mr-2 h-4 w-4" />
              <span>My Offers</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild className="cursor-pointer hover:bg-violet-50 hover:text-violet-900 dark:hover:bg-violet-900/50 dark:hover:text-violet-50 focus:bg-violet-50 focus:text-violet-900 dark:focus:bg-violet-900/50 dark:focus:text-violet-50 p-0">
            {hasValidHandle ? (
              <Link href={`/${userProfile.handle}`} className="w-full flex items-center px-2 py-1.5">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            ) : (
              <Link href="/seller/onboarding/profile" className="w-full flex items-center px-2 py-1.5">
                <User className="mr-2 h-4 w-4" />
                <span>Set Up Profile</span>
              </Link>
            )}
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
