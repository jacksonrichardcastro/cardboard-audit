const fs = require('fs');

const sportsCards = [
  { title: "2018 Panini Prizm Silver Prizm Luka Doncic", photoUrl: "/mock/card_luka_doncic.png", subcategory: "Basketball", grade: "10" },
  { title: "2023 Topps Chrome Update Sapphire Aaron Judge", photoUrl: "/mock/card_aaron_judge.png", subcategory: "Baseball", grade: "10" },
  { title: "2015 Upper Deck Connor McDavid Young Guns", photoUrl: "/mock/card_connor_mcdavid.png", subcategory: "Hockey", grade: "10" },
  { title: "2009 Bowman Chrome Mike Trout", photoUrl: "/mock/card_mike_trout.png", subcategory: "Baseball", grade: "9.5" },
  { title: "1986 Fleer Michael Jordan Rookie #57", photoUrl: "/mock/card_jordan.png", subcategory: "Basketball", grade: "10" },
  { title: "2000 Playoff Contenders Tom Brady Rookie Ticket Auto", photoUrl: "/mock/card_brady.png", subcategory: "Football", grade: "9" },
  { title: "2014 Panini Prizm World Cup Lionel Messi", photoUrl: "/mock/card_messi.png", subcategory: "Soccer", grade: "10" },
  { title: "2020 Panini Donruss Optic Justin Herbert", photoUrl: "/mock/card_herbert.png", subcategory: "Football", grade: "10" },
  { title: "2017 Panini Prizm Patrick Mahomes", photoUrl: "/mock/card_mahomes.png", subcategory: "Football", grade: "10" },
  { title: "2003 Topps Chrome LeBron James", photoUrl: "/mock/card_lebron.png", subcategory: "Basketball", grade: "10" }
];

const pokemonCards = [
  { title: "1999 Pokemon Base Set Charizard Holo", photoUrl: "/mock/card_charizard.png" },
  { title: "Pokemon 151 Charizard ex Special Illustration Rare", photoUrl: "https://images.pokemontcg.io/sv3pt5/199_hires.png" },
  { title: "Lugia V Alternate Full Art", photoUrl: "https://images.pokemontcg.io/swsh12/186_hires.png" },
  { title: "Blaziken VMAX Alternate Secret Art", photoUrl: "https://images.pokemontcg.io/swsh6/201_hires.png" },
  { title: "Charizard VMAX Secret Rare", photoUrl: "https://images.pokemontcg.io/swsh9/154_hires.png" },
  { title: "Mew VMAX Alternate Art Secret", photoUrl: "https://images.pokemontcg.io/swsh8/271_hires.png" },
  { title: "Charizard ex Special Illustration Rare", photoUrl: "https://images.pokemontcg.io/sv3/223_hires.png" },
  { title: "Umbreon VMAX Alternate Art Secret", photoUrl: "https://images.pokemontcg.io/swsh7/215_hires.png" },
  { title: "Giratina V Alternate Full Art", photoUrl: "https://images.pokemontcg.io/swsh11/186_hires.png" }
];

let interleaved = [];
for (let i = 0; i < 10; i++) {
  interleaved.push({
    id: 100 + i * 2,
    title: sportsCards[i].title,
    category: "Sports",
    subcategory: sportsCards[i].subcategory,
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: sportsCards[i].grade,
    priceCents: Math.floor(Math.random() * 5000000) + 100000,
    photoUrl: sportsCards[i].photoUrl,
    sellerBusinessName: i % 2 === 0 ? "Alex The Grader" : "Storefront Test Shop",
    createdAt: "2026-05-26T10:00:00Z"
  });
  if (i < 9) {
    interleaved.push({
      id: 101 + i * 2,
      title: pokemonCards[i].title,
      category: "Graded",
      subcategory: "Pokemon",
      condition: "Gem Mint",
      gradingCompany: "PSA",
      grade: "10",
      priceCents: Math.floor(Math.random() * 5000000) + 100000,
      photoUrl: pokemonCards[i].photoUrl,
      sellerBusinessName: i % 2 === 0 ? "Storefront Test Shop" : "Alex The Grader",
      createdAt: "2026-05-26T09:30:00Z"
    });
  }
}

// Write the first 19 to a new file, and append the rest of the old listings.ts skipping the old custom ones
let content = fs.readFileSync('src/lib/mock/listings.ts', 'utf8');
const restMatch = content.match(/\/\/\s*100%\s*POKEMON\s*WITH\s*ACCURATE\s*IMAGES[\s\S]*/);

const newFileContent = `export type MockListing = {
  id: number;
  title: string;
  category: "Sports" | "TCG" | "Graded";
  subcategory: string;
  condition: string;
  gradingCompany?: string;
  grade?: string;
  priceCents: number;
  photoUrl: string;
  sellerBusinessName: string;
  createdAt: string;
  set?: string;
  year?: string;
  cardNumber?: string;
  description?: string;
};

export const mockListings: MockListing[] = [
  // --- RECENTLY ADDED (19 Alternating Cards) ---
${interleaved.map(item => `  ${JSON.stringify(item, null, 2).split('\\n').join('\\n  ')}`).join(',\n')},
  ${restMatch[0]}
`;

fs.writeFileSync('src/lib/mock/listings.ts', newFileContent);
