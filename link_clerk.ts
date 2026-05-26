import postgres from "postgres";
import { env } from "./src/env";

async function main() {
  const emailToLink = process.argv[2];
  if (!emailToLink) {
    console.error("Please provide the email as an argument. Usage: npx tsx link_clerk.ts <email>");
    process.exit(1);
  }

  const sql = postgres(env.DATABASE_URL);
  try {
    const [user] = await sql`SELECT id FROM users WHERE email = ${emailToLink}`;
    if (!user) {
      console.error(`User with email ${emailToLink} not found.`);
      process.exit(1);
    }

    const clerkId = user.id;
    console.log(`Linking alexthegrader to Clerk ID: ${clerkId}`);

    // If the user already has a seller profile, delete it so we can re-assign alexthegrader
    await sql`DELETE FROM sellers WHERE user_id = ${clerkId} AND handle != 'alexthegrader'`;

    // Update the seller record
    await sql`UPDATE sellers SET user_id = ${clerkId} WHERE handle = 'alexthegrader'`;
    // Update all listings owned by the old mock seller
    await sql`UPDATE listings SET seller_id = ${clerkId} WHERE seller_id = 'mock-seller-1'`;
    
    console.log("Successfully linked account.");
  } catch (error) {
    console.error("Error linking account:", error);
  } finally {
    await sql.end();
  }
}

main();
