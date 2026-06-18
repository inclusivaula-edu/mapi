/**
 * ORQUESTRADOR MAPI
 *
 * Responsabilidade única: receber { moduleName, workflowName, input, context }
 * e delegar para o workflow correto dentro do módulo correto.
 *
 * Não sabe nada sobre HTTP, billing ou OpenAI — apenas compõe módulos.
 */
export async function runMAPI({ moduleName, workflowName, input, modules, context }) {
  // Valida presença do módulo
  const mod = modules[moduleName];
  if (!mod) {
    throw new Error(`Módulo "${moduleName}" não encontrado. Módulos disponíveis: ${Object.keys(modules).join(", ")}`);
  }

  // Valida presença do workflow dentro do módulo
  const workflow = mod.workflows?.[workflowName];
  if (!workflow) {
    throw new Error(`Workflow "${workflowName}" não encontrado no módulo "${moduleName}".`);
  }

  // Executa o workflow e retorna sempre no formato padrão { success, response }
  const response = await workflow({ input, context });

  return { success: true, response };
}
