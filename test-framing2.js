const width = 300;
const height = 400;
const numPixels = width * height;

function testVarianceFraming(scenario, edgeCoords) {
  let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
  let count = edgeCoords.length;
  
  if (count === 0) return console.log(`${scenario} -> NO EDGES`);

  for (let p of edgeCoords) {
    sumX += p.x; sumY += p.y;
    sumX2 += p.x*p.x; sumY2 += p.y*p.y;
  }
  
  let meanX = sumX / count;
  let meanY = sumY / count;
  let varX = sumX2 / count - meanX*meanX;
  let varY = sumY2 / count - meanY*meanY;
  
  let stdX = Math.sqrt(varX);
  let stdY = Math.sqrt(varY);
  
  let estWidth = stdX * 3.46;
  let estHeight = stdY * 3.46;
  let fillRatio = (estWidth * estHeight) / numPixels;
  
  console.log(`${scenario} -> stdX:${stdX.toFixed(1)} stdY:${stdY.toFixed(1)} FillRatio:${fillRatio.toFixed(4)}`);
}

function makeCard(x1, x2, y1, y2, tilt = 0) {
  let coords = [];
  // top and bottom
  for (let x = x1; x <= x2; x++) { coords.push({x, y: y1}); coords.push({x, y: y2}); }
  // left and right
  for (let y = y1; y <= y2; y++) { coords.push({x: x1, y}); coords.push({x: x2, y}); }
  return coords;
}

function addNoise(coords, count) {
  for (let i = 0; i < count; i++) {
    coords.push({x: Math.random() * width, y: Math.random() * height});
  }
  return coords;
}

testVarianceFraming("Perfect Card", makeCard(30, 270, 40, 360));
testVarianceFraming("Perfect Card + Heavy Noise", addNoise(makeCard(30, 270, 40, 360), 200));
testVarianceFraming("Small Card", makeCard(100, 200, 150, 250));
testVarianceFraming("Small Card + Heavy Noise", addNoise(makeCard(100, 200, 150, 250), 200));
testVarianceFraming("Half Off Screen", makeCard(150, 350, 40, 360)); // Card right edge is off screen
