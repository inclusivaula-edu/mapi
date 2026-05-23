import logo from "./assets/logo.png";

export function renderLayout() {
  document.body.innerHTML = `
  <div class="container">

    <aside class="sidebar">
      <div class="logo">
        <img src="${logo}" />
        <h2>MAPI</h2>
      </div>

      <label>Módulo</label>
      <select id="moduleSelect">
        <option value="education">Education</option>
      </select>

      <label>Workflow</label>
      <select id="workflowSelect">
        <option value="generateLessonFlow">Gerar Aula</option>
      </select>

      <hr/>

      <div class="logs-title">Logs</div>
      <div id="logs"></div>
    </aside>

    <main class="main">
      <header>
        <span>🤖 MAPI Intelligence</span>
      </header>

      <div id="chat" class="chat"></div>

      <div class="input-area">
        <input id="input" placeholder="Digite sua mensagem..." />
        <button id="send">Enviar</button>
      </div>
    </main>

  </div>
  `;
}

export function addMessage(text, type) {
  const chat = document.getElementById("chat");

  const msg = document.createElement("div");
  msg.className = `msg ${type}`;
  msg.innerText = text;

  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

export function addLog(log) {
  const logs = document.getElementById("logs");

  const item = document.createElement("div");
  item.className = "log-item";
  item.innerText = log;

  logs.appendChild(item);
}

export function updateLastMessage(text) {
  const chat = document.getElementById("chat");

  let last = chat.lastElementChild;

  if (!last || !last.classList.contains("bot")) {
    addMessage("", "bot");
    last = chat.lastElementChild;
  }

  last.innerText = text;
}