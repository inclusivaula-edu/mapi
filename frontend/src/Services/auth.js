import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bwpugawoynwqstbzqjvt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cHVnYXdveW53cXN0YnpxanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjQxNjUsImV4cCI6MjA5MTQ0MDE2NX0.z-aJOA3LsLt9NkWzMXu-2oE6ubbZxE4eeqPgHLtV49I";

// ✅ CLIENT ÚNICO (evita bug do GoTrueClient duplicado)
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// =============================
// 🔐 LOGIN
// =============================
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Erro login:", error.message);
    throw error;
  }

  // ⚠️ opcional (fallback)
  const token = data?.session?.access_token;
  if (token) {
    localStorage.setItem("token", token);
  }

  return data;
}

// =============================
// 🆕 REGISTRO + TENANT
// =============================
export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Erro registro:", error.message);
    throw error;
  }

  const userId = data.user?.id;
  if (!userId) return data;

  // 🔥 cria tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert([{ name: "Minha Empresa" }])
    .select()
    .single();

  if (tenantError) {
    console.error("Erro ao criar tenant:", tenantError.message);
    throw tenantError;
  }

  // 🔗 vincula usuário ao tenant
  const { error: linkError } = await supabase.from("user_tenants").insert([
    {
      user_id: userId,
      tenant_id: tenant.id,
      role: "admin",
    },
  ]);

  if (linkError) {
    console.error("Erro ao vincular tenant:", linkError.message);
    throw linkError;
  }

  return data;
}

// =============================
// 🚪 LOGOUT
// =============================
export async function logout() {
  await supabase.auth.signOut();

  // limpa fallback
  localStorage.removeItem("token");
}

// =============================
// 📦 SESSION
// =============================
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Erro ao pegar sessão:", error.message);
    return null;
  }

  return data.session;
}

// =============================
// 🔑 TOKEN (PADRÃO PROFISSIONAL)
// =============================
export async function getToken() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Erro ao pegar token:", error.message);
      return null;
    }

    // ✅ fonte principal (Supabase)
    const token = data.session?.access_token;

    if (token) return token;

    // ⚠️ fallback (evita quebra em edge cases)
    return localStorage.getItem("token");
  } catch (err) {
    console.error("Erro inesperado token:", err);
    return null;
  }
}