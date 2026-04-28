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
      <Link href="/sign-in">
        <Button variant="ghost">Sign in</Button>
      </Link>
      <Link href="/sign-up">
        <Button>Sign up</Button>
      </Link>
    </>
  );
}
