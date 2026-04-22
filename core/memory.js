const memoryStore = [];

export function addToMemory(role, content) {
  memoryStore.push({ role, content });

  // limita memória (últimas 10 mensagens)
  if (memoryStore.length > 10) {
    memoryStore.shift();
  }
}

export function getMemory() {
  return memoryStore;
}

export function clearMemory() {
  memoryStore.length = 0;
}