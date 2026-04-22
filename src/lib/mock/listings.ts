export type MockListing = {
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
};

export const mockListings: MockListing[] = [
  {
    id: 1,
    title: "1999 Pokemon Base Set Charizard Holo Rare",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 1250000,
    photoUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    sellerBusinessName: "VaultCard Collectibles",
    createdAt: "2026-04-20T10:00:00Z"
  },
  {
    id: 2,
    title: "1999 Pokemon Base Set Pikachu 1st Edition",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Near Mint",
    priceCents: 25000,
    photoUrl: "https://images.pokemontcg.io/base1/58_hires.png",
    sellerBusinessName: "PokeMaster Store",
    createdAt: "2026-04-21T14:30:00Z"
  },
  {
    id: 3,
    title: "2023 Topps Chrome Victor Wembanyama Rookie Auto",
    category: "Graded",
    subcategory: "Basketball",
    condition: "Gem Mint",
    gradingCompany: "BGS",
    grade: "9.5",
    priceCents: 520000,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/T206_Honus_Wagner.jpg/220px-T206_Honus_Wagner.jpg", // Representing sports using canonical wiki domain
    sellerBusinessName: "RookieHype NBA",
    createdAt: "2026-04-22T08:30:00Z"
  },
  {
    id: 4,
    title: "2020 Pokemon Sword & Shield Pikachu VMAX Secret",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Mint",
    gradingCompany: "CGC",
    grade: "9",
    priceCents: 15500,
    photoUrl: "https://images.pokemontcg.io/swsh4/188_hires.png",
    sellerBusinessName: "TCG Infinite",
    createdAt: "2026-04-18T11:00:00Z"
  },
  {
    id: 5,
    title: "1952 Topps Mickey Mantle #311 Rookie",
    category: "Sports",
    subcategory: "Baseball",
    condition: "Excellent",
    gradingCompany: "PSA",
    grade: "5",
    priceCents: 1850000,
    photoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/30/1952_Topps_Mickey_Mantle.jpg/220px-1952_Topps_Mickey_Mantle.jpg",
    sellerBusinessName: "Vintage Sluggers",
    createdAt: "2026-04-15T09:20:00Z"
  },
  {
    id: 6,
    title: "Base Set Blastoise Shadowless Holo",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Lightly Played",
    priceCents: 120000,
    photoUrl: "https://images.pokemontcg.io/base1/2_hires.png",
    sellerBusinessName: "Kanto Cards",
    createdAt: "2026-04-19T13:45:00Z"
  },
  {
    id: 7,
    title: "Base Set Venusaur Holo",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Near Mint",
    priceCents: 85000,
    photoUrl: "https://images.pokemontcg.io/base1/15_hires.png",
    sellerBusinessName: "Kanto Cards",
    createdAt: "2026-04-19T13:50:00Z"
  },
  {
    id: 8,
    title: "2003 Upper Deck Lebron James Rookie Exquisite",
    category: "Sports",
    subcategory: "Basketball",
    condition: "Near Mint",
    priceCents: 800000,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/T206_Honus_Wagner.jpg/220px-T206_Honus_Wagner.jpg",
    sellerBusinessName: "CourtKings",
    createdAt: "2026-04-17T16:15:00Z"
  },
  {
    id: 9,
    title: "2022 Pokemon Brilliant Stars Charizard V Alt",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Mint",
    priceCents: 21000,
    photoUrl: "https://images.pokemontcg.io/swsh9/154_hires.png",
    sellerBusinessName: "TCG Infinite",
    createdAt: "2026-04-21T09:10:00Z"
  },
  {
    id: 10,
    title: "1999 Jungle Snorlax Holo Rare",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Mint",
    gradingCompany: "PSA",
    grade: "9",
    priceCents: 45000,
    photoUrl: "https://images.pokemontcg.io/base2/11_hires.png",
    sellerBusinessName: "Snorlax Sleeps",
    createdAt: "2026-04-20T11:20:00Z"
  },
  {
    id: 11,
    title: "Panini Prizm Patrick Mahomes Rookie RC #269",
    category: "Graded",
    subcategory: "Football",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 1150000,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/T206_Honus_Wagner.jpg/220px-T206_Honus_Wagner.jpg",
    sellerBusinessName: "Gridiron Grades",
    createdAt: "2026-04-16T18:40:00Z"
  },
  {
    id: 12,
    title: "Mewtwo Base Set Shadowless",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Moderately Played",
    priceCents: 9500,
    photoUrl: "https://images.pokemontcg.io/base1/10_hires.png",
    sellerBusinessName: "Rocket Collectibles",
    createdAt: "2026-04-22T07:15:00Z"
  },
  {
    id: 13,
    title: "Umbreon VMAX Evolving Skies Alt Art",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 98000,
    photoUrl: "https://images.pokemontcg.io/swsh7/215_hires.png",
    sellerBusinessName: "Eevee Emporium",
    createdAt: "2026-04-21T10:05:00Z"
  },
  {
    id: 14,
    title: "2000 Neo Genesis Lugia 1st Edition Holo",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "BGS",
    grade: "9.5",
    priceCents: 350000,
    photoUrl: "https://images.pokemontcg.io/neo1/9_hires.png",
    sellerBusinessName: "Johto Exclusives",
    createdAt: "2026-04-18T14:20:00Z"
  },
  {
    id: 15,
    title: "2018 Bowman Chrome Shohei Ohtani Auto",
    category: "Sports",
    subcategory: "Baseball",
    condition: "Near Mint",
    priceCents: 245000,
    photoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/30/1952_Topps_Mickey_Mantle.jpg/220px-1952_Topps_Mickey_Mantle.jpg",
    sellerBusinessName: "Diamond Deals",
    createdAt: "2026-04-17T09:30:00Z"
  },
  {
    id: 16,
    title: "Gengar Fossil Set 1st Edition",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Heavy Play",
    priceCents: 4500,
    photoUrl: "https://images.pokemontcg.io/base3/5_hires.png",
    sellerBusinessName: "Spooky Cards",
    createdAt: "2026-04-21T16:00:00Z"
  },
  {
    id: 17,
    title: "Rayquaza Gold Star Deoxys Series",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Near Mint",
    gradingCompany: "PSA",
    grade: "8",
    priceCents: 450000,
    photoUrl: "https://images.pokemontcg.io/ex8/107_hires.png",
    sellerBusinessName: "Dragon Hoard",
    createdAt: "2026-04-15T12:00:00Z"
  },
  {
    id: 18,
    title: "Michael Jordan 1986 Fleer Rookie",
    category: "Graded",
    subcategory: "Basketball",
    condition: "Excellent",
    gradingCompany: "PSA",
    grade: "6",
    priceCents: 950000,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/T206_Honus_Wagner.jpg/220px-T206_Honus_Wagner.jpg",
    sellerBusinessName: "Chicago Court",
    createdAt: "2026-04-14T08:45:00Z"
  },
  {
    id: 19,
    title: "Giratina V Alt Art Lost Origin",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Mint",
    priceCents: 28000,
    photoUrl: "https://images.pokemontcg.io/swsh11/186_hires.png",
    sellerBusinessName: "Modern Hits",
    createdAt: "2026-04-20T17:30:00Z"
  },
  {
    id: 20,
    title: "Typhlosion Neo Genesis Holo",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Lightly Played",
    priceCents: 11000,
    photoUrl: "https://images.pokemontcg.io/neo1/17_hires.png",
    sellerBusinessName: "Fire Box",
    createdAt: "2026-04-21T11:15:00Z"
  },
  {
    id: 21,
    title: "Ken Griffey Jr 1989 Upper Deck Rookie",
    category: "Graded",
    subcategory: "Baseball",
    condition: "Mint",
    gradingCompany: "SGC",
    grade: "9",
    priceCents: 12500,
    photoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/30/1952_Topps_Mickey_Mantle.jpg/220px-1952_Topps_Mickey_Mantle.jpg",
    sellerBusinessName: "The Kid Collects",
    createdAt: "2026-04-19T14:20:00Z"
  },
  {
    id: 22,
    title: "Iono Special Illustration Rare",
    category: "TCG",
    subcategory: "Pokemon",
    condition: "Mint",
    priceCents: 8500,
    photoUrl: "https://images.pokemontcg.io/sv2/269_hires.png",
    sellerBusinessName: "Trainer Lodge",
    createdAt: "2026-04-22T09:00:00Z"
  },
  {
    id: 23,
    title: "Dark Magician 1st Edition Legend of BEWD",
    category: "Graded",
    subcategory: "Yu-Gi-Oh",
    condition: "Near Mint",
    gradingCompany: "PSA",
    grade: "8",
    priceCents: 155000,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/T206_Honus_Wagner.jpg/220px-T206_Honus_Wagner.jpg",
    sellerBusinessName: "Duelist Kingdom",
    createdAt: "2026-04-16T10:10:00Z"
  },
  {
    id: 24,
    title: "2021 Tom Brady Select Prism Red",
    category: "Sports",
    subcategory: "Football",
    condition: "Mint",
    priceCents: 35000,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/T206_Honus_Wagner.jpg/220px-T206_Honus_Wagner.jpg",
    sellerBusinessName: "GOAT Vault",
    createdAt: "2026-04-20T12:00:00Z"
  },
  {
    id: 25,
    title: "Pikachu Illustrator CoroCoro Promo",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Excellent",
    gradingCompany: "PSA",
    grade: "7",
    priceCents: 450000000,
    photoUrl: "https://images.pokemontcg.io/np/1_hires.png",
    sellerBusinessName: "Elite Poke Wealth",
    createdAt: "2026-04-10T00:00:00Z"
  }
];
