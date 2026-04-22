import { getUser } from "./auth.js";
import { state } from "./state.js";

// 🔐 ELEMENTOS LOGIN
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

// ===============================
// 🔑 LOGIN
// ===============================
loginBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passInput.value;

  const res = await login(email, password);

  if (res.error) {
    alert(res.error.message);
    console.error(res.error);
    return;
  }

  location.reload();
};

// ===============================
// 🆕 REGISTRO
// ===============================
registerBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passInput.value;

  const res = await register(email, password);

  if (res.error) {
    alert("Erro no cadastro");
    return;
  }

  alert("Conta criada! Faça login.");
};

// ===============================
// 🚀 INIT APP
// ===============================
async function init() {
  const user = await getUser();

  // ❌ NÃO LOGADO
  if (!user?.data?.user) {
    console.log("Usuário não logado");
    return;
  }

  // ✅ MULTI-TENANT ATIVO
  state.tenantId = user.data.user.id;

  console.log("✅ Tenant carregado:", state.tenantId);

  // 🔥 CARREGA DASHBOARD DEPOIS DO LOGIN
  await import("./dashboard.js");
}

init();