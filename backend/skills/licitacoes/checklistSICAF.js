import { chat } from "../../services/aiService.js";

/**
 * checklistSICAF — gera checklist completo de habilitação para pregão federal
 * Baseado em: SICAF, Decreto 3.722/2001, Lei 14.133/2021 Art. 66-70
 */
export async function checklistSICAF({ tipoEmpresa = "geral", objeto = "", modalidade = "pregao-eletronico" }) {
  const base = [
    // ── Habilitação Jurídica ──────────────────────────────────
    { categoria: "Habilitação Jurídica", documento: "Ato constitutivo, estatuto ou contrato social", obrigatorio: true, prazo: "Vigente" },
    { categoria: "Habilitação Jurídica", documento: "CNPJ — Comprovante de inscrição e situação cadastral", obrigatorio: true, prazo: "Vigente" },
    { categoria: "Habilitação Jurídica", documento: "Cédula de identidade dos sócios administradores", obrigatorio: true, prazo: "Vigente" },

    // ── Regularidade Fiscal Federal ───────────────────────────
    { categoria: "Regularidade Fiscal", documento: "CND Federal — Certidão Negativa de Débitos Tributários Federais e Dívida Ativa da União", obrigatorio: true, prazo: "Vigente (emitir no dia)" },
    { categoria: "Regularidade Fiscal", documento: "CRF — Certificado de Regularidade do FGTS", obrigatorio: true, prazo: "Vigente (emitir no dia)" },
    { categoria: "Regularidade Fiscal", documento: "CNDT — Certidão Negativa de Débitos Trabalhistas", obrigatorio: true, prazo: "Vigente (emitir no dia)" },
    { categoria: "Regularidade Fiscal", documento: "CND Estadual", obrigatorio: true, prazo: "Vigente" },
    { categoria: "Regularidade Fiscal", documento: "CND Municipal (ISS)", obrigatorio: true, prazo: "Vigente" },

    // ── Qualificação Econômico-Financeira ─────────────────────
    { categoria: "Qualificação Econômico-Financeira", documento: "Balanço Patrimonial e DRE do último exercício social", obrigatorio: true, prazo: "Último exercício" },
    { categoria: "Qualificação Econômico-Financeira", documento: "Índices financeiros: Liquidez Geral ≥ 1,0, Solvência Geral ≥ 1,0, Liquidez Corrente ≥ 1,0", obrigatorio: true, prazo: "Calculado sobre o balanço" },
    { categoria: "Qualificação Econômico-Financeira", documento: "Declaração de inexistência de fatos impeditivos supervenientes", obrigatorio: true, prazo: "Data da sessão" },

    // ── Qualificação Técnica ──────────────────────────────────
    { categoria: "Qualificação Técnica", documento: "Atestado de capacidade técnica emitido por pessoa jurídica de direito público ou privado", obrigatorio: true, prazo: "Sem prazo mínimo" },
    { categoria: "Qualificação Técnica", documento: "Registro ou inscrição no Conselho Profissional competente (quando aplicável)", obrigatorio: false, prazo: "Vigente" },
    { categoria: "Qualificação Técnica", documento: "Declaração de disponibilidade de equipamentos e pessoal técnico", obrigatorio: false, prazo: "Data da sessão" },

    // ── Declarações Obrigatórias ──────────────────────────────
    { categoria: "Declarações", documento: "Declaração de não emprego de menor (CF Art. 7º, XXXIII)", obrigatorio: true, prazo: "Data da sessão" },
    { categoria: "Declarações", documento: "Declaração de elaboração independente de proposta (IN SLTI 2/2009)", obrigatorio: true, prazo: "Data da sessão" },
    { categoria: "Declarações", documento: "Declaração de inexistência de fato impeditivo de habilitação", obrigatorio: true, prazo: "Data da sessão" },
    { categoria: "Declarações", documento: "Declaração de enquadramento como ME/EPP — se aplicável (LC 123/2006)", obrigatorio: false, prazo: "Data da sessão" },
  ];

  // Adiciona documentos específicos por tipo de empresa
  if (tipoEmpresa === "me-epp") {
    base.push(
      { categoria: "ME/EPP", documento: "Certidão Simplificada da Junta Comercial ou declaração de enquadramento ME/EPP", obrigatorio: true, prazo: "Até 90 dias" },
      { categoria: "ME/EPP", documento: "Habilitação fiscal: irregularidades permitem prazo de 5 dias úteis para regularização (LC 123/2006 Art. 43)", obrigatorio: false, prazo: "Após convocação" }
    );
  }

  // Enriquece com análise de IA se objeto fornecido
  if (objeto) {
    try {
      const raw = await chat({
        system: `Você é especialista em licitações federais. Com base no objeto da licitação, identifique documentos adicionais de habilitação necessários além dos padrões.
Responda APENAS JSON: { "documentos_adicionais": [{ "categoria": "...", "documento": "...", "obrigatorio": true/false, "prazo": "...", "fundamento": "..." }] }`,
        user: `Objeto da licitação: ${objeto}\nModalidade: ${modalidade}`,
        model: "gpt-4o-mini",
        temperature: 0,
      });
      const extra = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (extra.documentos_adicionais?.length) {
        base.push(...extra.documentos_adicionais);
      }
    } catch { /* retorna checklist base sem enriquecimento */ }
  }

  return {
    checklist: base,
    total: base.length,
    obrigatorios: base.filter(d => d.obrigatorio).length,
    fundamento: "SICAF — Decreto 3.722/2001 + Lei 14.133/2021 Arts. 62-70 + Decreto 10.024/2019",
    observacao: "Documentos com prazo 'emitir no dia' devem ser gerados na data da sessão pública. Verifique no edital se há exigências adicionais específicas.",
  };
}
