import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import gerarContrato from "./gerarContrato.js";
import gerarParecer  from "./gerarParecer.js";

/**
 * WORKFLOW: gerar-pdf-juridico
 *
 * Gera o documento jurídico e converte para PDF formatado.
 * Retorna { filePath, fileName } para o server servir como download.
 *
 * Suporta: contrato | parecer | peticao
 */
export default async function gerarPDFJuridico({ input, context }) {
  const { docTipo } = context;

  // Gera o documento primeiro
  let documento;
  if (docTipo === "contrato") {
    documento = await gerarContrato({ input, context });
  } else {
    documento = await gerarParecer({ input, context });
  }

  const fileName = `${docTipo ?? "documento"}_${Date.now()}.pdf`;
  const dir = path.resolve("./tmp");
  const filePath = path.join(dir, fileName);
  fs.mkdirSync(dir, { recursive: true });

  await buildPDF(documento, filePath);

  return { filePath, fileName };
}

function buildPDF(doc, filePath) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ margin: 60, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    pdf.pipe(stream);

    // ── Cabeçalho ──────────────────────────────────────────
    pdf.fontSize(16).font("Helvetica-Bold")
       .text(doc.titulo ?? "DOCUMENTO JURÍDICO", { align: "center" });
    pdf.moveDown(0.5);
    pdf.fontSize(10).font("Helvetica")
       .text(`Área: ${doc.area ?? "—"} | Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, { align: "center" });

    pdf.moveDown(1);
    pdf.moveTo(60, pdf.y).lineTo(535, pdf.y).stroke();
    pdf.moveDown(1);

    // ── Partes ─────────────────────────────────────────────
    if (doc.partes?.length) {
      pdf.fontSize(12).font("Helvetica-Bold").text("PARTES");
      pdf.moveDown(0.3);
      for (const parte of doc.partes) {
        pdf.fontSize(10).font("Helvetica")
           .text(`${parte.papel}: ${parte.nome ?? parte.descricao ?? "—"}`);
        if (parte.qualificacao) pdf.text(`   ${parte.qualificacao}`, { color: "grey" });
      }
      pdf.moveDown(1);
    }

    // ── Preâmbulo ──────────────────────────────────────────
    if (doc.preambulo) {
      pdf.fontSize(10).font("Helvetica").text(doc.preambulo, { align: "justify" });
      pdf.moveDown(1);
    }

    // ── Seções / Cláusulas ────────────────────────────────
    const items = doc.clausulas ?? doc.secoes ?? [];
    for (const item of items) {
      pdf.fontSize(11).font("Helvetica-Bold").text(item.titulo ?? "");
      pdf.moveDown(0.3);
      pdf.fontSize(10).font("Helvetica").text(item.conteudo ?? "", { align: "justify" });
      pdf.moveDown(0.8);
    }

    // ── Legislação aplicada ───────────────────────────────
    if (doc.legislacao_aplicada?.length) {
      pdf.moveDown(0.5);
      pdf.moveTo(60, pdf.y).lineTo(535, pdf.y).stroke();
      pdf.moveDown(0.5);
      pdf.fontSize(11).font("Helvetica-Bold").text("LEGISLAÇÃO APLICADA");
      pdf.moveDown(0.3);
      for (const leg of doc.legislacao_aplicada) {
        pdf.fontSize(9).font("Helvetica")
           .text(`• ${leg.lei}${leg.artigo ? " — " + leg.artigo : ""}: ${leg.ementa ?? ""}`, { align: "justify" });
      }
      pdf.moveDown(0.8);
    }

    // ── Assinaturas ────────────────────────────────────────
    if (doc.assinaturas) {
      pdf.moveDown(1);
      pdf.fontSize(10).font("Helvetica").text(doc.assinaturas, { align: "center" });
      pdf.moveDown(2);
    } else {
      pdf.moveDown(2);
      pdf.fontSize(10).font("Helvetica")
         .text("_______________________________        _______________________________", { align: "center" })
         .text("Contratante                                    Contratado", { align: "center" });
      pdf.moveDown(0.5);
      pdf.text(`Local e data: ________________, ___/___/______`, { align: "center" });
    }

    // ── Disclaimer ────────────────────────────────────────
    pdf.moveDown(1);
    pdf.moveTo(60, pdf.y).lineTo(535, pdf.y).stroke();
    pdf.moveDown(0.5);
    pdf.fontSize(8).fillColor("gray")
       .text(doc.disclaimer ?? "Este documento foi gerado por IA. Deve ser revisado por advogado habilitado antes do uso.", { align: "justify" });

    pdf.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
