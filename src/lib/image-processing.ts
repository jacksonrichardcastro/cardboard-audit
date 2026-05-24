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
    bkgndMean: number;
    bkgndStdDev: number;
    bkgndScore: number;
    isWhiteBackground: boolean;
    perimeterAvgLuma: number;
    perimeterStdDevLuma: number;
    perimeterAvgSaturation: number;
    
    // Gap 1 Telemetry
    isLowContrast: boolean;
    usedColorFallback: boolean;
    colorForegroundCount: number;
    edgeBox: { x: number, y: number, w: number, h: number };
    colorBox: { x: number, y: number, w: number, h: number } | null;
    
    // Phase 4 Telemetry
    gridDensities: number[];
    gridCols: number;
    gridRows: number;
    validCellCount: number;
    
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

  // 2. Perimeter Stats (for White-Surface Detection and Phase 3 Color Fallback)
  // We need this BEFORE framing so we can use isWhiteBackground and bgMeanRGB for color fallback.
  const marginW = Math.floor(width * 0.03);
  const marginH = Math.floor(height * 0.03);
  
  let sumPerimLuma = 0;
  let sqSumPerimLuma = 0;
  let sumPerimSat = 0;
  let sumPerimR = 0;
  let sumPerimG = 0;
  let sumPerimB = 0;
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
        sumPerimR += r;
        sumPerimG += g;
        sumPerimB += b;
        perimCount++;
      }
    }
  }

  const bgMeanR = sumPerimR / perimCount;
  const bgMeanG = sumPerimG / perimCount;
  const bgMeanB = sumPerimB / perimCount;
  const perimeterAvgLuma = sumPerimLuma / perimCount;
  const perimeterAvgSaturation = sumPerimSat / perimCount;
  const perimeterVarianceLuma = Math.max(0, (sqSumPerimLuma / perimCount) - (perimeterAvgLuma * perimeterAvgLuma));
  const perimeterStdDevLuma = Math.sqrt(perimeterVarianceLuma);

  // Fix F: WHT BKGND threshold relaxation
  const isWhiteBackground = perimeterAvgLuma > 160 && perimeterAvgSaturation < 22;

  // 3. Framing Check (Card Bounding Box Calculation)
  let edgeMinX = width, edgeMaxX = 0, edgeMinY = height, edgeMaxY = 0;
  let avgX = 0, avgY = 0, threshX = 0, threshY = 0;
  
  if (totalStrongEdges > 100) {
    avgX = totalStrongEdges / width;
    avgY = totalStrongEdges / height;
    threshX = Math.max(avgX * 0.5, height * 0.02); 
    threshY = Math.max(avgY * 0.5, width * 0.02);

    for (let x = 2; x < width - 2; x++) {
      let val = (xEdges[x-2] + xEdges[x-1] + xEdges[x] + xEdges[x+1] + xEdges[x+2]) / 5;
      if (val > threshX) {
        if (x < edgeMinX) edgeMinX = x;
        if (x > edgeMaxX) edgeMaxX = x;
      }
    }
    
    for (let y = 2; y < height - 2; y++) {
      let val = (yEdges[y-2] + yEdges[y-1] + yEdges[y] + yEdges[y+1] + yEdges[y+2]) / 5;
      if (val > threshY) {
        if (y < edgeMinY) edgeMinY = y;
        if (y > edgeMaxY) edgeMaxY = y;
      }
    }
  } else {
    edgeMinX = width; edgeMaxX = 0; edgeMinY = height; edgeMaxY = 0;
  }

  const edgeBoxWidth = Math.max(0, edgeMaxX - edgeMinX);
  const edgeBoxHeight = Math.max(0, edgeMaxY - edgeMinY);
  const edgeBoxArea = edgeBoxWidth * edgeBoxHeight;
  const edgeCardFillRatio = edgeBoxArea / numPixels;

  // Phase 3: Color-Clustering Fallback for Low Contrast
  // GAP 1 FIX: Lowered threshold from 0.85 to 0.65 to consistently engage fallback on noisy surfaces
  const isLowContrast = edgeCardFillRatio > 0.65 || isWhiteBackground;
  
  let colorForegroundCount = 0;
  let usedColorFallback = false;
  let minX = edgeMinX, maxX = edgeMaxX, minY = edgeMinY, maxY = edgeMaxY;
  let colorMinX = width, colorMaxX = 0, colorMinY = height, colorMaxY = 0;

  if (isLowContrast) {
    const COLOR_DELTA_THRESHOLD = 45; // Tunable
    const xColorFg = new Float32Array(width);
    const yColorFg = new Float32Array(height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const delta = Math.abs(r - bgMeanR) + Math.abs(g - bgMeanG) + Math.abs(b - bgMeanB);
        
        if (delta > COLOR_DELTA_THRESHOLD) {
          xColorFg[x]++;
          yColorFg[y]++;
          colorForegroundCount++;
        }
      }
    }

    if (colorForegroundCount > 100) {
      const cAvgX = colorForegroundCount / width;
      const cAvgY = colorForegroundCount / height;
      const cThreshX = Math.max(cAvgX * 0.5, height * 0.02);
      const cThreshY = Math.max(cAvgY * 0.5, width * 0.02);

      for (let x = 2; x < width - 2; x++) {
        const val = (xColorFg[x-2] + xColorFg[x-1] + xColorFg[x] + xColorFg[x+1] + xColorFg[x+2]) / 5;
        if (val > cThreshX) {
          if (x < colorMinX) colorMinX = x;
          if (x > colorMaxX) colorMaxX = x;
        }
      }
      for (let y = 2; y < height - 2; y++) {
        const val = (yColorFg[y-2] + yColorFg[y-1] + yColorFg[y] + yColorFg[y+1] + yColorFg[y+2]) / 5;
        if (val > cThreshY) {
          if (y < colorMinY) colorMinY = y;
          if (y > colorMaxY) colorMaxY = y;
        }
      }

      minX = colorMinX; maxX = colorMaxX; minY = colorMinY; maxY = colorMaxY;
      usedColorFallback = true;
    } else {
      minX = width; maxX = 0; minY = height; maxY = 0;
    }
  }

  // Final Framing Validation
  const finalBoxWidth = Math.max(0, maxX - minX);
  const finalBoxHeight = Math.max(0, maxY - minY);
  const finalBoxArea = finalBoxWidth * finalBoxHeight;
  let cardFillRatio = finalBoxArea / numPixels;

  let framing: CheckResult = { state: "pass", tip: "Framing OK", raw: cardFillRatio };

  const MIN_ASPECT_RATIO = 0.45;
  const MAX_ASPECT_RATIO = 0.95;
  const CENTER_TOLERANCE_X = width * 0.15;
  const CENTER_TOLERANCE_Y = height * 0.15;
  const MIN_EDGE_DENSITY = 0.45;

  if (finalBoxArea === 0 || (!usedColorFallback && totalStrongEdges < 100)) {
    framing = { state: "warn", tip: "Place card inside the rectangle.", raw: cardFillRatio };
    cardFillRatio = 0;
  } else {
    const aspectRatio = finalBoxWidth / finalBoxHeight;
    const boxCenterX = minX + finalBoxWidth / 2;
    const boxCenterY = minY + finalBoxHeight / 2;
    const frameCenterX = width / 2;
    const frameCenterY = height / 2;
    
    const isValidAspect = aspectRatio >= MIN_ASPECT_RATIO && aspectRatio <= MAX_ASPECT_RATIO;
    const isCenteredX = Math.abs(boxCenterX - frameCenterX) <= CENTER_TOLERANCE_X;
    const isCenteredY = Math.abs(boxCenterY - frameCenterY) <= CENTER_TOLERANCE_Y;
    
    let hasEnoughEdges = true;
    let edgeDensity = 0;
    if (!usedColorFallback) {
      let edgesInsideBox = 0;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (edgeMap[y * width + x]) edgesInsideBox++;
        }
      }
      edgeDensity = edgesInsideBox / totalStrongEdges;
      hasEnoughEdges = edgeDensity >= MIN_EDGE_DENSITY;
    }

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

  // Fix D: Hallucinated full canvas reject only if BOTH width and height > 90%
  const isHallucinated = (finalBoxWidth / width) > 0.90 && (finalBoxHeight / height) > 0.90;

  // 4. Background Check (Phase 4 RESCOPED: Card-Box-Aware Full-Frame Sampling)
  // Mask the card region out of the processing canvas, add 5% margin to avoid card edges
  const marginMaskX = Math.floor(width * 0.05);
  const marginMaskY = Math.floor(height * 0.05);
  
  let maskMinX = minX;
  let maskMaxX = maxX;
  let maskMinY = minY;
  let maskMaxY = maxY;

  // Fix G: Fall back to a fixed 50% center rectangle when detection hallucinated full-frame
  if (isHallucinated) {
    const overlayPadX = Math.floor(width * 0.20);
    const overlayPadY = Math.floor(height * 0.20);
    maskMinX = overlayPadX;
    maskMaxX = width - overlayPadX;
    maskMinY = overlayPadY;
    maskMaxY = height - overlayPadY;
  }

  const finalMaskMinX = Math.max(0, maskMinX - marginMaskX);
  const finalMaskMaxX = Math.min(width - 1, maskMaxX + marginMaskX);
  const finalMaskMinY = Math.max(0, maskMinY - marginMaskY);
  const finalMaskMaxY = Math.min(height - 1, maskMaxY + marginMaskY);
  
  // 8x8 Grid 
  const GRID_COLS = 8;
  const GRID_ROWS = 8;
  const cellWidth = width / GRID_COLS;
  const cellHeight = height / GRID_ROWS;
  const cellArea = cellWidth * cellHeight;

  const gridEdgesCount = new Float32Array(64);
  const gridValidPixels = new Float32Array(64);

  const hasCardBox = finalBoxArea > 0 || isHallucinated;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (hasCardBox && x >= finalMaskMinX && x <= finalMaskMaxX && y >= finalMaskMinY && y <= finalMaskMaxY) {
        // Skip pixels inside the card mask
        continue;
      }
      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);
      const idx = row * GRID_COLS + col;
      
      // Safety check for boundaries
      if (idx >= 0 && idx < 64) {
        gridValidPixels[idx]++;
        if (edgeMap[y * width + x]) {
          gridEdgesCount[idx]++;
        }
      }
    }
  }

  const gridDensities = new Float32Array(64);
  let sumDensity = 0;
  let validCellCount = 0;

  for (let i = 0; i < 64; i++) {
    // Only consider the cell valid for sampling if at least 25% of it is outside the mask
    if (gridValidPixels[i] > cellArea * 0.25) {
      const density = gridEdgesCount[i] / gridValidPixels[i];
      gridDensities[i] = density;
      sumDensity += density;
      validCellCount++;
    } else {
      gridDensities[i] = -1; // Mark invalid for telemetry
    }
  }

  // Calculate Variance across valid grid cells
  let bkgndScore = 0;
  let meanDensity = 0;
  let stdDevDensity = 0;

  if (validCellCount > 0) {
    meanDensity = sumDensity / validCellCount;
    let sqSumDensity = 0;
    for (let i = 0; i < 64; i++) {
      if (gridDensities[i] !== -1) {
        sqSumDensity += (gridDensities[i] - meanDensity) ** 2;
      }
    }
    stdDevDensity = Math.sqrt(sqSumDensity / validCellCount);
    // BKGND Score formula with 1.5x multiplier
    bkgndScore = meanDensity + (stdDevDensity * 1.5);
  }

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
    // Phase 1.3/Phase 4: Standard edge-density check for non-white surfaces
    // Fix C: Mean density logic changed to AND with variance, thresholds raised
    if (meanDensity >= 0.55 || bkgndScore >= 0.60) { 
      background = { state: "fail", tip: "Background too busy/textured.", raw: Math.max(meanDensity, bkgndScore) };
    } else if (meanDensity >= 0.45 || bkgndScore >= 0.50) {
      background = { state: "warn", tip: "Consider a plainer background.", raw: Math.max(meanDensity, bkgndScore) };
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
    bkgndMean: meanDensity,
    bkgndStdDev: stdDevDensity,
    bkgndScore: bkgndScore,
    isWhiteBackground,
    perimeterAvgLuma,
    perimeterStdDevLuma,
    perimeterAvgSaturation,
    
    // Gap 1 Telemetry
    isLowContrast,
    usedColorFallback,
    colorForegroundCount,
    edgeBox: { x: edgeMinX, y: edgeMinY, w: edgeMaxX - edgeMinX, h: edgeMaxY - edgeMinY },
    colorBox: usedColorFallback ? { x: colorMinX, y: colorMinY, w: colorMaxX - colorMinX, h: colorMaxY - colorMinY } : null,
    
    // Phase 4 Telemetry
    gridDensities: Array.from(gridDensities),
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    validCellCount: validCellCount,
    
    fTotalEdges: totalStrongEdges,
    fAvgX: avgX, fAvgY: avgY,
    fThreshX: threshX, fThreshY: threshY,
    fMinX: minX, fMaxX: maxX,
    fMinY: minY, fMaxY: maxY,
  };

  return { lighting, background, framing, focus, tilt, debug };
}
