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
    bkgndZones: number[];
    bkgndRects: {x: number, y: number, w: number, h: number}[];
    bkgndMean: number;
    bkgndStdDev: number;
    bkgndScore: number;
    isWhiteBackground: boolean;
    perimeterAvgLuma: number;
    perimeterStdDevLuma: number;
    perimeterAvgSaturation: number;
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

  // 2. Background Check (Multi-zone perimeter sampling - Phase 1)
  // Fix 6b: Shrink margin to 3% so it samples the OUTSIDE of the p-4 (4.1%) framing guide, avoiding card overlap
  const marginW = Math.floor(width * 0.03);
  const marginH = Math.floor(height * 0.03);
  
  const zoneCounts = new Float32Array(8);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edgeMap[y * width + x]) {
        if (y < marginH) {
          if (x < marginW) zoneCounts[0]++; // TL
          else if (x >= width - marginW) zoneCounts[2]++; // TR
          else zoneCounts[1]++; // TC
        } else if (y >= height - marginH) {
          if (x < marginW) zoneCounts[5]++; // BL
          else if (x >= width - marginW) zoneCounts[7]++; // BR
          else zoneCounts[6]++; // BC
        } else {
          if (x < marginW) zoneCounts[3]++; // ML
          else if (x >= width - marginW) zoneCounts[4]++; // MR
        }
      }
    }
  }
  
  const cornerArea = marginW * marginH;
  const tcBcArea = (width - 2 * marginW) * marginH;
  const mlMrArea = marginW * (height - 2 * marginH);
  
  const zoneDensities = new Float32Array([
    zoneCounts[0] / cornerArea,
    zoneCounts[1] / tcBcArea,
    zoneCounts[2] / cornerArea,
    zoneCounts[3] / mlMrArea,
    zoneCounts[4] / mlMrArea,
    zoneCounts[5] / cornerArea,
    zoneCounts[6] / tcBcArea,
    zoneCounts[7] / cornerArea
  ]);
  
  let sumDensity = 0;
  for (let i = 0; i < 8; i++) {
    sumDensity += zoneDensities[i];
  }
  const meanDensity = sumDensity / 8;
  
  let sqSumDensity = 0;
  for (let i = 0; i < 8; i++) {
    sqSumDensity += (zoneDensities[i] - meanDensity) ** 2;
  }
  const stdDevDensity = Math.sqrt(sqSumDensity / 8);
  
  // BKGND Score penalizes high variance between zones (busy backgrounds like chairs/keyboards)
  // while allowing higher uniform density (cork, wood)
  const bkgndScore = meanDensity + (stdDevDensity * 3.0);

  // Calculate perimeter luma and saturation stats for Phase 2 (White-Surface Detection)
  let sumPerimLuma = 0;
  let sqSumPerimLuma = 0;
  let sumPerimSat = 0;
  let perimCount = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isPerim = (y < marginH || y >= height - marginH || x < marginW || x >= width - marginW);
      if (isPerim) {
        const i = y * width + x;
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        
        const luma = lumas[i];
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC - minC;
        
        sumPerimLuma += luma;
        sqSumPerimLuma += luma * luma;
        sumPerimSat += sat;
        perimCount++;
      }
    }
  }

  const perimeterAvgLuma = sumPerimLuma / perimCount;
  const perimeterAvgSaturation = sumPerimSat / perimCount;
  // Variance = E[X^2] - E[X]^2
  const perimeterVarianceLuma = Math.max(0, (sqSumPerimLuma / perimCount) - (perimeterAvgLuma * perimeterAvgLuma));
  const perimeterStdDevLuma = Math.sqrt(perimeterVarianceLuma);

  // Both bright enough AND monochromatic (white)
  const isWhiteBackground = perimeterAvgLuma > 140 && perimeterAvgSaturation < 30;

  let background: CheckResult = { state: "pass", tip: "Background OK", raw: bkgndScore };
  
  if (isWhiteBackground) {
    // Phase 2: Override edge-density BKGND check for white surfaces
    if (perimeterStdDevLuma >= 25) {
      background = { state: "fail", tip: "White background too shadowed/uneven.", raw: perimeterStdDevLuma };
    } else if (perimeterStdDevLuma >= 15) {
      background = { state: "warn", tip: "Smooth out white background.", raw: perimeterStdDevLuma };
    } else {
      background = { state: "pass", tip: "White background OK", raw: perimeterStdDevLuma };
    }
  } else {
    // Phase 1.3: Standard edge-density check for non-white surfaces
    if (bkgndScore >= 0.50) { 
      background = { state: "fail", tip: "Background too busy/textured.", raw: bkgndScore };
    } else if (bkgndScore >= 0.35) {
      background = { state: "warn", tip: "Consider a plainer background.", raw: bkgndScore };
    }
  }
  
  // Map corner densities to debug output to satisfy interface
  const bgTL = zoneDensities[0];
  const bgTR = zoneDensities[2];
  const bgBL = zoneDensities[5];
  const bgBR = zoneDensities[7];

  // 3. Framing Check (Adaptive 1D projection bounding box to filter noise)
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let avgX = 0, avgY = 0, threshX = 0, threshY = 0;
  
  if (totalStrongEdges > 100) {
    avgX = totalStrongEdges / width;
    avgY = totalStrongEdges / height;
    threshX = Math.max(avgX * 0.5, height * 0.02); 
    threshY = Math.max(avgY * 0.5, width * 0.02);

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

  const boxWidth = Math.max(0, maxX - minX);
  const boxHeight = Math.max(0, maxY - minY);
  const boxArea = boxWidth * boxHeight;
  let cardFillRatio = boxArea / numPixels;

  let framing: CheckResult = { state: "pass", tip: "Framing OK", raw: cardFillRatio };

  // MVP Validation Layer Constants (Tuned May 23)
  const MIN_ASPECT_RATIO = 0.45;
  const MAX_ASPECT_RATIO = 0.95;
  const CENTER_TOLERANCE_X = width * 0.15; // 15% tolerance from center
  const CENTER_TOLERANCE_Y = height * 0.15;
  const MIN_EDGE_DENSITY = 0.45;

  if (totalStrongEdges < 100 || boxArea === 0) {
    framing = { state: "warn", tip: "Place card inside the rectangle.", raw: cardFillRatio };
    cardFillRatio = 0;
  } else {
    const aspectRatio = boxWidth / boxHeight;
    const boxCenterX = minX + boxWidth / 2;
    const boxCenterY = minY + boxHeight / 2;
    const frameCenterX = width / 2;
    const frameCenterY = height / 2;
    
    // Count edges strictly inside the bounding box
    let edgesInsideBox = 0;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (edgeMap[y * width + x]) edgesInsideBox++;
      }
    }
    const edgeDensity = edgesInsideBox / totalStrongEdges;

    // Validate properties
    const isValidAspect = aspectRatio >= MIN_ASPECT_RATIO && aspectRatio <= MAX_ASPECT_RATIO;
    const isCenteredX = Math.abs(boxCenterX - frameCenterX) <= CENTER_TOLERANCE_X;
    const isCenteredY = Math.abs(boxCenterY - frameCenterY) <= CENTER_TOLERANCE_Y;
    const hasEnoughEdges = edgeDensity >= MIN_EDGE_DENSITY;

    if (!isValidAspect) {
      framing = { state: "fail", tip: "Card cut off or wrong shape.", raw: aspectRatio };
      cardFillRatio = 0;
    } else if (!isCenteredX || !isCenteredY) {
      framing = { state: "fail", tip: "Center the card in the frame.", raw: cardFillRatio };
      cardFillRatio = 0;
    } else if (!hasEnoughEdges) {
      framing = { state: "fail", tip: "Card not clearly detected.", raw: edgeDensity };
      cardFillRatio = 0;
    } else {
      if (cardFillRatio < 0.25 || cardFillRatio > 0.85) {
        framing = { state: "fail", tip: "Move card closer or further.", raw: cardFillRatio };
      } else if (cardFillRatio < 0.35 || cardFillRatio > 0.75) {
        framing = { state: "warn", tip: "Almost there, adjust distance.", raw: cardFillRatio };
      }
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
    fMinY: minY, fMaxY: maxY,
    bkgndZones: Array.from(zoneDensities),
    bkgndRects: [
      { x: 0, y: 0, w: (marginW/width)*100, h: (marginH/height)*100 }, // TL
      { x: (marginW/width)*100, y: 0, w: ((width - 2*marginW)/width)*100, h: (marginH/height)*100 }, // TC
      { x: ((width - marginW)/width)*100, y: 0, w: (marginW/width)*100, h: (marginH/height)*100 }, // TR
      { x: 0, y: (marginH/height)*100, w: (marginW/width)*100, h: ((height - 2*marginH)/height)*100 }, // ML
      { x: ((width - marginW)/width)*100, y: (marginH/height)*100, w: (marginW/width)*100, h: ((height - 2*marginH)/height)*100 }, // MR
      { x: 0, y: ((height - marginH)/height)*100, w: (marginW/width)*100, h: (marginH/height)*100 }, // BL
      { x: (marginW/width)*100, y: ((height - marginH)/height)*100, w: ((width - 2*marginW)/width)*100, h: (marginH/height)*100 }, // BC
      { x: ((width - marginW)/width)*100, y: ((height - marginH)/height)*100, w: (marginW/width)*100, h: (marginH/height)*100 }  // BR
    ],
    bkgndMean: meanDensity,
    bkgndStdDev: stdDevDensity,
    bkgndScore: bkgndScore,
    isWhiteBackground,
    perimeterAvgLuma,
    perimeterStdDevLuma,
    perimeterAvgSaturation
  };

  return { lighting, background, framing, focus, tilt, debug };
}
