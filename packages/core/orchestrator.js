import { routeTask } from "./router.js";
import { teacherAgent } from "../agents/teacherAgent.js";
import { assistantAgent } from "../agents/assistantAgent.js";

export async function runMAPI(memory) {
  if (!memory || memory.length === 0) {
    return "⚠️ Nenhuma mensagem";
  }

  const lastMessage = memory[memory.length - 1];

  if (!lastMessage || !lastMessage.content) {
    return "⚠️ Mensagem inválida";
  }

  const input = lastMessage.content;

  // 🧠 decide agente
  const route = await routeTask(input);

  console.log("🧠 Roteador decidiu:", route);

  // 🤖 executa agente
  if (route === "teacher") {
    return await teacherAgent.execute(input);
  }

  return await assistantAgent.execute(input);
}