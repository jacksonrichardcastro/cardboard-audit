const width = 300;
const height = 400;
const numPixels = width * height;

function testFraming(scenario, xEdgesHigh, yEdgesHigh, highEdgesCount) {
  let minX = 0, maxX = width, minY = 0, maxY = height;
  if (highEdgesCount > 100) {
    const colThresh = height * 0.03; 
    const rowThresh = width * 0.03;

    while (minX < width / 2 && xEdgesHigh[minX] < colThresh) minX++;
    while (maxX > width / 2 && xEdgesHigh[maxX - 1] < colThresh) maxX--;
    
    while (minY < height / 2 && yEdgesHigh[minY] < rowThresh) minY++;
    while (maxY > height / 2 && yEdgesHigh[maxY - 1] < rowThresh) maxY--;
  } else {
    minX = width; maxX = 0; minY = height; maxY = 0;
  }

  const boxArea = Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
  const cardFillRatio = boxArea / numPixels;
  console.log(`${scenario} -> minX:${minX} maxX:${maxX} minY:${minY} maxY:${maxY} FillRatio:${cardFillRatio.toFixed(4)}`);
}

// Scenario 1: Perfect card (edges at x=30, x=270, y=40, y=360)
let x1 = new Int32Array(width);
let y1 = new Int32Array(height);
x1[30] = 300; x1[270] = 300;
y1[40] = 200; y1[360] = 200;
testFraming("Perfect Card", x1, y1, 1000);

// Scenario 2: Noise everywhere
let x2 = new Int32Array(width);
let y2 = new Int32Array(height);
for(let i=0; i<width; i++) x2[i] = height * 0.04; // 4% noise everywhere
for(let i=0; i<height; i++) y2[i] = width * 0.04;
testFraming("Uniform Noise", x2, y2, 2000);

// Scenario 3: Small card (edges at x=100, x=200, y=150, y=250)
let x3 = new Int32Array(width);
let y3 = new Int32Array(height);
x3[100] = 100; x3[200] = 100;
y3[150] = 100; y3[250] = 100;
testFraming("Small Card", x3, y3, 400);

