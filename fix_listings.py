import re

with open("src/lib/mock/listings.ts", "r") as f:
    content = f.read()

new_first_16 = """  {
    id: 1,
    title: "Pokemon 151 Charizard ex Special Illustration Rare",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 35000,
    photoUrl: "https://images.pokemontcg.io/sv3pt5/199_hires.png",
    sellerBusinessName: "Kanto Cards",
    createdAt: "2026-04-26T00:00:00Z"
  },
  {
    id: 2,
    title: "Silver Tempest Lugia V Alternate Art 186/195",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 30000,
    photoUrl: "https://images.pokemontcg.io/swsh12/186_hires.png",
    sellerBusinessName: "Johto Exclusives",
    createdAt: "2026-04-25T00:00:00Z"
  },
  {
    id: 3,
    title: "Chilling Reign Blaziken VMAX Alternate Art",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 40000,
    photoUrl: "https://images.pokemontcg.io/swsh6/201_hires.png",
    sellerBusinessName: "Modern Hits",
    createdAt: "2026-04-24T00:00:00Z"
  },
  {
    id: 4,
    title: "Brilliant Stars Charizard V Alternate Art",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 25000,
    photoUrl: "https://images.pokemontcg.io/swsh9/154_hires.png",
    sellerBusinessName: "VaultCard Collectibles",
    createdAt: "2026-04-23T00:00:00Z"
  },
  {
    id: 5,
    title: "Fusion Strike Gengar VMAX Alternate Art",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 55000,
    photoUrl: "https://images.pokemontcg.io/swsh8/271_hires.png",
    sellerBusinessName: "Kanto Cards",
    createdAt: "2026-04-22T00:00:00Z"
  },
  {
    id: 6,
    title: "Obsidian Flames Charizard ex Special Illustration Rare",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 15000,
    photoUrl: "https://images.pokemontcg.io/sv3/223_hires.png",
    sellerBusinessName: "Trainer Lodge",
    createdAt: "2026-04-21T00:00:00Z"
  },
  {
    id: 7,
    title: "Evolving Skies Umbreon VMAX Alternate Art 215/203",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 120000,
    photoUrl: "https://images.pokemontcg.io/swsh7/215_hires.png",
    sellerBusinessName: "Eevee Emporium",
    createdAt: "2026-04-20T13:00:00Z"
  },
  {
    id: 8,
    title: "2022 Pokemon Lost Origin Giratina V Alternate Art",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 65000,
    photoUrl: "https://images.pokemontcg.io/swsh11/186_hires.png",
    sellerBusinessName: "Modern Hits",
    createdAt: "2026-04-20T12:00:00Z"
  },
  {
    id: 9,
    title: "Paldea Evolved Iono Special Illustration Rare",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 28000,
    photoUrl: "https://images.pokemontcg.io/sv2/269_hires.png",
    sellerBusinessName: "Trainer Lodge",
    createdAt: "2026-04-20T15:00:00Z"
  },
  {
    id: 10,
    title: "2024 Topps Chrome X-Fractor Kon Knueppel",
    category: "Sports",
    subcategory: "Basketball",
    condition: "Raw",
    gradingCompany: "Raw",
    grade: null,
    priceCents: 7899,
    photoUrl: "/mock-cards/FullSizeRender.jpg",
    sellerBusinessName: "Jackson's Vault",
    createdAt: "2026-04-27T07:00:00Z"
  },
  {
    id: 11,
    title: "1999 Pokemon Base Set Venusaur Holo",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 3500000,
    photoUrl: "https://images.pokemontcg.io/base1/15_hires.png",
    sellerBusinessName: "Cardbound Premium Store",
    createdAt: "2026-04-27T06:00:00Z"
  },
  {
    id: 12,
    title: "1999 Pokemon Base Set Blastoise 1st Ed Shadowless",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Mint",
    gradingCompany: "PSA",
    grade: "9",
    priceCents: 3500000,
    photoUrl: "https://images.pokemontcg.io/base1/2_hires.png",
    sellerBusinessName: "Kanto Cards",
    createdAt: "2026-04-27T08:00:00Z"
  },
  {
    id: 13,
    title: "2024 Topps Chrome Generation Rising Cooper Flagg",
    category: "Sports",
    subcategory: "Basketball",
    condition: "Raw",
    gradingCompany: "Raw",
    grade: null,
    priceCents: 1499,
    photoUrl: "/mock-cards/FullSizeRender-d2cb3dbb.jpg",
    sellerBusinessName: "Jackson's Vault",
    createdAt: "2026-04-27T10:00:00Z"
  },
  {
    id: 14,
    title: "2000 Pokemon Neo Genesis Lugia 1st Edition Holo",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 14400000,
    photoUrl: "https://images.pokemontcg.io/neo1/9_hires.png",
    sellerBusinessName: "Johto Exclusives",
    createdAt: "2026-04-27T09:00:00Z"
  },
  {
    id: 15,
    title: "1999 Pokemon Base Set Charizard 1st Ed Shadowless",
    category: "Graded",
    subcategory: "Pokemon",
    condition: "Gem Mint",
    gradingCompany: "PSA",
    grade: "10",
    priceCents: 35000000,
    photoUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    sellerBusinessName: "VaultCard Collectibles",
    createdAt: "2026-04-27T11:00:00Z"
  },
  {
    id: 16,
    title: "2024 Prizm Green Pulsar Jaxson Dart",
    category: "Sports",
    subcategory: "Football",
    condition: "Raw",
    gradingCompany: "Raw",
    grade: null,
    priceCents: 5199,
    photoUrl: "/mock-cards/FullSizeRender-c30e1eb7.jpg",
    sellerBusinessName: "Jackson's Vault",
    createdAt: "2026-04-27T12:00:00Z"
  },"""

lines = content.split('\n')
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "100% POKEMON WITH ACCURATE IMAGES AND VARIED PRICES" in line:
        start_idx = i + 1
    if "--- RECENTLY ADDED" in line:
        end_idx = i - 1

if start_idx != -1 and end_idx != -1:
    new_content = '\n'.join(lines[:start_idx]) + '\n' + new_first_16 + '\n' + '\n'.join(lines[end_idx:])
    with open("src/lib/mock/listings.ts", "w") as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print(f"Failed to find indices: start={start_idx}, end={end_idx}")

