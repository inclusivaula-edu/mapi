export function buildReportPrompt(data) {
  return `
Você é especialista em educação inclusiva no Brasil.

Crie um RELATÓRIO PEDAGÓGICO COMPLETO de um aluno PCD.

Base legal obrigatória:
- LDB (Lei 9.394/96)
- BNCC (código + descrição)
- Lei Brasileira de Inclusão (13.146/2015)

DADOS:
Aluno: ${data.nome}
Idade: ${data.idade}
Série: ${data.serie}
Deficiência: ${data.deficiencia}
Tema trabalhado: ${data.tema}

Inclua:

1. Diagnóstico pedagógico
2. PEI completo
3. Estratégias adaptadas
4. Evolução do aluno
5. Avaliação personalizada
6. Plano de intervenção

Baseie-se em:
- Neuroeducação
- Vygotsky
- Piaget

Seja técnico e aplicável.
`;
}