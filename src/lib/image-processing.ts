export type CheckState = "pass" | "warn" | "fail" | "idle";

export interface CheckResult {
  state: CheckState;
  tip: string;
}

export interface ProcessingResult {
  lighting: CheckResult;
  background: CheckResult;
  framing: CheckResult;
  tilt: CheckResult; // Fallback visual tilt
}

export function processFrame(imageData: ImageData): ProcessingResult {
  const { data, width, height } = imageData;
  const numPixels = width * height;
  
  // 1. Lighting Check
  const lumas = new Float32Array(numPixels);
  let glareCount = 0;
  let sumLuma = 0;
  
  for (let i = 0; i < numPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    lumas[i] = luma;
    sumLuma += luma;
    if (luma > 245) glareCount++;
  }
  
  const meanLuma = sumLuma / numPixels;
  let sqSumLuma = 0;
  for (let i = 0; i < numPixels; i++) {
    sqSumLuma += (lumas[i] - meanLuma) ** 2;
  }
  const stddevLuma = Math.sqrt(sqSumLuma / numPixels);
  
  // Approximation for median (sort a downsampled array for speed)
  const sampleSize = Math.min(1000, numPixels);
  const stride = Math.floor(numPixels / sampleSize);
  const sampledLumas = [];
  for (let i = 0; i < numPixels; i += stride) {
    sampledLumas.push(lumas[i]);
  }
  sampledLumas.sort((a, b) => a - b);
  const medianLuma = sampledLumas[Math.floor(sampledLumas.length / 2)];

  let lighting: CheckResult = { state: "pass", tip: "Lighting OK" };
  const glarePercent = glareCount / numPixels;
  if (glarePercent > 0.05) {
    lighting = { state: "fail", tip: "Too much glare. Adjust angle." };
  } else if (medianLuma < 60) {
    lighting = { state: "fail", tip: "Too dark. Add more light." };
  } else if (stddevLuma > 80) {
    lighting = { state: "fail", tip: "Harsh shadows. Diffuse light." };
  }

  // 2. Background Check (4 corners, ~10% width/height each)
  const cornerW = Math.max(1, Math.floor(width * 0.1));
  const cornerH = Math.max(1, Math.floor(height * 0.1));
  
  const cornerPixels: {r: number, g: number, b: number}[] = [];
  const addCorner = (startX: number, startY: number) => {
    for (let y = startY; y < startY + cornerH; y++) {
      for (let x = startX; x < startX + cornerW; x++) {
        const i = (y * width + x) * 4;
        cornerPixels.push({ r: data[i], g: data[i+1], b: data[i+2] });
      }
    }
  };
  addCorner(0, 0); // TL
  addCorner(width - cornerW, 0); // TR
  addCorner(0, height - cornerH); // BL
  addCorner(width - cornerW, height - cornerH); // BR

  let sumR = 0, sumG = 0, sumB = 0;
  for (const p of cornerPixels) {
    sumR += p.r; sumG += p.g; sumB += p.b;
  }
  const meanR = sumR / cornerPixels.length;
  const meanG = sumG / cornerPixels.length;
  const meanB = sumB / cornerPixels.length;
  
  let varSum = 0;
  for (const p of cornerPixels) {
    varSum += (p.r - meanR)**2 + (p.g - meanG)**2 + (p.b - meanB)**2;
  }
  const stddevBg = Math.sqrt(varSum / (cornerPixels.length * 3));
  
  let background: CheckResult = { state: "pass", tip: "Background OK" };
  if (stddevBg >= 40) {
    background = { state: "fail", tip: "Background too busy/textured." };
  } else if (stddevBg >= 20) {
    background = { state: "warn", tip: "Consider a plainer background." };
  }

  // 3 & 4. Framing and Visual Tilt (Sobel)
  let minX = width, maxX = 0, minY = height, maxY = 0;
  const angles: number[] = new Array(180).fill(0); // Bins for 0-179 degrees
  let strongEdges = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lTL = lumas[i - width - 1];
      const lTC = lumas[i - width];
      const lTR = lumas[i - width + 1];
      const lML = lumas[i - 1];
      const lMR = lumas[i + 1];
      const lBL = lumas[i + width - 1];
      const lBC = lumas[i + width];
      const lBR = lumas[i + width + 1];

      const gx = -lTL + lTR - 2 * lML + 2 * lMR - lBL + lBR;
      const gy = -lTL - 2 * lTC - lTR + lBL + 2 * lBC + lBR;
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      if (magnitude > 60) {
        strongEdges++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        
        let angle = Math.atan2(gy, gx) * 180 / Math.PI;
        if (angle < 0) angle += 180;
        angles[Math.floor(angle)]++;
      }
    }
  }

  // Framing
  let framing: CheckResult = { state: "pass", tip: "Framing OK" };
  if (strongEdges < 50) {
    framing = { state: "warn", tip: "Place card inside the rectangle." };
  } else {
    const boxArea = (maxX - minX) * (maxY - minY);
    const fraction = boxArea / numPixels;
    if (fraction < 0.4 || fraction > 0.95) {
      framing = { state: "fail", tip: "Move card closer or further." };
    } else if (fraction < 0.5 || fraction > 0.9) {
      framing = { state: "warn", tip: "Almost there, adjust distance." };
    }
  }

  // Tilt
  let tilt: CheckResult = { state: "pass", tip: "Level" };
  if (strongEdges > 50) {
    let maxCount = 0;
    let peakAngle = 0;
    // Apply a simple moving average to smooth histogram bins
    for (let i = 0; i < 180; i++) {
      const prev = angles[(i - 1 + 180) % 180];
      const curr = angles[i];
      const next = angles[(i + 1) % 180];
      const smoothed = (prev + curr * 2 + next) / 4;
      if (smoothed > maxCount) {
        maxCount = smoothed;
        peakAngle = i;
      }
    }
    const deviation = Math.min(peakAngle % 90, 90 - (peakAngle % 90));
    
    if (deviation > 10) {
      tilt = { state: "fail", tip: "Card is tilted. Please level it." };
    } else if (deviation > 5) {
      tilt = { state: "warn", tip: "Card slightly tilted." };
    }
  } else {
    tilt = { state: "warn", tip: "No edges detected." };
  }

  return { lighting, background, framing, tilt };
}
