import { generateResponse } from "../services/aiService.js";

export async function validatorAgent(input) {
  return await generateResponse(
    input,
    "validador que verifica clareza e qualidade da resposta"
  );
}