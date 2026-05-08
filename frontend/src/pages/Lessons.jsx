import { useState } from "react";
import { api } from "../services/api";

export default function Lessons() {
  const [lesson, setLesson] = useState("");

  async function gerar() {
    const res = await api.post("/generate-lesson", {
      tema: "Matemática básica",
      disciplina: "Matemática",
      serie: "5º ano"
    });

    setLesson(res.data.lesson);
  }

  return (
    <div>
      <h1 className="text-xl mb-4">Gerador de Aulas</h1>

      <button
        onClick={gerar}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Gerar Aula
      </button>

      <pre className="mt-4 whitespace-pre-wrap">{lesson}</pre>
    </div>
  );
}