import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://SEU_PROJECT_ID.supabase.co",
  "SUA_ANON_KEY"
);

// LOGIN REAL
async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "teste@email.com",
    password: "123456"
  });

  if (error) {
    console.error(error);
    return;
  }

  const token = data.session.access_token;

  console.log("TOKEN GERADO:", token);

  localStorage.setItem("token", token);
}