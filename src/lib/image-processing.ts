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
  
  // Approximation for median (sort a downsampled array for speed)
  const sampleSize = Math.min(1000, numPixels);
  const stride = Math.floor(numPixels / sampleSize);
  const sampledLumas = [];
  for (let i = 0; i < numPixels; i += stride) {
    sampledLumas.push(lumas[i]);
  }
  sampledLumas.sort((a, b) => a - b);
  const medianLuma = sampledLumas[Math.floor(sampledLumas.length / 2)];

  const glarePercent = glareCount / numPixels;
  let lighting: CheckResult = { state: "pass", tip: "Lighting OK", raw: glarePercent };
  if (glarePercent > 0.005) {
    lighting = { state: "fail", tip: "Too much glare. Adjust angle.", raw: glarePercent };
  } else if (glarePercent > 0.002) {
    lighting = { state: "warn", tip: "Minor glare detected.", raw: glarePercent };
  } else if (meanLuma < 40) {
    lighting = { state: "fail", tip: "Too dark. Add more light.", raw: meanLuma };
  } else if (meanLuma > 180) {
    lighting = { state: "fail", tip: "Washed out. Reduce light.", raw: meanLuma };
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
  
  console.log("[BKGND] stddevBg:", stddevBg.toFixed(2));
  
  let background: CheckResult = { state: "pass", tip: "Background OK", raw: stddevBg };
  if (stddevBg >= 60) {
    background = { state: "fail", tip: "Background too busy/textured.", raw: stddevBg };
  } else if (stddevBg >= 30) {
    background = { state: "warn", tip: "Consider a plainer background.", raw: stddevBg };
  }

  // 3 & 4. Framing and Visual Tilt (Sobel)
  const angles: number[] = new Array(180).fill(0); // Bins for 0-179 degrees
  let strongEdges = 0;
  
  const xEdges = new Int32Array(width);
  const yEdges = new Int32Array(height);

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
        xEdges[x]++;
        yEdges[y]++;
        
        let angle = Math.atan2(gy, gx) * 180 / Math.PI;
        if (angle < 0) angle += 180;
        angles[Math.floor(angle)]++;
      }
    }
  }

  // Robust Bounding Box using density filter to ignore noise
  let minX = width, maxX = 0, minY = height, maxY = 0;
  if (strongEdges > 0) {
    const minColEdges = height * 0.02; // At least 2% of the column must be edges
    for (let x = 0; x < width; x++) {
      if (xEdges[x] > minColEdges) {
        if (minX === width) minX = x;
        maxX = x;
      }
    }
    
    const minRowEdges = width * 0.02; // At least 2% of the row must be edges
    for (let y = 0; y < height; y++) {
      if (yEdges[y] > minRowEdges) {
        if (minY === height) minY = y;
        maxY = y;
      }
    }
    
    // Fallback if density filter is too strict
    if (minX >= maxX) { minX = 0; maxX = width; }
    if (minY >= maxY) { minY = 0; maxY = height; }
  }

  // Framing
  let framing: CheckResult = { state: "pass", tip: "Framing OK", raw: 0 };
  const boxArea = (maxX - minX) * (maxY - minY);
  const fraction = boxArea / numPixels;
  framing.raw = fraction;

  if (strongEdges < 50) {
    framing = { state: "warn", tip: "Place card inside the rectangle.", raw: fraction };
  } else {
    if (fraction < 0.2 || fraction > 0.85) {
      framing = { state: "fail", tip: "Move card closer or further.", raw: fraction };
    } else if (fraction < 0.3 || fraction > 0.7) {
      framing = { state: "warn", tip: "Almost there, adjust distance.", raw: fraction };
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
      tilt = { state: "fail", tip: "Card is tilted. Please level it.", raw: deviation };
    } else if (deviation > 5) {
      tilt = { state: "warn", tip: "Card slightly tilted.", raw: deviation };
    } else {
      tilt = { state: "pass", tip: "Level", raw: deviation };
    }
  } else {
    tilt = { state: "warn", tip: "No edges detected.", raw: 0 };
  }

  return { lighting, background, framing, focus, tilt };
}
