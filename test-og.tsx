import { ImageResponse } from 'next/og';

export default function test() {
  try {
    const res = new ImageResponse(<div style={{ background: 'radial-gradient(circle, red, blue)' }}>Test</div>);
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
