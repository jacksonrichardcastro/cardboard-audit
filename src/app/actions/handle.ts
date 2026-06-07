'use server'

import { db } from '@/lib/db'
import { profiles, handleHistory } from '@/lib/db/schema'
import { eq, and, ne, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

const RESERVED_HANDLES = new Set([
  'admin', 'administrator', 'support', 'help', 'login', 'logout',
  'signup', 'signin', 'register', 'api', 'auth', 'oauth',
  'seller', 'sellers', 'account', 'accounts', 'settings',
  'profile', 'profiles', 'user', 'users', 'for-you', 'foryou',
  'home', 'marketplace', 'shop', 'cart', 'checkout',
  'dashboard', 'jackson', 'trax', 'cards', 'card',
  'about', 'terms', 'privacy', 'contact', 'faq',
  'blog', 'blogs', 'news', 'feed', 'notifications',
  'search', 'browse', 'discover', 'explore',
  'listing', 'listings', 'binder', 'collection',
]);

const PROFANITY_BLOCKLIST = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'nigga', 'faggot'];

function containsProfanity(handle: string) {
  const lower = handle.toLowerCase();
  return PROFANITY_BLOCKLIST.some(word => lower.includes(word));
}

export async function changeHandleAction(newHandleRaw: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Not authenticated' }

  const newHandle = newHandleRaw.trim().toLowerCase()

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(newHandle)) {
    return { error: 'Handle must be 3–30 chars, lowercase letters, numbers, or hyphens. No leading/trailing hyphens.' }
  }
  if (newHandle.length < 3 || newHandle.length > 30) {
    return { error: 'Handle must be between 3 and 30 characters.' }
  }
  if (newHandle.includes('--')) {
    return { error: 'Handle cannot contain consecutive hyphens.' }
  }
  if (RESERVED_HANDLES.has(newHandle)) {
    return { error: 'That handle is reserved.' }
  }
  if (containsProfanity(newHandle)) {
    return { error: 'That handle is not available.' }
  }

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, clerkId) })
  if (!profile) return { error: 'Profile not found' }

  if (profile.handle?.toLowerCase() === newHandle) {
    return { error: 'That is already your handle.' }
  }

  const existing = await db.query.profiles.findFirst({
    where: and(
      sql`LOWER(${profiles.handle}) = ${newHandle}`,
      ne(profiles.userId, profile.userId)
    )
  })
  if (existing) return { error: 'That handle is already taken.' }

  const oldHandle = profile.handle || ''

  await db.transaction(async (tx) => {
    if (oldHandle) {
      await tx.insert(handleHistory).values({
        userId: profile.userId,
        oldHandle,
        newHandle,
      })
    }
    await tx.update(profiles).set({ handle: newHandle }).where(eq(profiles.userId, profile.userId))
  })

  if (oldHandle) {
    revalidatePath(`/${oldHandle}`)
  }
  revalidatePath(`/${newHandle}`)
  revalidatePath(`/seller/dashboard`)

  return { success: true, newHandle }
}
