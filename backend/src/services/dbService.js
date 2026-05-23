import { createClient } from "@supabase/supabase-js";

// 🔥 Garantir que as variáveis existem
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// 🔥 Validação pra evitar erro silencioso
if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Supabase não configurado. Verifique o .env");
}

// 🔥 Criação do client
export const supabase = createClient(supabaseUrl, supabaseKey);