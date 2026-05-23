import PDFDocument from "pdfkit";
import fs from "fs";

export function generatePDF(content, filePath) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      margin: 50,
    });

    doc.pipe(fs.createWriteStream(filePath));

    // 🔥 Título
    doc
      .fontSize(20)
      .text("Plano de Aula Inclusivo", {
        align: "center",
      });

    doc.moveDown();

    // 🔥 Conteúdo
    doc
      .fontSize(12)
      .text(content, {
        align: "justify",
        lineGap: 4,
      });

    doc.end();

    resolve(filePath);
  });
}