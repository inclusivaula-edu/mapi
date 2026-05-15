import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bwpugawoynwqstbzqjvt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cHVnYXdveW53cXN0YnpxanZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjQxNjUsImV4cCI6MjA5MTQ0MDE2NX0.z-aJOA3LsLt9NkWzMXu-2oE6ubbZxE4eeqPgHLtV49I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);