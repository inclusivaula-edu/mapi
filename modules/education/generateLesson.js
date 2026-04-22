import { generateAIResponse } from "../../../core/ai/openaiService.js";

export default async function generateLesson({ input }) {

  const { messages } = input;

  const aiResponse = await generateAIResponse(messages);

  return {
    response: aiResponse
  };
}