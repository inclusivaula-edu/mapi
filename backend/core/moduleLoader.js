import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// resolve __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// caminho da pasta modules
const modulesPath = path.join(__dirname, "../modules");

export async function loadModules() {
  const modules = {};

  const folders = fs.readdirSync(modulesPath);

  for (const folder of folders) {
    const moduleIndexPath = path.join(modulesPath, folder, "index.js");

    // 🔒 verifica se o index.js existe
    if (!fs.existsSync(moduleIndexPath)) {
      console.warn(`⚠️ Módulo ${folder} sem index.js`);
      continue;
    }

    try {
      const mod = await import(`file://${moduleIndexPath}`);

      // 🔒 valida export default
      if (!mod.default) {
        console.warn(`⚠️ Módulo ${folder} sem export default`);
        continue;
      }

      const moduleName = mod.default.name;

      // 🔒 valida nome
      if (!moduleName) {
        console.warn(`⚠️ Módulo ${folder} sem propriedade 'name'`);
        continue;
      }

      modules[moduleName] = mod.default;

      // 🔥 init opcional
      if (typeof mod.default.init === "function") {
        await mod.default.init();
      }

      console.log(`📦 Módulo carregado: ${moduleName}`);

    } catch (err) {
      console.error(`❌ Erro ao carregar módulo ${folder}:`, err.message);
    }
  }

  return modules;
}