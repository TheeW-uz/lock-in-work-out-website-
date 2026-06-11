const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const tables = ['reports', 'tickets', 'appeals', 'admin_actions', 'profiles'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('count').limit(1);
    if (error) {
      console.log(`Table ${t}: Error - ${error.code} - ${error.message}`);
    } else {
      console.log(`Table ${t}: EXISTS`);
    }
  }
}

check();
