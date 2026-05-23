import { saveMemory } from "./memory.engine.js";

export async function evolveAI(userId, lesson, feedback) {
  await saveMemory(userId, {
    lesson,
    feedback,
    learned: true,
  });
}