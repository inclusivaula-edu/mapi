import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import relatorioConformidade from "./relatorioConformidade.js";

export default async function relatorioConformidadePDF({ input, context }) {
  const report = await relatorioConformidade({ input, context });

  const fileName = `conformidade_lbi_${report.semester}_${Date.now()}.pdf`;
  const dir = path.resolve("./tmp");
  const filePath = path.join(dir, fileName);
  fs.mkdirSync(dir, { recursive: true });

  await buildConformidadePDF(report, filePath);

  return { filePath, fileName };
}

function buildConformidadePDF(report, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Cabeçalho
    doc.fontSize(16).text("Relatório de Conformidade — Lei Brasileira de Inclusão", { align: "center" });
    doc.fontSize(10).text(`Lei 13.146/2015 | Semestre ${report.semester}`, { align: "center" });
    doc.moveDown();

    // Resumo
    doc.fontSize(12).text("Resumo", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(`Total de alunos com diagnóstico: ${report.total}`);
    doc.text(`Conformes (PEI atualizado): ${report.compliant}`);
    doc.text(`Não conformes: ${report.nonCompliant}`);
    doc.text(`Taxa de conformidade: ${report.rate}`);
    doc.moveDown();

    // Status por aluno
    doc.fontSize(12).text("Status por Aluno", { underline: true });
    doc.moveDown(0.3);

    for (const s of report.students ?? []) {
      const icon = s.has_pei_this_semester ? "✅" : "❌";
      doc.fontSize(10).text(
        `${icon} ${s.name} — ${s.diagnosis} (${s.grade ?? "série N/I"}) — ${s.status}`
      );
      if (s.last_pei_date) {
        doc.fontSize(8).text(`   Último PEI: ${new Date(s.last_pei_date).toLocaleDateString("pt-BR")}`);
      }
    }
    doc.moveDown();

    // Análise
    doc.fontSize(12).text("Análise Jurídica", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).text(report.summary ?? "", { align: "justify" });
    doc.moveDown();

    // Rodapé
    doc.fontSize(8).fillColor("gray")
      .text(`Gerado automaticamente pelo MAPI em ${new Date().toLocaleDateString("pt-BR")}`, { align: "center" });
    doc.text("Este relatório não substitui avaliação profissional.", { align: "center" });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
