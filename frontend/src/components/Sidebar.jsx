import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-5">
      <h1 className="text-xl font-bold mb-10">MAPI</h1>

      <nav className="flex flex-col gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/lessons">Aulas</Link>
        <Link to="/reports">Relatórios</Link>
        <Link to="/billing">Billing</Link>
      </nav>
    </div>
  );
}