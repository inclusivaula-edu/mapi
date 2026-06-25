import { logger } from "../observability/logger.js";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL) throw new Error("SUPABASE_URL é obrigatório no .env");

/**
 * Cliente com service_role — usado pelo BACKEND.
 * Bypassa RLS: acesso total ao banco.
 * NUNCA exponha esta chave no frontend.
 */
if (!SUPABASE_SERVICE_ROLE_KEY) {
  logger.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY não definida — usando anon key (não recomendado em produção)");
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Cliente separado para validar JWTs no auth hook.
 * Usar supabase.auth.getUser(token) no cliente service_role contamina
 * o estado interno e faz queries subsequentes usarem RLS do usuário.
 * Este cliente isolado evita esse efeito colateral.
 */
export const supabaseAuth = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY ?? SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
