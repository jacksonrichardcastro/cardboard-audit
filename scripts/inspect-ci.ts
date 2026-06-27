import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('/tmp/ci-2026.html', 'utf-8');
const $ = cheerio.load(html);

// Remove ebay links or script tags
$('script, style, noscript, .yuki-social-link, img').remove();

const content = $('.entry-content').text();
const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

// Find first card line
const firstCardIndex = lines.findIndex(l => /^\d+\s+.+ - .+/.test(l));
if (firstCardIndex !== -1) {
  console.log("Found cards!");
  console.log(lines.slice(firstCardIndex, firstCardIndex + 20).join('\n'));
} else {
  // maybe letters like US1 ?
  const altIndex = lines.findIndex(l => /^[A-Z0-9-]+\s+.+ - .+/.test(l));
  if (altIndex !== -1) {
    console.log("Found cards with alt regex!");
    console.log(lines.slice(altIndex, altIndex + 20).join('\n'));
  } else {
    console.log("Could not find cards in .entry-content");
  }
}

// Find parallels
const parallels = lines.filter(l => /^\S.*\s+((?:1:\d+|1\/1|\/\d+))/.test(l) || /^\S.*\s+\(\d+:\d+/.test(l));
console.log("\nSome parallels found:");
console.log(parallels.slice(0, 10).join('\n'));

