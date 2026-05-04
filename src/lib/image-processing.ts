export type CheckState = "pass" | "warn" | "fail" | "idle";

export interface CheckResult {
  state: CheckState;
  tip: string;
  raw?: number;
}

export interface ProcessingResult {
  lighting: CheckResult;
  background: CheckResult;
  framing: CheckResult;
  focus: CheckResult;
  tilt: CheckResult; // Fallback visual tilt
  debug: {
    bgTL: number;
    bgTR: number;
    bgBL: number;
    bgBR: number;
    fTotalEdges: number;
    fAvgX: number;
    fAvgY: number;
    fThreshX: number;
    fThreshY: number;
    fMinX: number;
    fMaxX: number;
    fMinY: number;
    fMaxY: number;
  };
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
    if (luma > 220) glareCount++;
  }
  
  const meanLuma = sumLuma / numPixels;
  let sqSumLuma = 0;
  for (let i = 0; i < numPixels; i++) {
    sqSumLuma += (lumas[i] - meanLuma) ** 2;
  }
  const stddevLuma = Math.sqrt(sqSumLuma / numPixels);
  
  // Approximation for median and 99th percentile (sort a downsampled array for speed)
  const sampleSize = Math.min(1000, numPixels);
  const stride = Math.floor(numPixels / sampleSize);
  const sampledLumas = [];
  for (let i = 0; i < numPixels; i += stride) {
    sampledLumas.push(lumas[i]);
  }
  sampledLumas.sort((a, b) => a - b);
  const medianLuma = sampledLumas[Math.floor(sampledLumas.length / 2)];
  const p99Luma = sampledLumas[Math.floor(sampledLumas.length * 0.99)];

  let lighting: CheckResult = { state: "pass", tip: "Lighting OK", raw: p99Luma };
  // A clean, well-lit card will typically have a 99th percentile luma around 150-200.
  // Direct glare pegs it to 250+.
  if (p99Luma > 250) {
    lighting = { state: "fail", tip: "Too much glare. Adjust angle.", raw: p99Luma };
  } else if (p99Luma > 240) {
    lighting = { state: "warn", tip: "Minor glare detected.", raw: p99Luma };
  } else if (meanLuma < 40) {
    lighting = { state: "fail", tip: "Too dark. Add more light.", raw: meanLuma };
  } else if (meanLuma > 180) {
    lighting = { state: "fail", tip: "Washed out. Reduce light.", raw: meanLuma };
  }

  // Calculate edges first (required for BKGND and FRAMING)
  const xEdges = new Float32Array(width);
  const yEdges = new Float32Array(height);
  let totalStrongEdges = 0;
  const edgeMap = new Uint8Array(numPixels);

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
      
      // Keep threshold reasonable to catch texture, but high enough to ignore pure compression noise
      if (magnitude > 60) {
        totalStrongEdges++;
        edgeMap[i] = 1;
        xEdges[x]++;
        yEdges[y]++;
      }
    }
  }

  // 2. Background Check (Corner-only sampling to ignore card)
  const cornerW = Math.floor(width * 0.1);
  const cornerH = Math.floor(height * 0.1);
  let tl = 0, tr = 0, bl = 0, br = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edgeMap[y * width + x]) {
        if (x < cornerW && y < cornerH) tl++;
        else if (x >= width - cornerW && y < cornerH) tr++;
        else if (x < cornerW && y >= height - cornerH) bl++;
        else if (x >= width - cornerW && y >= height - cornerH) br++;
      }
    }
  }
  const cornerArea = cornerW * cornerH;
  const bgTL = tl / cornerArea;
  const bgTR = tr / cornerArea;
  const bgBL = bl / cornerArea;
  const bgBR = br / cornerArea;
  
  const cornerEdges = tl + tr + bl + br;
  const totalCornerArea = cornerArea * 4;
  const bkgndDensity = cornerEdges / totalCornerArea;

  let background: CheckResult = { state: "pass", tip: "Background OK", raw: bkgndDensity };
  if (bkgndDensity >= 0.15) { 
    background = { state: "fail", tip: "Background too busy/textured.", raw: bkgndDensity };
  } else if (bkgndDensity >= 0.08) {
    background = { state: "warn", tip: "Consider a plainer background.", raw: bkgndDensity };
  }

  // 3. Framing Check (Adaptive 1D projection bounding box to filter noise)
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let avgX = 0, avgY = 0, threshX = 0, threshY = 0;
  
  if (totalStrongEdges > 100) {
    avgX = totalStrongEdges / width;
    avgY = totalStrongEdges / height;
    threshX = Math.max(avgX * 1.5, height * 0.02); 
    threshY = Math.max(avgY * 1.5, width * 0.02);

    for (let x = 2; x < width - 2; x++) {
      let val = (xEdges[x-2] + xEdges[x-1] + xEdges[x] + xEdges[x+1] + xEdges[x+2]) / 5;
      if (val > threshX) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    
    for (let y = 2; y < height - 2; y++) {
      let val = (yEdges[y-2] + yEdges[y-1] + yEdges[y] + yEdges[y+1] + yEdges[y+2]) / 5;
      if (val > threshY) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  } else {
    minX = width; maxX = 0; minY = height; maxY = 0;
  }

  const boxArea = Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
  const cardFillRatio = boxArea / numPixels;

  let framing: CheckResult = { state: "pass", tip: "Framing OK", raw: cardFillRatio };
  if (totalStrongEdges < 100 || cardFillRatio === 0) {
    framing = { state: "warn", tip: "Place card inside the rectangle.", raw: cardFillRatio };
  } else {
    if (cardFillRatio < 0.25 || cardFillRatio > 0.85) {
      framing = { state: "fail", tip: "Move card closer or further.", raw: cardFillRatio };
    } else if (cardFillRatio < 0.35 || cardFillRatio > 0.75) {
      framing = { state: "warn", tip: "Almost there, adjust distance.", raw: cardFillRatio };
    }
  }

  // Focus (Laplacian Variance)
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let laplacianCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lTC = lumas[i - width];
      const lML = lumas[i - 1];
      const lMC = lumas[i];
      const lMR = lumas[i + 1];
      const lBC = lumas[i + width];
      const laplacian = lTC + lML + lMR + lBC - 4 * lMC;
      laplacianSum += laplacian;
      laplacianCount++;
    }
  }
  const lapMean = laplacianSum / laplacianCount;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lTC = lumas[i - width];
      const lML = lumas[i - 1];
      const lMC = lumas[i];
      const lMR = lumas[i + 1];
      const lBC = lumas[i + width];
      const laplacian = lTC + lML + lMR + lBC - 4 * lMC;
      laplacianSqSum += (laplacian - lapMean) ** 2;
    }
  }
  const focusVariance = laplacianSqSum / laplacianCount;
  let focus: CheckResult = { state: "pass", tip: "Focus OK", raw: focusVariance };
  if (focusVariance < 100) {
    focus = { state: "fail", tip: "Image is too blurry.", raw: focusVariance };
  } else if (focusVariance < 200) {
    focus = { state: "warn", tip: "Slightly blurry.", raw: focusVariance };
  }

  // Tilt
  let tilt: CheckResult = { state: "pass", tip: "Level" };
  // (We skip calculating visual tilt as we rely entirely on the DeviceOrientation handler in the component now)
  // However, we satisfy the ProcessingResult interface:
  tilt = { state: "pass", tip: "Level", raw: 0 };

  const debug = {
    bgTL, bgTR, bgBL, bgBR,
    fTotalEdges: totalStrongEdges,
    fAvgX: avgX, fAvgY: avgY,
    fThreshX: threshX, fThreshY: threshY,
    fMinX: minX, fMaxX: maxX,
    fMinY: minY, fMaxY: maxY
  };

  return { lighting, background, framing, focus, tilt, debug };
}
