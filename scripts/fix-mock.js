const fs = require('fs');
let content = fs.readFileSync('src/lib/mock/listings.ts', 'utf8');

content = content.replace(/\{ id: "mock-(\d+)", title: "(.*?)", photoUrl: ""/g, (match, id, title) => {
  const shortTitle = title.split(' ').slice(-3).join('+').replace(/[^a-zA-Z0-9+]/g, '');
  return `{ id: "mock-${id}", title: "${title}", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=${shortTitle}"`;
});

fs.writeFileSync('src/lib/mock/listings.ts', content);
console.log("Mock listings updated!");
