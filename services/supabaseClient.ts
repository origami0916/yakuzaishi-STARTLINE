import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 環境変数が設定されているか確認
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    'Supabase credentials not found. Falling back to local storage mode.\n' +
    'To use Supabase, set SUPABASE_URL and SUPABASE_KEY in your environment.'
  );
}

export const supabase = client;