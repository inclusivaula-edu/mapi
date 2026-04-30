export function buildLessonPrompt(data) {
  const { tema, disciplina, serie, tempo, necessidade } = data;

  return `
Você é um especialista em educação inclusiva...

Tema: ${tema}
Disciplina: ${disciplina}
Série: ${serie}
Tempo de aula: ${tempo}
Necessidade especial: ${necessidade}

[COLE AQUI O PROMPT COMPLETO QUE TE ENTREGUEI]
`;
}