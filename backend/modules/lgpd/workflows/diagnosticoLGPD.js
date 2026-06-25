import { lgpdAgent } from "../../../agents/lgpd/LGPDAgent.js";
import { diagnoseMaturity, DIMENSIONS } from "../../../skills/lgpd/diagnoseMaturity.js";
import { supabase } from "../../../services/dbService.js";
import { logger } from "../../../observability/logger.js";

export default async function diagnosticoLGPD({ input, context }) {
  const answers = context.answers ?? (typeof input === "object" ? input : null);

  if (!answers || Object.keys(answers).length === 0) {
    return {
      type: "questionnaire",
      message: "Responda as perguntas abaixo para avaliar a maturidade LGPD da sua organização.",
      dimensions: DIMENSIONS.map((d) => d.label),
      questions: [
        { key: "tem_dpo", question: "A empresa tem um DPO (Encarregado de Dados) nomeado?", type: "sim_nao" },
        { key: "politica_privacidade", question: "Existe uma Política de Privacidade publicada e atualizada?", type: "sim_nao" },
        { key: "ropa", question: "A empresa mantém um Registro de Atividades de Tratamento (ROPA)?", type: "sim_nao" },
        { key: "bases_legais", question: "As bases legais de tratamento estão mapeadas para cada operação?", type: "sim_nao" },
        { key: "consentimento", question: "Existe mecanismo de coleta e gestão de consentimento?", type: "sim_nao" },
        { key: "direitos_titular", question: "Existe canal e processo para atender direitos dos titulares (Art. 18)?", type: "sim_nao" },
        { key: "seguranca_tecnica", question: "Existem medidas técnicas de segurança (criptografia, controle de acesso)?", type: "sim_nao" },
        { key: "seguranca_organizacional", question: "Existem políticas organizacionais de segurança da informação?", type: "sim_nao" },
        { key: "incidentes", question: "Existe plano de resposta a incidentes de dados?", type: "sim_nao" },
        { key: "treinamento", question: "Os colaboradores recebem treinamento sobre proteção de dados?", type: "sim_nao" },
        { key: "contratos_terceiros", question: "Contratos com terceiros incluem cláusulas de proteção de dados (DPA)?", type: "sim_nao" },
        { key: "transferencia_internacional", question: "A empresa transfere dados para fora do Brasil?", type: "sim_nao" },
        { key: "ripd", question: "Foi elaborado Relatório de Impacto à Proteção de Dados (RIPD)?", type: "sim_nao" },
        { key: "setor", question: "Qual o setor da empresa?", type: "texto" },
        { key: "num_funcionarios", question: "Quantos funcionários a empresa tem?", type: "texto" },
      ],
    };
  }

  const result = await diagnoseMaturity(answers);

  // Persiste assessment
  supabase.from("lgpd_assessments").insert({
    organization_id: context.organizationId,
    status: "completed",
    score: result.overall_score,
    answers,
    recommendations: result.recommendations,
    created_by: context.userId,
  }).catch((e) => logger.error("lgpd.assessment.save.error", { error: e.message }));

  return result;
}
