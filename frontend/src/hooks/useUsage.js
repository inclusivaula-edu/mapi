import { useEffect, useState } from "react";
import { getToken } from "../services/auth";

export function useUsage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUsage() {
    try {
      const token = await getToken();

      const res = await fetch("http://localhost:3000/billing/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      setUsage(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsage();
  }, []);

  return { usage, loading, reload: loadUsage };
}