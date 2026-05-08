import { useState } from "react";
import { api } from "../services/api";

export default function Modules() {
  const [form, setForm] = useState({
    tema: "",
    disciplina: "",
    serie: "",
    nome: "",
    idade: "",
    deficiencia: "",
  });

  const [lesson, setLesson] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLesson() {
    try {
      setLoading(true);
      const res = await api.post("/generate-lesson", form);
      setLesson(res.data.lesson);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao gerar aula");
    } finally {
      setLoading(false);
    }
  }

  async function handleReport() {
    try {
      setLoading(true);
      const res = await api.post("/generate-report", form);
      setReport(res.data.report);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🧠 Playground MAPI</h1>

      <div className="bg-gray-900 p-6 rounded-xl space-y-4">
        <input
          placeholder="Tema"
          className="w-full p-3 bg-gray-800 rounded"
          onChange={(e) => setForm({ ...form, tema: e.target.value })}
        />

        <input
          placeholder="Disciplina"
          className="w-full p-3 bg-gray-800 rounded"
          onChange={(e) => setForm({ ...form, disciplina: e.target.value })}
        />

        <input
          placeholder="Série"
          className="w-full p-3 bg-gray-800 rounded"
          onChange={(e) => setForm({ ...form, serie: e.target.value })}
        />

        <input
          placeholder="Nome do aluno"
          className="w-full p-3 bg-gray-800 rounded"
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />

        <input
          placeholder="Idade"
          className="w-full p-3 bg-gray-800 rounded"
          onChange={(e) => setForm({ ...form, idade: e.target.value })}
        />

        <input
          placeholder="Deficiência"
          className="w-full p-3 bg-gray-800 rounded"
          onChange={(e) => setForm({ ...form, deficiencia: e.target.value })}
        />

        <div className="flex gap-4">
          <button
            onClick={handleLesson}
            className="bg-indigo-600 px-6 py-3 rounded-xl"
          >
            🎓 Gerar Aula
          </button>

          <button
            onClick={handleReport}
            className="bg-green-600 px-6 py-3 rounded-xl"
          >
            📊 Gerar Relatório
          </button>
        </div>
      </div>

      {loading && <p className="mt-4">⏳ Gerando...</p>}

      {lesson && (
        <div className="mt-6 bg-gray-900 p-6 rounded-xl whitespace-pre-wrap">
          <h2 className="text-xl mb-4">🎓 Aula</h2>
          {lesson}
        </div>
      )}

      {report && (
        <div className="mt-6 bg-gray-900 p-6 rounded-xl whitespace-pre-wrap">
          <h2 className="text-xl mb-4">📊 Relatório</h2>
          {report}
        </div>
      )}
    </div>
  );
}