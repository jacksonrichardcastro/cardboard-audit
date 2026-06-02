import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { syncUserFromClerk } from '@/lib/auth-sync';

export default async function MeRedirect() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // 1. Fetch profile
  let [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  // 2. If no profile, force a sync which creates the user and profile
  if (!profile?.handle) {
    await syncUserFromClerk();
    [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  }

  // 3. Redirect to the handle if it exists, otherwise fallback to dashboard
  if (profile?.handle) {
    redirect(`/${profile.handle}`);
  }

  redirect('/seller/dashboard');
}
