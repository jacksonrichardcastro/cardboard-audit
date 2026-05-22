const width = 300;
const height = 400;
const numPixels = width * height;

function testFraming(scenario, xEdgesHigh, yEdgesHigh, highEdgesCount) {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  
  if (highEdgesCount > 100) {
    const avgX = highEdgesCount / width;
    const avgY = highEdgesCount / height;
    const threshX = Math.max(avgX * 1.5, height * 0.02); 
    const threshY = Math.max(avgY * 1.5, width * 0.02);

    for (let x = 2; x < width - 2; x++) {
      let val = (xEdgesHigh[x-2] + xEdgesHigh[x-1] + xEdgesHigh[x] + xEdgesHigh[x+1] + xEdgesHigh[x+2]) / 5;
      if (val > threshX) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    
    for (let y = 2; y < height - 2; y++) {
      let val = (yEdgesHigh[y-2] + yEdgesHigh[y-1] + yEdgesHigh[y] + yEdgesHigh[y+1] + yEdgesHigh[y+2]) / 5;
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
  console.log(`${scenario} -> minX:${minX} maxX:${maxX} minY:${minY} maxY:${maxY} FillRatio:${cardFillRatio.toFixed(4)}`);
}

function makeScenario(x1, x2, y1, y2, noiseCount) {
  let xEdges = new Int32Array(width);
  let yEdges = new Int32Array(height);
  let total = 0;
  
  // Card edges
  for(let x=x1; x<=x2; x++) { xEdges[x]+=2; yEdges[y1]++; yEdges[y2]++; total+=4; }
  for(let y=y1; y<=y2; y++) { yEdges[y]+=2; xEdges[x1]++; xEdges[x2]++; total+=4; }
  
  // Noise
  for(let i=0; i<noiseCount; i++) {
    xEdges[Math.floor(Math.random()*width)]++;
    yEdges[Math.floor(Math.random()*height)]++;
    total++;
  }
  
  return {x: xEdges, y: yEdges, t: total};
}

let s1 = makeScenario(30, 270, 40, 360, 0);
testFraming("Perfect Card", s1.x, s1.y, s1.t);

let s2 = makeScenario(30, 270, 40, 360, 4000); // Heavy noise
testFraming("Perfect Card + Noise", s2.x, s2.y, s2.t);

let s3 = makeScenario(100, 200, 150, 250, 0);
testFraming("Small Card", s3.x, s3.y, s3.t);

let s4 = makeScenario(100, 200, 150, 250, 4000); // Noise overrides small card signal?
testFraming("Small Card + Noise", s4.x, s4.y, s4.t);

let s5 = makeScenario(0, 0, 0, 0, 4000);
testFraming("Just Noise", s5.x, s5.y, s5.t);
