import { searchContext } from "../rag/ragService.js";

export async function getLongMemory(input, tenantId) {
  const docs = await searchContext(input, tenantId);

  return docs.map(d => d.content).join("\n");
}