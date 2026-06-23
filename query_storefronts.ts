import { db } from "./src/lib/db/index";
import { storefronts } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const bofas = await db.select().from(storefronts).where(eq(storefronts.handle, "bofascards"));
  if (bofas.length > 0) {
    const userId = bofas[0].userId;
    const all = await db.select().from(storefronts).where(eq(storefronts.userId, userId));
    console.log("bofascards user storefront count:", all.length);
  }
  
  const jacksons = await db.select().from(storefronts).where(eq(storefronts.handle, "jacksons"));
  if (jacksons.length > 0) {
    const userId = jacksons[0].userId;
    const all = await db.select().from(storefronts).where(eq(storefronts.userId, userId));
    console.log("jacksons user storefront count:", all.length);
  }
}
run().catch(console.error).then(() => process.exit(0));
