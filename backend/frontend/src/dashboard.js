import { login, register, supabase, getSession, logout } from "./auth.js";
import { getHistory } from "./api.js";
import { renderLayout, addMessage, updateLastMessage } from "./ui.js";
import { state } from "./state.js";

renderLayout();

// ==============================
// 🔐 TOKEN AUTO
// ==============================
async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

// ==============================
// 🧠 USER CONTEXT
// ==============================
async function getUserContext() {
  const { data } = await supabase.auth.getUser();

  if (!data?.user) return null;

  const { data: tenant } = await supabase
    .from("user_tenants")
    .select("tenant_id, role")
    .eq("user_id", data.user.id)
    .single();

  if (tenant) {
    state.tenantId = tenant.tenant_id;
    state.role = tenant.role;
  }

  return tenant;
}

// ==============================
// 🔐 PROTEÇÃO
// ==============================
async function protectRoute() {
  const session = await getSession();

  const authDiv = document.getElementById("auth");
  const appDiv = document.getElementById("app");

  if (!session) {
    authDiv.style.display = "block";
    appDiv.style.display = "none";
  } else {
    authDiv.style.display = "none";
    appDiv.style.display = "block";

    await getUserContext();
  }
}

await protectRoute();

// ==============================
// 🚀 STREAM
// ==============================
async function sendStream() {
  const inputEl = document.getElementById("input");
  const text = inputEl.value;

  if (!text) return;

  addMessage(text, "user");
  inputEl.value = "";

  const token = await getAccessToken();

  const res = await fetch("http://localhost:3000/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      input: text,
      module: "education",
      chatId: state.chatId || "default",
    }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let botMsg = "";
  addMessage("", "bot");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);

    chunk.split("\n").forEach((line) => {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "");

        if (data === "[DONE]") return;

        botMsg += data;
        updateLastMessage(botMsg);
      }
    });
  }
}

// ==============================
// 💰 PAGAMENTO
// ==============================
export async function pagarPlano(plan) {
  const token = await getAccessToken();

  const res = await fetch("http://localhost:3000/create-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      tenantId: state.tenantId,
      plan,
    }),
  });

  const data = await res.json();
  window.location.href = data.url;
}

// ==============================
// 🔐 AUTH
// ==============================
document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await login(email, password);
  location.reload();
});

document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await register(email, password);
  location.reload();
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await logout();
  location.reload();
});

async function pagarPlano(plan) {
  const token = await getAccessToken();

  const res = await fetch("http://localhost:3000/create-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ plan })
  });

  const data = await res.json();

  window.location.href = data.url;
}