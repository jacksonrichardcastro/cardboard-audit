export interface MockListing {
  id: string;
  title: string;
  photoUrl: string;
  category: string;
  subcategory?: string;
  condition?: string;
  grade?: string;
  gradingCompany?: string;
  priceCents: number;
}

export const mockListings: MockListing[] = [
  { id: "mock-1", title: "2018 Panini Prizm Silver Prizm Luka Doncic", photoUrl: "/mock/card_luka_doncic.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 50000 },
  { id: "mock-2", title: "1999 Pokemon Base Set Charizard Holo", photoUrl: "/mock/card_charizard.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 150000 },
  { id: "mock-3", title: "2023 Topps Chrome Update Sapphire Aaron Judge", photoUrl: "/mock/card_aaron_judge.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 20000 },
  { id: "mock-4", title: "1998 Pikachu Illustrator", photoUrl: "/mock/card_pikachu.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 500000 },
  { id: "mock-5", title: "2015 Upper Deck Connor McDavid Young Guns", photoUrl: "/mock/card_connor_mcdavid.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 80000 },
  { id: "mock-6", title: "2000 Neo Genesis Lugia 1st Edition Holo", photoUrl: "/mock/card_lugia.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 120000 },
  { id: "mock-7", title: "2009 Bowman Chrome Mike Trout", photoUrl: "/mock/card_mike_trout.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 90000 },
  { id: "mock-8", title: "1999 Pokemon Base Set Mewtwo Shadowless", photoUrl: "/mock/card_mewtwo.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 45000 },
  { id: "mock-9", title: "1986 Fleer Michael Jordan Rookie #57", photoUrl: "/mock/card_jordan.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 300000 },
  { id: "mock-10", title: "1999 Pokemon Base Set Blastoise Holo", photoUrl: "/mock/card_blastoise.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 60000 },
  { id: "mock-11", title: "2000 Playoff Contenders Tom Brady Rookie Ticket Auto", photoUrl: "/mock/card_brady.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 250000 },
  { id: "mock-12", title: "1999 Pokemon Base Set Venusaur Holo", photoUrl: "/mock/card_venusaur.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 50000 },
  { id: "mock-13", title: "2014 Panini Prizm World Cup Lionel Messi", photoUrl: "/mock/card_messi.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 75000 },
  { id: "mock-14", title: "2021 Evolving Skies Umbreon VMAX Alternate Art", photoUrl: "/mock/card_umbreon.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 85000 },
  { id: "mock-15", title: "2020 Panini Donruss Optic Justin Herbert", photoUrl: "/mock/card_herbert.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 15000 },
  { id: "mock-16", title: "2021 Evolving Skies Rayquaza VMAX Alternate Art", photoUrl: "/mock/card_rayquaza.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 65000 },
  { id: "mock-17", title: "2017 Panini Prizm Patrick Mahomes", photoUrl: "/mock/card_mahomes.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 95000 },
  { id: "mock-18", title: "2021 Fusion Strike Gengar VMAX Alternate Art", photoUrl: "/mock/card_gengar.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 40000 },
  { id: "mock-19", title: "2003 Topps Chrome LeBron James", photoUrl: "/mock/card_lebron.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 150000 }
];
