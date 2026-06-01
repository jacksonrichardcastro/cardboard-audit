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
  sport: string;
  listingType: string;
  gradeTier: string;
  era: string;
  discountType?: string | null;
  discountAmount?: number | null;
  discountActiveUntil?: Date | null;
}

export const mockListings: MockListing[] = [
  // Original 19 (tagged)
  { id: "mock-2", title: "1999 Pokemon Base Set Charizard Holo", photoUrl: "/mock/card_charizard.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 150000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "vintage" },
  { id: "mock-3", title: "2023 Topps Chrome Update Sapphire Aaron Judge", photoUrl: "/mock/card_aaron_judge.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 20000, sport: "baseball", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-4", title: "1998 Pikachu Illustrator", photoUrl: "/mock/card_pikachu.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 500000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "vintage" },
  { id: "mock-1", title: "2018 Panini Prizm Silver Prizm Luka Doncic", photoUrl: "/mock/card_luka_doncic.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 50000, sport: "basketball", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-5", title: "2015 Upper Deck Connor McDavid Young Guns", photoUrl: "/mock/card_connor_mcdavid.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 80000, sport: "hockey", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-6", title: "2000 Neo Genesis Lugia 1st Edition Holo", photoUrl: "/mock/card_lugia.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 120000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "vintage" },
  { id: "mock-7", title: "2009 Bowman Chrome Mike Trout", photoUrl: "/mock/card_mike_trout.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 90000, sport: "baseball", listingType: "singles", gradeTier: "PSA 10", era: "modern" },
  { id: "mock-8", title: "1999 Pokemon Base Set Mewtwo Shadowless", photoUrl: "/mock/card_mewtwo.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 45000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "vintage" },
  { id: "mock-9", title: "1986 Fleer Michael Jordan Rookie #57", photoUrl: "/mock/card_jordan.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 300000, sport: "basketball", listingType: "singles", gradeTier: "PSA 10", era: "junk-wax" },
  { id: "mock-10", title: "1999 Pokemon Base Set Blastoise Holo", photoUrl: "/mock/card_blastoise.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 60000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "vintage" },
  { id: "mock-11", title: "2000 Playoff Contenders Tom Brady Rookie Ticket Auto", photoUrl: "/mock/card_brady.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 250000, sport: "football", listingType: "singles", gradeTier: "PSA 10", era: "modern" },
  { id: "mock-12", title: "1999 Pokemon Base Set Venusaur Holo", photoUrl: "/mock/card_venusaur.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 50000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "vintage" },
  { id: "mock-13", title: "2014 Panini Prizm World Cup Lionel Messi", photoUrl: "/mock/card_messi.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 75000, sport: "soccer", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-14", title: "2021 Evolving Skies Umbreon VMAX Alternate Art", photoUrl: "/mock/card_umbreon.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 85000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-15", title: "2020 Panini Donruss Optic Justin Herbert", photoUrl: "/mock/card_herbert.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 15000, sport: "football", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-16", title: "2021 Evolving Skies Rayquaza VMAX Alternate Art", photoUrl: "/mock/card_rayquaza.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 65000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-17", title: "2017 Panini Prizm Patrick Mahomes", photoUrl: "/mock/card_mahomes.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 95000, sport: "football", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-18", title: "2021 Fusion Strike Gengar VMAX Alternate Art", photoUrl: "/mock/card_gengar.png", category: "Graded", subcategory: "Pokemon", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 40000, sport: "tcg.pokemon", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-19", title: "2003 Topps Chrome LeBron James", photoUrl: "/mock/card_lebron.png", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 150000, sport: "basketball", listingType: "singles", gradeTier: "PSA 10", era: "modern" },

  // New Additions to meet category minimums
  // Basketball (Current: 3, Need 2 more)
  { id: "mock-20", title: "1996 Topps Chrome Kobe Bryant Rookie #138", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Bryant+Rookie+138", category: "Sports", condition: "Mint", grade: "9", gradingCompany: "PSA", priceCents: 200000, sport: "basketball", listingType: "singles", gradeTier: "PSA 9", era: "modern" },
  { id: "mock-21", title: "1969 Topps Lew Alcindor Rookie #25", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Alcindor+Rookie+25", category: "Sports", condition: "Near Mint", grade: "7", gradingCompany: "PSA", priceCents: 500000, sport: "basketball", listingType: "singles", gradeTier: "Other Graded", era: "vintage" },
  
  // Baseball (Current: 2, Need 3 more)
  { id: "mock-22", title: "1952 Topps Mickey Mantle #311", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Mickey+Mantle+311", category: "Sports", condition: "Good", grade: "2", gradingCompany: "PSA", priceCents: 2000000, sport: "baseball", listingType: "singles", gradeTier: "Other Graded", era: "vintage" },
  { id: "mock-23", title: "1989 Upper Deck Ken Griffey Jr. Rookie #1", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Jr+Rookie+1", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 150000, sport: "baseball", listingType: "singles", gradeTier: "PSA 10", era: "junk-wax" },
  { id: "mock-24", title: "2018 Bowman Chrome Shohei Ohtani Auto", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Shohei+Ohtani+Auto", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 400000, sport: "baseball", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  
  // Hockey (Current: 1, Need 2 more)
  { id: "mock-25", title: "1979 O-Pee-Chee Wayne Gretzky Rookie #18", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Gretzky+Rookie+18", category: "Sports", condition: "Excellent", grade: "5", gradingCompany: "PSA", priceCents: 250000, sport: "hockey", listingType: "singles", gradeTier: "Other Graded", era: "vintage" },
  { id: "mock-26", title: "2005 Upper Deck Sidney Crosby Young Guns", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Crosby+Young+Guns", category: "Sports", condition: "Mint", grade: "9", gradingCompany: "PSA", priceCents: 80000, sport: "hockey", listingType: "singles", gradeTier: "PSA 9", era: "modern" },
  
  // Soccer (Current: 1, Need 2 more)
  { id: "mock-27", title: "1958 Alifabolaget Pele Rookie", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Alifabolaget+Pele+Rookie", category: "Sports", condition: "Good", grade: "3", gradingCompany: "PSA", priceCents: 1000000, sport: "soccer", listingType: "singles", gradeTier: "Other Graded", era: "vintage" },
  { id: "mock-28", title: "2003 Panini Mega Craques Cristiano Ronaldo", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Craques+Cristiano+Ronaldo", category: "Sports", condition: "Mint", grade: "9", gradingCompany: "PSA", priceCents: 400000, sport: "soccer", listingType: "singles", gradeTier: "PSA 9", era: "modern" },
  
  // MMA/Boxing (Need 2)
  { id: "mock-29", title: "1960 Hemmets Journal Cassius Clay Rookie", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Cassius+Clay+Rookie", category: "Sports", condition: "Excellent", grade: "6", gradingCompany: "PSA", priceCents: 300000, sport: "mma-boxing", listingType: "singles", gradeTier: "Other Graded", era: "vintage" },
  { id: "mock-30", title: "2009 Topps UFC Round 1 Conor McGregor", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=1+Conor+McGregor", category: "Sports", condition: "Mint", grade: "9", gradingCompany: "PSA", priceCents: 150000, sport: "mma-boxing", listingType: "singles", gradeTier: "PSA 9", era: "modern" },
  
  // Golf (Need 2)
  { id: "mock-31", title: "2001 SP Authentic Tiger Woods Auto", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Tiger+Woods+Auto", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 600000, sport: "golf", listingType: "singles", gradeTier: "PSA 10", era: "modern" },
  { id: "mock-32", title: "1932 U.S. Caramel Bobby Jones", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Caramel+Bobby+Jones", category: "Sports", condition: "Very Good", grade: "4", gradingCompany: "PSA", priceCents: 250000, sport: "golf", listingType: "singles", gradeTier: "Other Graded", era: "vintage" },
  
  // Racing (Need 2)
  { id: "mock-33", title: "1988 Maxx Dale Earnhardt", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Maxx+Dale+Earnhardt", category: "Sports", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 50000, sport: "racing", listingType: "singles", gradeTier: "PSA 10", era: "junk-wax" },
  { id: "mock-34", title: "2020 Topps Dynasty Lewis Hamilton Auto", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Lewis+Hamilton+Auto", category: "Sports", condition: "Mint", grade: "9", gradingCompany: "PSA", priceCents: 150000, sport: "racing", listingType: "singles", gradeTier: "PSA 9", era: "ultra-modern" },
  
  // Other TCGs (Magic, Yu-Gi-Oh, Lorcana, One Piece)
  { id: "mock-35", title: "1993 MTG Alpha Black Lotus", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Alpha+Black+Lotus", category: "TCG", condition: "Excellent", grade: "6", gradingCompany: "PSA", priceCents: 3000000, sport: "tcg.magic", listingType: "singles", gradeTier: "Other Graded", era: "modern" },
  { id: "mock-36", title: "2002 Yu-Gi-Oh LOB Blue-Eyes White Dragon 1st Ed", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Dragon+1st+Ed", category: "TCG", condition: "Mint", grade: "9", gradingCompany: "PSA", priceCents: 450000, sport: "tcg.yugioh", listingType: "singles", gradeTier: "PSA 9", era: "modern" },
  { id: "mock-37", title: "2023 Lorcana The First Chapter Elsa Enchanted", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Chapter+Elsa+Enchanted", category: "TCG", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 120000, sport: "tcg.lorcana", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  { id: "mock-38", title: "2022 One Piece Romance Dawn Manga Shanks", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Dawn+Manga+Shanks", category: "TCG", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 200000, sport: "tcg.onepiece", listingType: "singles", gradeTier: "PSA 10", era: "ultra-modern" },
  
  // Non-Sport (Marvel, Star Wars)
  { id: "mock-39", title: "1990 Impel Marvel Universe Spider-Man", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Marvel+Universe+SpiderMan", category: "Non-Sport", condition: "Gem Mint", grade: "10", gradingCompany: "PSA", priceCents: 20000, sport: "non-sport.marvel", listingType: "singles", gradeTier: "PSA 10", era: "junk-wax" },
  { id: "mock-40", title: "1977 Topps Star Wars Luke Skywalker #1", photoUrl: "https://placehold.co/400x550/1A1A1D/FFFFFF?text=Luke+Skywalker+1", category: "Non-Sport", condition: "Mint", grade: "9", gradingCompany: "PSA", priceCents: 350000, sport: "non-sport.starwars", listingType: "singles", gradeTier: "PSA 9", era: "vintage" }
];
