import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarPDFLicitacao({ input, context }) {
  const tipo = context.tipo ?? context.docTipo ?? input;
  if (!tipo) throw new Error("MISSING_CONTEXT: tipo do documento é obrigatório");

  const documento = await licitacaoAgent.run({
    tipo,
    descricao: context.descricao ?? "",
    editalText: context.editalText,
    context,
  });

  const fileName = `licitacao_${tipo.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  const dir = path.resolve("./tmp");
  const filePath = path.join(dir, fileName);
  fs.mkdirSync(dir, { recursive: true });

  await buildLicitacaoPDF(documento, filePath);

  return { filePath, fileName };
}

function buildLicitacaoPDF(doc_data, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(16).text(doc_data.titulo ?? "Documento de Licitação", { align: "center" });
    if (doc_data.edital_ref) {
      doc.fontSize(10).text(`Referência: ${doc_data.edital_ref}`, { align: "center" });
    }
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
      .text(doc_data.disclaimer ?? "Documento gerado por IA — deve ser revisado por profissional habilitado.", { align: "center" });
    doc.text(`Gerado pelo MAPI em ${new Date().toLocaleDateString("pt-BR")}`, { align: "center" });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
