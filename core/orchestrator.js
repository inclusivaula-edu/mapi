export async function runMAPI({
  moduleName,
  workflowName,
  input,
  modules,
  context
}) {
  // 🔎 busca módulo
  const module = modules[moduleName];

  if (!module) {
    throw new Error(`Módulo ${moduleName} não encontrado`);
  }

  // 🔎 busca workflow
  const workflow = module.workflows[workflowName];

  if (!workflow) {
    throw new Error(`Workflow ${workflowName} não encontrado`);
  }

  // 🚀 executa workflow
  const result = await workflow({
    input,
    context
  });

  // ✅ PADRÃO SAAS (IMPORTANTE)
  return {
    success: true,
    response: result
  };
}