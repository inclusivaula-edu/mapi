import { useState } from "react";
import { api } from "../services/api";

export default function Reports() {
  const [report, setReport] = useState("");

  async function gerar() {
    const res = await api.post("/generate-report", {
      aluno: "João",
      necessidade: "TEA",
      periodo: "1º bimestre"
    });

    setReport(res.data.report);
  }

  return (
    <div>
      <h1>Relatórios</h1>

      <button onClick={gerar} className="bg-blue-600 text-white p-2">
        Gerar Relatório
      </button>

      <pre>{report}</pre>
    </div>
  );
}