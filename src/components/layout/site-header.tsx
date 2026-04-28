

import Link from "next/link";
import { Menu } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { NavAuthControls } from "./nav-auth-controls";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export async function SiteHeader() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-background/80 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-1">
            <>
              <img
                src="/trax-logo.png"
                alt="Trax"
                className="h-7 w-auto"
              />
              <span className="text-xl font-bold tracking-tighter">Marketplace</span>
            </>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/trending"
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Trending
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
            <Link href="/sell" className="hidden md:inline-flex">
              <Button>Sell</Button>
            </Link>
            <NavAuthControls isSignedIn={isSignedIn} />
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" />}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col gap-6 pt-6">
                  <Link href="/trending" className="text-sm font-medium">
                    Trending
                  </Link>
                  <Link href="/tracker" className="text-sm font-medium inline-flex items-center gap-2">
                    Tracker
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      Soon
                    </span>
                  </Link>
                  <Link href="/breaks" className="text-sm font-medium inline-flex items-center gap-2">
                    Live Breaks
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      Soon
                    </span>
                  </Link>
                  <Link href="/sell">
                    <Button className="w-full">Sell</Button>
                  </Link>
                  <div className="flex flex-col gap-4 border-t border-border pt-6">
                    <NavAuthControls isSignedIn={isSignedIn} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
