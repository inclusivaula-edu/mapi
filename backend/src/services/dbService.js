import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("? SUPABASE não configurado no .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws },
});
