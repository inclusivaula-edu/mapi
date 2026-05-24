import { useState } from "react";
import { runMAPI } from "../services/api.js";
import { getToken } from "../services/auth.js";
 
export default function Lessons() {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  async function gerar() {
    try {
      setLoading(true);
      setError("");
      const token = await getToken();
 
      const result = await runMAPI({
        module: "education",
        workflow: "gerar-aula",
        input: "Matemática básica",
        tenantId: null,
        token,
      });
 
      if (result.error) {
        setError(result.error);
        return;
      }
 
      setLesson(result.response || result);
    } catch (err) {
      setError("Erro ao gerar aula");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gerador de Aulas</h1>
      <button
        onClick={gerar}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Gerando..." : "Gerar Aula"}
      </button>
 
      {error && <p className="text-red-500 mt-4">{error}</p>}
 
      {lesson && (
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-2">{lesson.title}</h2>
          <p className="text-sm text-gray-500 mb-4">BNCC: {lesson.bncc}</p>
          <p className="font-semibold">Objetivo:</p>
          <p className="mb-3">{lesson.objective}</p>
          <p className="font-semibold">Explicação:</p>
          <p className="mb-3">{lesson.explanation}</p>
          <p className="font-semibold">Exemplo:</p>
          <p className="mb-3">{lesson.example}</p>
          <p className="font-semibold">Atividades:</p>
          <ul className="list-disc pl-5">
            {(lesson.activities || []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          {lesson.adaptations && (
            <>
              <p className="font-semibold mt-3">Adaptações:</p>
              <p>{lesson.adaptations}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}