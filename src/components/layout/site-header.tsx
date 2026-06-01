import Link from "next/link";
import { Menu, Flame } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NavAuthControls } from "./nav-auth-controls";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { syncUserFromClerk } from "@/lib/auth-sync";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { MobileMenu } from "./mobile-menu";
import { TraxLogo } from "./TraxLogo";

export async function SiteHeader() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  const isAdmin = isSignedIn && userId === process.env.ADMIN_USER_ID;

  let userProfile: { handle: string | null; displayName: string | null; avatarUrl: string | null } | null = null;
  let showWelcomeModal = false;

  if (userId) {
    await syncUserFromClerk();
    
    const userRow = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (userRow && userRow.accountType === "seller" && !userRow.welcomeModalDismissed && !isAdmin) {
      showWelcomeModal = true;
    }
    
    const profileRow = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (profileRow) {
      userProfile = {
        handle: profileRow.handle,
        avatarUrl: profileRow.profilePhotoUrl,
        displayName: profileRow.displayName || profileRow.businessName,
      };
    }
  }

  return (
    <>
      {showWelcomeModal && <WelcomeModal />}
      <header className="sticky top-0 z-[250] h-16 border-b border-white/10 bg-background">
      <div className="flex h-full w-full items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-5">
          <TraxLogo />
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/for-you"
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4 text-violet-600 fill-violet-600" />
              {isSignedIn ? "For You" : "Hot"}
            </Link>
            <Link
              href="/tracker"
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground inline-flex items-center gap-2"
            >
              Tracker
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                Soon
              </span>
            </Link>
            <Link
              href="/breaks"
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground inline-flex items-center gap-2"
            >
              Live Breaks
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                Soon
              </span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Button asChild>
              <Link href="/seller/onboarding/stripe" className="hidden md:inline-flex">Sell</Link>
            </Button>
            <NavAuthControls isSignedIn={isSignedIn} userProfile={userProfile} isAdmin={isAdmin} />
          </div>
          <div className="md:hidden">
            <MobileMenu isSignedIn={isSignedIn} userProfile={userProfile} isAdmin={isAdmin} />
          </div>
        </div>
        </div>
      </header>
    </>
  );
}
