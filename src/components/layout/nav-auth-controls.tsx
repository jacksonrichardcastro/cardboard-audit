"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function NavAuthControls({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) {
    return <UserButton />;
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
