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

  // 2. Background & Framing Check (using edge regions instead of color variance)
  // Define Center region (50% of width/height, 25% of area)
  // Outer perimeter region is the rest.
  const cxStart = Math.floor(width * 0.25);
  const cxEnd = Math.floor(width * 0.75);
  const cyStart = Math.floor(height * 0.25);
  const cyEnd = Math.floor(height * 0.75);
  
  const centerArea = (cxEnd - cxStart) * (cyEnd - cyStart);
  const perimeterArea = numPixels - centerArea;
  
  let centerEdges = 0;
  for (let y = cyStart; y < cyEnd; y++) {
    for (let x = cxStart; x < cxEnd; x++) {
      if (edgeMap[y * width + x]) centerEdges++;
    }
  }
  const perimeterEdges = totalStrongEdges - centerEdges;
  
  const perimeterEdgeDensity = perimeterEdges / perimeterArea;
  const centerEdgeDensity = centerEdges / centerArea;
  const edgeDensityRatio = centerEdgeDensity / (perimeterEdgeDensity || 0.0001);

  // Background is now determined strictly by perimeter edge density (texture/busyness)
  let background: CheckResult = { state: "pass", tip: "Background OK", raw: perimeterEdgeDensity };
  if (perimeterEdgeDensity >= 0.15) { // 15% of perimeter pixels are edges
    background = { state: "fail", tip: "Background too busy/textured.", raw: perimeterEdgeDensity };
  } else if (perimeterEdgeDensity >= 0.08) {
    background = { state: "warn", tip: "Consider a plainer background.", raw: perimeterEdgeDensity };
  }

  // Framing relies on the ratio of center edges to perimeter edges
  let framing: CheckResult = { state: "pass", tip: "Framing OK", raw: edgeDensityRatio };
  if (totalStrongEdges < 100) {
    framing = { state: "warn", tip: "Place card inside the rectangle.", raw: edgeDensityRatio };
  } else {
    // If the card is perfectly framed, center density will be massive compared to perimeter.
    if (edgeDensityRatio < 1.5) {
      framing = { state: "fail", tip: "Move card closer or further.", raw: edgeDensityRatio };
    } else if (edgeDensityRatio < 2.5) {
      framing = { state: "warn", tip: "Almost there, center the card.", raw: edgeDensityRatio };
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

  return { lighting, background, framing, focus, tilt };
}
