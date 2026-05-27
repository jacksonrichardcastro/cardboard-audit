const fs = require('fs');
const path = require('path');

const mockListings = [
  { title: "2018 Panini Prizm Silver Prizm Luka Doncic", photoUrl: "/mock/card_luka_doncic.png", category: "Sports" }, // 0
  { title: "1999 Pokemon Base Set Charizard Holo", photoUrl: "/mock/card_charizard.png", category: "Graded", subcategory: "Pokemon" }, // 1
  { title: "2023 Topps Chrome Update Sapphire Aaron Judge", photoUrl: "/mock/card_aaron_judge.png", category: "Sports" }, // 2
  { title: "1998 Pikachu Illustrator", photoUrl: "/mock/card_pikachu.png", category: "Graded", subcategory: "Pokemon" }, // 3
  { title: "2015 Upper Deck Connor McDavid Young Guns", photoUrl: "/mock/card_connor_mcdavid.png", category: "Sports" }, // 4
  { title: "2000 Neo Genesis Lugia 1st Edition Holo", photoUrl: "/mock/card_lugia.png", category: "Graded", subcategory: "Pokemon" }, // 5
  { title: "2009 Bowman Chrome Mike Trout", photoUrl: "/mock/card_mike_trout.png", category: "Sports" }, // 6
  { title: "1999 Pokemon Base Set Mewtwo Shadowless", photoUrl: "/mock/card_mewtwo.png", category: "Graded", subcategory: "Pokemon" }, // 7
  { title: "1986 Fleer Michael Jordan Rookie #57", photoUrl: "/mock/card_jordan.png", category: "Sports" }, // 8
  { title: "1999 Pokemon Base Set Blastoise Holo", photoUrl: "/mock/card_blastoise.png", category: "Graded", subcategory: "Pokemon" }, // 9
  { title: "2000 Playoff Contenders Tom Brady Rookie Ticket Auto", photoUrl: "/mock/card_brady.png", category: "Sports" }, // 10
  { title: "1999 Pokemon Base Set Venusaur Holo", photoUrl: "/mock/card_venusaur.png", category: "Graded", subcategory: "Pokemon" }, // 11
  { title: "2014 Panini Prizm World Cup Lionel Messi", photoUrl: "/mock/card_messi.png", category: "Sports" }, // 12
  { title: "2021 Evolving Skies Umbreon VMAX Alternate Art", photoUrl: "/mock/card_umbreon.png", category: "Graded", subcategory: "Pokemon" }, // 13
  { title: "2020 Panini Donruss Optic Justin Herbert", photoUrl: "/mock/card_herbert.png", category: "Sports" }, // 14
  { title: "2021 Evolving Skies Rayquaza VMAX Alternate Art", photoUrl: "/mock/card_rayquaza.png", category: "Graded", subcategory: "Pokemon" }, // 15
  { title: "2017 Panini Prizm Patrick Mahomes", photoUrl: "/mock/card_mahomes.png", category: "Sports" }, // 16
  { title: "2021 Fusion Strike Gengar VMAX Alternate Art", photoUrl: "/mock/card_gengar.png", category: "Graded", subcategory: "Pokemon" }, // 17
  { title: "2003 Topps Chrome LeBron James", photoUrl: "/mock/card_lebron.png", category: "Sports" } // 18
];

const content = \`export const mockListings = \${JSON.stringify(mockListings, null, 2)};\n\`;

fs.writeFileSync(path.join(__dirname, '../src/lib/mock/listings.ts'), content);
console.log("Mock listings updated!");
