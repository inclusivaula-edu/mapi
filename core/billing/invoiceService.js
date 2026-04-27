export async function createInvoice(supabase, data) {
  const { tenantId, subscriptionId, amount } = data;

  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      tenant_id: tenantId,
      subscription_id: subscriptionId,
      amount,
      status: "pending",
      due_date: new Date(),
      retry_count: 0,
    })
    .select()
    .single();

  return invoice;
}