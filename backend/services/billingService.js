export async function processRetries(supabase) {
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("status", "failed")
    .lt("retry_count", 3);

  for (const invoice of invoices) {
    const now = new Date();
    const last = invoice.last_retry || invoice.created_at;

    const diffDays =
      (now - new Date(last)) / (1000 * 60 * 60 * 24);

    let retry = false;

    if (invoice.retry_count === 0 && diffDays >= 1) retry = true;
    if (invoice.retry_count === 1 && diffDays >= 3) retry = true;
    if (invoice.retry_count === 2 && diffDays >= 7) retry = true;

    if (!retry) continue;

    console.log("🔁 Retry invoice:", invoice.id);

    // 🔥 AQUI você poderia recriar cobrança
    // ou apenas marcar tentativa

    await supabase
      .from("invoices")
      .update({
        retry_count: invoice.retry_count + 1,
        last_retry: new Date(),
      })
      .eq("id", invoice.id);

    // ===============================
    // 🚫 BLOQUEIO REAL
    // ===============================
    if (invoice.retry_count >= 2) {
      console.log("🚫 BLOQUEANDO TENANT:", invoice.tenant_id);

      await supabase
        .from("subscriptions")
        .update({
          status: "inactive",
          updated_at: new Date(),
        })
        .eq("tenant_id", invoice.tenant_id);
    }
  }
}