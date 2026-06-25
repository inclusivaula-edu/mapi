import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { logger } from "../../observability/logger.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "text/plain"];

export async function parseEditalFromBuffer(buffer, mimetype, filename) {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("Arquivo excede 10MB");
  }

  if (mimetype === "text/plain") {
    return {
      text: buffer.toString("utf-8").slice(0, 50000),
      pages: 1,
      filename,
      method: "text",
    };
  }

  if (mimetype === "application/pdf") {
    try {
      const data = await pdf(buffer);
      const text = data.text?.trim();
      if (!text || text.length < 50) {
        throw new Error("PDF sem texto extraível — pode ser um PDF escaneado/imagem. Use um PDF com texto selecionável.");
      }
      return {
        text: text.slice(0, 50000),
        pages: data.numpages,
        filename,
        method: "pdf-parse",
      };
    } catch (err) {
      if (err.message.includes("escaneado")) throw err;
      logger.error("pdf-parse.error", { filename, error: err.message });
      throw new Error("Falha ao processar PDF: " + err.message);
    }
  }

  throw new Error(`Tipo de arquivo não suportado: ${mimetype}. Use PDF ou TXT.`);
}
