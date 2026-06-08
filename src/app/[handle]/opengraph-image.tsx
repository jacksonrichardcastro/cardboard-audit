import { ImageResponse } from 'next/og';
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 86400; // Cache for 24 hours

// Load font and logo dynamically
let interBoldFont: Buffer | null = null;
let logoDataUri: string | null = null;

export default async function Image(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  const handleLower = params.handle.toLowerCase();

  const [profileRecord] = await db.select({
    profile: profiles,
  })
  .from(profiles)
  .innerJoin(users, eq(profiles.userId, users.id))
  .where(sql`lower(${profiles.handle}) = ${handleLower}`)
  .limit(1);

  if (!profileRecord) {
    return new ImageResponse(
      <div style={{ background: '#0E081A', width: '100%', height: '100%' }} />, 
      { ...size }
    );
  }

  const seller = profileRecord.profile;
  const displayName = (seller.displayName || seller.businessName || seller.handle || "Seller").trim();
  const bio = seller.bio && seller.bio.trim().length > 0 ? seller.bio.trim() : `${displayName}'s storefront on Trax. By the hobby. For the hobby.`;
  const initial = displayName.charAt(0).toUpperCase();

  let validAvatarUrl = null;
  if (seller.profilePhotoUrl) {
    try {
      const res = await fetch(seller.profilePhotoUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        validAvatarUrl = seller.profilePhotoUrl;
      }
    } catch (e) {
      console.warn("OG Image avatar fetch failed for", seller.handle, e);
    }
  }

  // Ensure assets are loaded
  if (!interBoldFont) {
    try {
      interBoldFont = fs.readFileSync(path.join(process.cwd(), 'public/fonts/Inter-Bold.ttf'));
    } catch (e) {
      console.warn("Failed to load Inter-Bold.ttf", e);
    }
  }

  if (!logoDataUri) {
    try {
      const logoBuffer = fs.readFileSync(path.join(process.cwd(), 'public/trax-logo.png'));
      logoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (e) {
      console.warn("Failed to load trax-logo.png", e);
    }
  }

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#0E081A', // Deep cosmic near-black
            color: 'white',
            fontFamily: interBoldFont ? 'Inter' : 'sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Radial gradient overlay: brand purple #7C3AED at ~30% opacity, positioned to emanate from behind the avatar */}
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '30%', 
            transform: 'translate(-50%, -50%)', 
            width: '800px', 
            height: '800px', 
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, rgba(124, 58, 237, 0) 70%)',
            borderRadius: '50%',
            zIndex: 0
          }} />

          {/* Subtle scattered white/iridescent star dots */}
          <div style={{ position: 'absolute', top: '15%', left: '20%', width: '3px', height: '3px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '50%', boxShadow: '0 0 10px 2px rgba(45, 212, 191, 0.5)' }} />
          <div style={{ position: 'absolute', bottom: '25%', right: '30%', width: '4px', height: '4px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '50%', boxShadow: '0 0 15px 3px rgba(217, 70, 239, 0.4)' }} />
          <div style={{ position: 'absolute', top: '35%', right: '15%', width: '2px', height: '2px', background: 'rgba(255, 255, 255, 0.7)', borderRadius: '50%', boxShadow: '0 0 8px 2px rgba(168, 85, 247, 0.6)' }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '3px', height: '3px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '50%', boxShadow: '0 0 12px 3px rgba(255, 255, 255, 0.3)' }} />
          <div style={{ position: 'absolute', top: '70%', left: '40%', width: '2px', height: '2px', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '10%', right: '40%', width: '3px', height: '3px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '50%' }} />

          <div style={{ display: 'flex', width: '100%', height: '100%', padding: '80px', zIndex: 1, position: 'relative' }}>
            {/* Avatar Side (Left third) */}
            <div style={{ display: 'flex', flex: '0 0 350px', justifyContent: 'flex-start', alignItems: 'center' }}>
              {validAvatarUrl ? (
                <img
                  src={validAvatarUrl}
                  style={{
                    width: '280px',
                    height: '280px',
                    borderRadius: '140px',
                    objectFit: 'cover',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '280px',
                    height: '280px',
                    borderRadius: '140px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #4c1d95 100%)',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '120px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}
                >
                  {initial}
                </div>
              )}
            </div>

            {/* Text Side (Right two-thirds) */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: '40px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '80px', fontWeight: 'bold', margin: '0 0 10px 0', lineHeight: 1.1, letterSpacing: '-0.02em', color: 'white' }}>
                  {displayName}
                </h1>
                <div style={{ fontSize: '60px', fontWeight: 'bold', margin: '0 0 20px 0', color: '#7C3AED', letterSpacing: '-0.02em' }}>
                  on Trax
                </div>
              </div>
              <p style={{ fontSize: '32px', color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {bio}
              </p>
            </div>
          </div>

          {/* Wordmark Corner */}
          <div style={{ position: 'absolute', bottom: '40px', right: '50px', display: 'flex', alignItems: 'center' }}>
            {logoDataUri ? (
              <img src={logoDataUri} style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '-0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', background: '#7C3AED', borderRadius: '4px' }} />
                Trax
              </div>
            )}
          </div>

          {/* Tagline bottom-left */}
          <div style={{ position: 'absolute', bottom: '40px', left: '80px', fontSize: '20px', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.1em', fontWeight: 'bold' }}>
            BY THE HOBBY. FOR THE HOBBY.
          </div>
        </div>
      ),
      {
        ...size,
        fonts: interBoldFont ? [
          {
            name: 'Inter',
            data: interBoldFont,
            style: 'normal',
            weight: 700,
          }
        ] : undefined,
      }
    );
  } catch (error) {
    console.error("OG Image render error:", error);
    // Silent fallback if ImageResponse throws (e.g. font loading issue)
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0E081A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '120px',
          fontWeight: 'bold',
          color: 'white'
        }}
      >
        <div
          style={{
            width: '280px',
            height: '280px',
            borderRadius: '140px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #4c1d95 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initial}
        </div>
      </div>,
      { ...size }
    );
  }
}
