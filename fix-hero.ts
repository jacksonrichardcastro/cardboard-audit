import fs from 'fs';

let pageContent = fs.readFileSync('src/app/[handle]/page.tsx', 'utf-8');
pageContent = pageContent.replace(
  /activeListingId: item\.cardId \? item\.id : item\.listingId/g,
  'activeListingId: item.cardId ? item.id : item.listingId,\n    draftListingId: item.listingId'
);
fs.writeFileSync('src/app/[handle]/page.tsx', pageContent);

let heroContent = fs.readFileSync('src/components/shared/SellerHero.tsx', 'utf-8');
heroContent = heroContent.replace(
  /heroCards\?: \{ id: string; url: string; title\?: string; activeListingId\?: number \}\[\];/g,
  'heroCards?: { id: string; url: string; title?: string; activeListingId?: number; draftListingId?: number }[];'
);

const oldMap = `              {displayCards.map((card, i) => {
                const cardContent = (
                  <div 
                    key={customizerNode ? \`\${card.id}-\${i}\` : undefined} 
                    className="relative flex-shrink-0 w-20 md:w-28 aspect-[5/7] rounded-lg border border-white/10 overflow-hidden shadow-xl transform transition-transform duration-500 hover:-translate-y-4 hover:scale-105 hover:z-10 cursor-pointer"
                  >
                    <img src={card.url} alt={card.title || "Hero Card"} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                );

                if (customizerNode || !card.activeListingId) {
                  return cardContent;
                }

                return (
                  <Link key={\`\${card.id}-\${i}\`} href={\`/listings/\${card.activeListingId}\`}>
                    {cardContent}
                  </Link>
                );
              })}`;

const newMap = `              {displayCards.map((card, i) => {
                const listingId = card.activeListingId ?? card.draftListingId;
                
                const cardContent = (
                  <div 
                    key={customizerNode ? \`\${card.id}-\${i}\` : undefined} 
                    className="relative flex-shrink-0 w-20 md:w-28 aspect-[5/7] rounded-lg border border-white/10 overflow-hidden shadow-xl transform transition-transform duration-500 hover:-translate-y-4 hover:scale-105 hover:z-10 cursor-pointer"
                  >
                    <img src={card.url} alt={card.title || "Hero Card"} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                );

                if (customizerNode) {
                  return cardContent;
                }
                
                if (!listingId) {
                  return cardContent; // Default placeholders have no listingId
                }

                return (
                  <Link key={\`\${card.id}-\${i}\`} href={\`/listings/\${listingId}\`}>
                    {cardContent}
                  </Link>
                );
              })}`;

heroContent = heroContent.replace(oldMap, newMap);
fs.writeFileSync('src/components/shared/SellerHero.tsx', heroContent);
