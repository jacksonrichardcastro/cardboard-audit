import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { profiles, storefronts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { syncUserFromClerk } from '@/lib/auth-sync';
import { cookies } from 'next/headers';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MeRedirect(props: Props) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const params = await props.searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach(v => q.append(key, v));
    } else if (value) {
      q.append(key, value);
    }
  }
  const search = q.toString() ? `?${q.toString()}` : '';

  // 1. Check active storefront cookie first
  const cookieStore = await cookies();
  const activeStorefrontId = cookieStore.get("active_storefront_id")?.value;
  
  if (activeStorefrontId) {
    const activeStorefront = await db.query.storefronts.findFirst({
      where: and(eq(storefronts.id, activeStorefrontId), eq(storefronts.userId, userId))
    });
    if (activeStorefront?.handle) {
      redirect(`/${activeStorefront.handle}${search}`);
    }
  }

  // 2. Fallback to default profile handle
  let [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  // 3. If no profile, force a sync which creates the user and profile
  if (!profile?.handle) {
    await syncUserFromClerk();
    [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  }

  // 4. Redirect to the handle if it exists, otherwise fallback to dashboard
  if (profile?.handle) {
    redirect(`/${profile.handle}${search}`);
  }

  redirect('/seller/dashboard');
}
