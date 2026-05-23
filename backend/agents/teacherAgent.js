import { generateResponse } from "../services/aiService.js";

export async function teacherAgent(input) {
  return await generateResponse(
    input,
    "professor especialista em educação inclusiva"
  );
}