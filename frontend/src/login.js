import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://bwpugawoynwqstbzqjvt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cHVnYXdveW53cXN0YnpxanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjQxNjUsImV4cCI6MjA5MTQ0MDE2NX0.z-aJOA3LsLt9NkWzMXu-2oE6ubbZxE4eeqPgHLtV49I"
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