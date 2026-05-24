import { useState } from "react";
import { runMAPI } from "../services/api.js";
import { getToken } from "../services/auth.js";
 
export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  async function gerar() {
    try {
      setLoading(true);
      setError("");
      const token = await getToken();
 
      const result = await runMAPI({
        module: "education",
        workflow: "gerar-relatorio",
        input: "PEI",
        tenantId: null,
        token,
      });
 
      if (result.error) {
        setError(result.error);
        return;
      }
 
      setReport(result.response || result);
    } catch (err) {
      setError("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
      <button
        onClick={gerar}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Gerando..." : "Gerar Relatório"}
      </button>
 
      {error && <p className="text-red-500 mt-4">{error}</p>}
 
      {report && (
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          {(report.sections || []).map((s, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-bold text-lg underline">{s.name}</h3>
              <p className="mt-1">{s.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}