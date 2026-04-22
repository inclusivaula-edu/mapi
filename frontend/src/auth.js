import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bwpugawoynwqstbzqjvt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cHVnYXdveW53cXN0YnpxanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjQxNjUsImV4cCI6MjA5MTQ0MDE2NX0.z-aJOA3LsLt9NkWzMXu-2oE6ubbZxE4eeqPgHLtV49I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// LOGIN
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

// REGISTRO + TENANT AUTO
export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const userId = data.user.id;

  // cria tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .insert([{ name: "Minha Empresa" }])
    .select()
    .single();

  // vincula user
  await supabase.from("user_tenants").insert([
    {
      user_id: userId,
      tenant_id: tenant.id,
      role: "admin",
    },
  ]);

  return data;
}

// LOGOUT
export async function logout() {
  await supabase.auth.signOut();
}

// SESSION
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}