import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Trax — By the hobby. For the hobby.';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const logoData = await fetch(
    new URL('../../public/trax-logo.png', import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          background: '#7C3AED',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoData as any}
            alt="Trax Logo"
            style={{ width: 400, height: 133, objectFit: 'contain', marginBottom: 40 }}
          />
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              fontFamily: 'sans-serif',
              letterSpacing: '-0.02em',
              textAlign: 'center',
            }}
          >
            By the hobby. For the hobby.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
