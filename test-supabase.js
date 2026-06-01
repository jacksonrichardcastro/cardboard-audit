require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Creating signed upload url...");
  const { data, error } = await supabase.storage
    .from("cardbound-media")
    .createSignedUploadUrl('test-123.jpg');
  
  console.log("Result:", data, error);
}

test().catch(console.error);
