import analisarContrato     from "./workflows/analisarContrato.js";
import gerarContrato        from "./workflows/gerarContrato.js";
import gerarParecer         from "./workflows/gerarParecer.js";
import gerarPeticao         from "./workflows/gerarPeticao.js";
import resumirLegislacao    from "./workflows/resumirLegislacao.js";
import assistenteJuridico   from "./workflows/assistenteJuridico.js";
import gerarPDFJuridico     from "./workflows/gerarPDFJuridico.js";

/**
 * MÓDULO: juridico
 *
 * Skills de assistência jurídica para o MAPI.
 * Cobre: análise contratual, geração de contratos, pareceres,
 * minutas de petições, resumos de legislação e assistente de dúvidas.
 *
 * DISCLAIMER OBRIGATÓRIO: Todos os documentos gerados são minutas
 * e devem ser revisados por advogado habilitado com registro na OAB
 * antes de qualquer uso legal ou assinatura.
 *
 * Para adicionar nova skill:
 *   1. Crie workflow em ./workflows/
 *   2. Importe e registre abaixo
 *   3. Adicione chave no SKILL_MAP de backend/ai/router.js
 */
export default {
  name: "juridico",

  workflows: {
    "analisar-contrato":   analisarContrato,
    "gerar-contrato":      gerarContrato,
    "gerar-parecer":       gerarParecer,
    "gerar-peticao":       gerarPeticao,
    "resumir-legislacao":  resumirLegislacao,
    "assistente-juridico": assistenteJuridico,
    "gerar-pdf-juridico":  gerarPDFJuridico,
  },
};
