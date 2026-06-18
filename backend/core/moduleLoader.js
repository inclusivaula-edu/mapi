import { logger } from "../observability/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULES_PATH = path.join(__dirname, "../modules");

/**
 * Carrega dinamicamente todos os módulos da pasta /modules.
 *
 * Cada módulo deve ter:
 *   - um arquivo index.js com export default { name, workflows }
 *   - `name` (string): identificador único do módulo
 *   - `workflows` (object): mapa de { nomeDaSkill: asyncFunction }
 *   - `init` (function, opcional): executada uma vez no boot
 *
 * Módulos inválidos ou que falham no carregamento são ignorados com aviso —
 * isso garante que um módulo quebrado não derrube o servidor inteiro.
 */
export async function loadModules() {
  const modules = {};

  if (!fs.existsSync(MODULES_PATH)) {
    logger.warn("⚠️  Pasta /modules não encontrada.");
    return modules;
  }

  const folders = fs.readdirSync(MODULES_PATH).filter((f) => {
    const fullPath = path.join(MODULES_PATH, f);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const folder of folders) {
    const indexPath = path.join(MODULES_PATH, folder, "index.js");

    if (!fs.existsSync(indexPath)) {
      logger.warn(`⚠️  Módulo "${folder}" ignorado: sem index.js`);
      continue;
    }

    try {
      const mod = await import(`file://${indexPath}`);
      const def = mod.default;

      if (!def?.name || typeof def.workflows !== "object") {
        logger.warn(`⚠️  Módulo "${folder}" ignorado: export default deve ter { name, workflows }`);
        continue;
      }

      // Executa hook de inicialização, se existir
      if (typeof def.init === "function") {
        await def.init();
      }

      modules[def.name] = def;
      logger.info("module.loaded", { name: def.name });

    } catch (err) {
      logger.error(`❌ Erro ao carregar módulo "${folder}":`, err.message);
    }
  }

  return modules;
}
