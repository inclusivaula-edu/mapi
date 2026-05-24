import { createContext, useEffect, useState } from "react";
import { supabase } from "../services/auth.js";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =============================
  // 🔥 INIT
  // =============================
  useEffect(() => {
    getSession();

    // 🔥 ESCUTA MUDANÇA DE AUTH
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function getSession() {
    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user || null);
    setLoading(false);
  }

  // =============================
  // 🔐 LOGIN
  // =============================
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setUser(data.user);
  }

  // =============================
  // 🆕 REGISTER
  // =============================
  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return data;
  }

  // =============================
  // 🚪 LOGOUT
  // =============================
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

