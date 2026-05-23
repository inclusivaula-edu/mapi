import cron from "node-cron";

cron.schedule("0 9 * * *", async () => {
  console.log("🔁 Iniciando rotina de retry...");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("status", "failed")
    .lt("retry_count", 3);

  for (const invoice of invoices) {
    const now = new Date();

    // lógica de tempo (1d, 3d, 7d)
    const lastRetry = invoice.last_retry || invoice.created_at;
    const diffDays = (now - new Date(lastRetry)) / (1000 * 60 * 60 * 24);

    let shouldRetry = false;

    if (invoice.retry_count === 0 && diffDays >= 1) shouldRetry = true;
    if (invoice.retry_count === 1 && diffDays >= 3) shouldRetry = true;
    if (invoice.retry_count === 2 && diffDays >= 7) shouldRetry = true;

    if (!shouldRetry) continue;

    console.log(`🔁 Tentando cobrança novamente: ${invoice.id}`);

    // 🔥 AQUI você tentaria cobrar novamente via Mercado Pago
    // (ex: criar novo pagamento ou usar assinatura ativa)

    await supabase
      .from("invoices")
      .update({
        retry_count: invoice.retry_count + 1,
        last_retry: new Date(),
      })
      .eq("id", invoice.id);
  }
});

if (invoice.retry_count >= 3) {
  console.log(`🚫 Bloqueando tenant: ${invoice.tenant_id}`);

  await supabase
    .from("subscriptions")
    .update({
      status: "inactive",
    })
    .eq("tenant_id", invoice.tenant_id);
}