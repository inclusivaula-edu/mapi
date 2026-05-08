import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/" },
    { name: "Financeiro", path: "/finance" },
    { name: "Billing", path: "/billing" },
    { name: "Modules", path: "/modules" }
  ];

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.logo}>🔥 MAPI</h2>

      {menu.map((item) => {
        const active = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              background: active ? "#1e293b" : "transparent",
            }}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}

const styles = {
  sidebar: {
    width: 240,
    height: "100vh",
    background: "#0f172a",
    color: "#fff",
    padding: 20,
  },
  logo: {
    marginBottom: 30,
  },
  link: {
    display: "block",
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    textDecoration: "none",
    marginBottom: 8,
  },
};