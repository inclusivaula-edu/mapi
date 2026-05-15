import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/" },
    { name: "Financeiro", path: "/finance" },
    { name: "Billing", path: "/billing" },
    { name: "Modules", path: "/modules" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-xl font-bold mb-8">🔥 MAPI</h2>

      <nav className="space-y-2">
        {menu.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg transition ${
                active
                  ? "bg-gray-800 text-blue-400"
                  : "hover:bg-gray-800 hover:text-blue-400"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}