import { generateResponse } from "../services/aiService.js";

export async function assistantAgent(input) {
  return await generateResponse(
    input,
    "assistente inteligente"
  );
}