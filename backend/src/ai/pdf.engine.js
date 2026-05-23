import PDFDocument from "pdfkit";
import fs from "fs";

export function generatePDF(report, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // =============================
      // 🏫 HEADER MEC
      // =============================
      doc
        .fontSize(14)
        .text(
          report.header?.institution?.name || "SECRETARIA DE EDUCAÇÃO",
          { align: "center" }
        );

      doc
        .fontSize(12)
        .text(report.header?.institution?.department || "AEE", {
          align: "center",
        });

      doc.moveDown();

      // =============================
      // 👤 DADOS DO ALUNO
      // =============================
      doc.fontSize(11);

      doc.text(`Aluno: ${report.header?.student?.name || "-"}`);
      doc.text(`Idade: ${report.header?.student?.age || "-"}`);
      doc.text(`Série: ${report.header?.student?.grade || "-"}`);
      doc.text(
        `Diagnóstico: ${report.header?.student?.diagnosis || "-"}`
      );

      doc.moveDown();

      // =============================
      // 📄 SEÇÕES
      // =============================
      (report.sections || []).forEach((section) => {
        doc
          .fontSize(12)
          .text(section.name || "", { underline: true });

        doc.moveDown(0.3);

        doc
          .fontSize(10)
          .text(section.content || "Não informado", {
            align: "justify",
          });

        doc.moveDown();
      });

      // =============================
      // 📅 RODAPÉ
      // =============================
      doc.moveDown();
      doc
        .fontSize(9)
        .text(
          `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
          { align: "right" }
        );

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}
