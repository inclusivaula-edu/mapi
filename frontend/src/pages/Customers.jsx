import { useEffect, useState } from "react";
import { supabase } from "../auth";

export default function Customers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data } = await supabase
      .from("user_tenants")
      .select("*");

    setUsers(data || []);
  }

  return (
    <div>
      <h1>👥 Customers</h1>

      <div style={styles.table}>
        <div style={styles.header}>
          <span>User</span>
          <span>Tenant</span>
          <span>Role</span>
        </div>

        {users.map((u, i) => (
          <div key={i} style={styles.row}>
            <span>{u.user_id}</span>
            <span>{u.tenant_id}</span>
            <span>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  table: {
    marginTop: 20,
    border: "1px solid #222",
    borderRadius: 10,
    overflow: "hidden",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    background: "#111",
    color: "#fff",
    padding: 12,
    fontWeight: "bold",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    padding: 12,
    borderTop: "1px solid #222",
  },
};