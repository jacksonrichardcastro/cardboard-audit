const { db } = require('./src/lib/db');
const { listings } = require('./src/lib/db/schema');
async function test() {
  try {
    const res = await db.select({ id: listings.id, quantity: listings.quantity }).from(listings).limit(1);
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
