import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: bofas } = await supabase.from('storefronts').select('*').eq('handle', 'bofascards');
  if (bofas && bofas.length > 0) {
    const userId = bofas[0].user_id;
    const { data: sf1 } = await supabase.from('storefronts').select('*').eq('user_id', userId);
    console.log('bofascards user storefront count:', sf1?.length, 'user_id:', userId);
  }

  const { data: jacksons } = await supabase.from('storefronts').select('*').eq('handle', 'jacksons');
  if (jacksons && jacksons.length > 0) {
    const userId = jacksons[0].user_id;
    const { data: sf2 } = await supabase.from('storefronts').select('*').eq('user_id', userId);
    console.log('jacksons user storefront count:', sf2?.length, 'user_id:', userId);
  }
}
run();
