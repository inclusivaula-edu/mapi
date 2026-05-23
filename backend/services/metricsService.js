export async function getFinancialMetrics(supabase) {

  // 💰 MRR
  const { data: paidInvoices } = await supabase
    .from("invoices")
    .select("amount")
    .eq("status", "paid");

  const MRR = paidInvoices?.reduce((acc, i) => acc + Number(i.amount), 0) || 0;

  // 👤 usuários ativos
  const { count: activeUsers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // ❌ inadimplentes
  const { count: failedInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed");

  // 📉 churn (cancelados/inativos)
  const { count: churn } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "inactive");

  // 🔁 recuperação
  const { data: recovered } = await supabase
    .from("invoices")
    .select("*")
    .gt("retry_count", 0)
    .eq("status", "paid");

  const recoveryRate = paidInvoices?.length
    ? (recovered.length / paidInvoices.length) * 100
    : 0;

  return {
    MRR,
    activeUsers,
    failedInvoices,
    churn,
    recoveryRate: recoveryRate.toFixed(2) + "%",
  };
}