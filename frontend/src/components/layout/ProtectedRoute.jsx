import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // ⏳ enquanto carrega sessão
  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  // ❌ não logado
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ✅ logado
  return children;
}