export const SPORT_CATEGORIES = [
  { id: "basketball", label: "Basketball" },
  { id: "baseball", label: "Baseball" },
  { id: "football", label: "Football" },
  { id: "hockey", label: "Hockey" },
  { id: "soccer", label: "Soccer" },
  { id: "mma-boxing", label: "MMA / Boxing" },
  { id: "golf", label: "Golf" },
  { id: "racing", label: "Racing" },
  { 
    id: "tcg", 
    label: "TCG",
    subOptions: [
      { id: "tcg.pokemon", label: "Pokemon" },
      { id: "tcg.magic", label: "Magic the Gathering" },
      { id: "tcg.yugioh", label: "Yu-Gi-Oh" },
      { id: "tcg.lorcana", label: "Lorcana" },
      { id: "tcg.onepiece", label: "One Piece" },
    ]
  },
  { 
    id: "non-sport", 
    label: "Non-Sport",
    subOptions: [
      { id: "non-sport.marvel", label: "Marvel" },
      { id: "non-sport.starwars", label: "Star Wars" },
      { id: "non-sport.other", label: "Other Non-Sport" },
    ]
  }
];

export const LISTING_TYPES = [
  { id: "singles", label: "Singles" },
  { id: "lots", label: "Lots" },
  { id: "sealed", label: "Sealed" }
];

export const GRADE_TIERS = [
  { id: "psa-10", label: "PSA 10" },
  { id: "psa-9", label: "PSA 9" },
  { id: "other-graded", label: "Other Graded" },
  { id: "raw", label: "Raw / Ungraded" }
];

export const PRICE_RANGES = [
  { id: "under-50", label: "Under $50" },
  { id: "50-200", label: "$50 - $200" },
  { id: "200-1000", label: "$200 - $1,000" },
  { id: "1000-5000", label: "$1,000 - $5,000" },
  { id: "5000-plus", label: "$5,000+" }
];

export const ERAS = [
  { id: "vintage", label: "Vintage" },
  { id: "junk-wax", label: "Junk Wax" },
  { id: "modern", label: "Modern" },
  { id: "ultra-modern", label: "Ultra Modern" }
];
