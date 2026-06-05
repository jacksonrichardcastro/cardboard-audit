import { ImageResponse } from 'next/og';
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 86400; // Cache for 24 hours

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
      <div style={{ background: '#0a0a0a', width: '100%', height: '100%' }} />, 
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
          background: 'linear-gradient(135deg, #4c1d95 0%, #1a0b2e 100%)', // Deep cosmic purple
          color: 'white',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Star/Ray Accents */}
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: '4px', height: '4px', background: '#2dd4bf', borderRadius: '50%', boxShadow: '0 0 20px 5px rgba(45, 212, 191, 0.5)' }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '30%', width: '6px', height: '6px', background: '#d946ef', borderRadius: '50%', boxShadow: '0 0 30px 10px rgba(217, 70, 239, 0.4)' }} />
        <div style={{ position: 'absolute', top: '35%', right: '15%', width: '3px', height: '3px', background: '#a855f7', borderRadius: '50%', boxShadow: '0 0 15px 5px rgba(168, 85, 247, 0.6)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '5px', height: '5px', background: '#f8fafc', borderRadius: '50%', boxShadow: '0 0 25px 8px rgba(255, 255, 255, 0.3)' }} />
        
        {/* Avatar Side */}
        <div style={{ display: 'flex', flex: '0 0 400px', justifyContent: 'center', alignItems: 'center' }}>
          {validAvatarUrl ? (
            <img
              src={validAvatarUrl}
              style={{
                width: '320px',
                height: '320px',
                borderRadius: '160px',
                objectFit: 'cover',
                border: '8px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            />
          ) : (
            <div
              style={{
                width: '320px',
                height: '320px',
                borderRadius: '160px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #4c1d95 100%)',
                border: '8px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '140px',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              {initial}
            </div>
          )}
        </div>

        {/* Text Side */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: '60px' }}>
          <h1 style={{ fontSize: '72px', fontWeight: 'bold', margin: '0 0 20px 0', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {displayName} on Trax
          </h1>
          <p style={{ fontSize: '32px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {bio}
          </p>
        </div>

        {/* Wordmark Corner */}
        <div style={{ position: 'absolute', bottom: '40px', right: '50px', fontSize: '32px', fontWeight: 'bold', letterSpacing: '-0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: '#7C3AED', borderRadius: '4px' }} />
          Trax
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
