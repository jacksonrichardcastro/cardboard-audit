import fs from 'fs';

let content = fs.readFileSync('src/app/listings/[id]/page.tsx', 'utf-8');

if (!content.includes('RemoveFromHeaderButton')) {
  content = content.replace(
    'import { RemoveListingModal } from "@/components/listings/RemoveListingModal";',
    'import { RemoveListingModal } from "@/components/listings/RemoveListingModal";\nimport { RemoveFromHeaderButton } from "@/components/listings/RemoveFromHeaderButton";'
  );
}

const oldButtons = `<RemoveListingModal 
                      listingId={item.id}
                      onSuccessRedirectUrl={dbItem.sellerHandle ? \`/\${dbItem.sellerHandle}\` : "/seller/dashboard?tab=listings"}
                      triggerNode={
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 text-red-500 hover:text-red-400 h-10 px-4 py-2">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </button>
                      }
                    />`;

const newButtons = `\${isInHeader && dbItem.cardId ? <RemoveFromHeaderButton cardId={dbItem.cardId} /> : null}
                    <RemoveListingModal 
                      listingId={item.id}
                      onSuccessRedirectUrl={dbItem.sellerHandle ? \`/\${dbItem.sellerHandle}\` : "/seller/dashboard?tab=listings"}
                      triggerNode={
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 text-red-500 hover:text-red-400 h-10 px-4 py-2">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </button>
                      }
                    />`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync('src/app/listings/[id]/page.tsx', content);
