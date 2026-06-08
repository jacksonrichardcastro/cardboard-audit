import fs from 'fs';

let heroContent = fs.readFileSync('src/components/shared/SellerHero.tsx', 'utf-8');
heroContent = heroContent.replace(
  /activeListingId: undefined as number \| undefined/g,
  'activeListingId: undefined as number | undefined,\n    draftListingId: undefined as number | undefined'
);
fs.writeFileSync('src/components/shared/SellerHero.tsx', heroContent);
