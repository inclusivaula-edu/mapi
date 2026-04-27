import { login, register, supabase, getSession, logout } from "./auth.js";
import { renderLayout, addMessage, updateLastMessage } from "./ui.js";
import { state } from "./state.js";

renderLayout();

// ==============================
async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

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
async function protectRoute() {
  const session = await getSession();

  document.getElementById("auth").style.display = session ? "none" : "block";
  document.getElementById("app").style.display = session ? "block" : "none";

  if (session) await getUserContext();
}

await protectRoute();

// ==============================
// 💳 ASSINATURA REAL
// ==============================
document
  .getElementById("form-checkout")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = await getAccessToken();

    // ⚠️ Aqui você deve integrar MercadoPago.js para gerar o cardToken real
    const fakeCardToken = "TEST_TOKEN";

    const res = await fetch("http://localhost:3000/create-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        plan: "pro",
        email: "cliente@email.com",
        cardToken: fakeCardToken,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("🔥 Assinatura ativada!");
    } else {
      alert("Erro ao assinar");
    }
  });

// ==============================
// AUTH
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