import { teacherAgent } from "../agents/teacherAgent.js";
import { assistantAgent } from "../agents/assistantAgent.js";
import { analystAgent } from "../agents/analystAgent.js";
import { validatorAgent } from "../agents/validatorAgent.js";

export async function orchestrate(input) {
  // 1. Escolha base
  const baseResponse = await assistantAgent(input);

  // 2. Análise
  const analysis = await analystAgent(baseResponse);

  // 3. Validação final
  const finalResponse = await validatorAgent(analysis);

  return finalResponse;
}