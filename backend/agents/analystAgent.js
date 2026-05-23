import { generateResponse } from "../services/aiService.js";

export async function analystAgent(input) {
  return await generateResponse(
    input,
    "analista que resume e organiza informações"
  );
}