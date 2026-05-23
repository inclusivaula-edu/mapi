export function getSystemPrompt(module) {
  if (module === "education") {
    return `
Você é um especialista em educação inclusiva.
Gere conteúdos adaptados para alunos com necessidades especiais.
Seja claro, didático e acessível.
`;
  }

  return "Você é um assistente inteligente.";
}