import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { lgpdAgent } from "../../../agents/lgpd/LGPDAgent.js";

export default async function gerarPDFLGPD({ input, context }) {
  const tipo = context.tipo ?? context.docTipo ?? input;
  if (!tipo) throw new Error("MISSING_CONTEXT: tipo do documento é obrigatório");

  const documento = await lgpdAgent.run({
    tipo,
    descricao: context.descricao ?? "",
    answers: context.answers,
    context,
  });

  const fileName = `lgpd_${tipo.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  const dir = path.resolve("./tmp");
  const filePath = path.join(dir, fileName);
  fs.mkdirSync(dir, { recursive: true });

  await buildLGPDPDF(documento, filePath);

  return { filePath, fileName };
}

function buildLGPDPDF(doc_data, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(16).text(doc_data.titulo ?? "Documento LGPD", { align: "center" });
    doc.fontSize(10).text("Lei 13.709/2018 — Lei Geral de Proteção de Dados", { align: "center" });
    doc.moveDown();

    for (const section of doc_data.secoes ?? []) {
      doc.fontSize(12).text(section.titulo ?? "", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).text(section.conteudo ?? "", { align: "justify" });
      doc.moveDown();
    }

    if (doc_data.legislacao_aplicada?.length) {
      doc.moveDown();
      doc.fontSize(12).text("Legislação Aplicada", { underline: true });
      doc.moveDown(0.3);
      for (const ref of doc_data.legislacao_aplicada) {
        doc.fontSize(9).text(`• ${ref.lei} ${ref.artigo ?? ""} — ${ref.ementa ?? ""}`);
      }
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor("gray")
      .text(doc_data.disclaimer ?? "Documento gerado por IA — deve ser revisado por DPO ou advogado especializado.", { align: "center" });
    doc.text(`Gerado pelo MAPI em ${new Date().toLocaleDateString("pt-BR")}`, { align: "center" });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
