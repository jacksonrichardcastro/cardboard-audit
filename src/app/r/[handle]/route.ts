import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  
  // Create a response that redirects to the sign-up page
  const response = NextResponse.redirect(new URL('/sign-up', req.url));

  try {
    // Lookup the profile by handle
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.handle, handle.toLowerCase()),
    });

    if (profile) {
      // Set the referral cookie with the referrer's user ID (expires in 90 days)
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 90);
      
      response.cookies.set("trax_ref", profile.userId, {
        expires: expiry,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      // Also store the handle for tracking
      response.cookies.set("trax_ref_handle", profile.handle || handle, {
        expires: expiry,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
  } catch (error) {
    console.error("Error setting referral cookie:", error);
  }

  return response;
}
