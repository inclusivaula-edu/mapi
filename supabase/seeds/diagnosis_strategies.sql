-- ============================================================
-- SEED: diagnosis_strategies
-- Estratégias pedagógicas por diagnóstico — validadas por
-- especialistas em educação especial e neuropsicologia educacional
-- Fontes: DSM-5, CID-11, Política Nacional de Educação Especial (MEC)
-- ============================================================

CREATE TABLE IF NOT EXISTS diagnosis_strategies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis       TEXT NOT NULL UNIQUE,
  strategies      JSONB NOT NULL,
  sensory_channel TEXT NOT NULL,
  pace            TEXT NOT NULL,
  alerts          JSONB NOT NULL,
  resources       JSONB NOT NULL,
  legal_ref       TEXT
);

INSERT INTO diagnosis_strategies
  (diagnosis, strategies, sensory_channel, pace, alerts, resources, legal_ref)
VALUES

(
  'TEA',
  '["Usar instruções claras, curtas e objetivas, uma de cada vez",
    "Antecipar mudanças de rotina com aviso prévio (ex: agenda visual)",
    "Preferir aprendizagem por repetição e fixação de rotinas",
    "Usar suportes visuais: pictogramas, cartões, mapas mentais",
    "Atividades com começo, meio e fim claramente definidos",
    "Evitar sobrecarga sensorial: iluminação, ruído e texturas",
    "Oferecer escolhas limitadas (2 opções) em vez de questões abertas",
    "Reforço positivo imediato após comportamentos desejados"]',
  'visual',
  'flexível',
  '["Sobrecarga sensorial pode causar crise — observe sinais de estresse",
    "Mudanças de rotina sem preparação podem desencadear comportamentos",
    "Dificuldade com abstração — prefira conteúdo concreto e funcional",
    "Pode ter hiperfoco em temas específicos — use como motivador"]',
  '["PECS (Sistema de Comunicação por Figuras)",
    "Agenda visual com pictogramas",
    "Software de CAA (Comunicação Alternativa e Ampliada)",
    "Cronômetro visual para gestão de tempo",
    "Ambiente estruturado com canto tranquilo"]',
  'Lei 12.764/2012 — Política Nacional de Proteção dos Direitos da Pessoa com Autismo'
),

(
  'TDAH',
  '["Dividir tarefas longas em etapas curtas com checklist",
    "Alternar atividades de concentração com pausas ativas (5 min)",
    "Posicionar o aluno próximo ao professor, longe de janelas",
    "Usar timers visuais para gestão de tempo das atividades",
    "Instruções escritas no quadro além de verbais",
    "Reforço positivo frequente por comportamentos adequados",
    "Atividades com movimento e manipulação de materiais concretos",
    "Reduzir estímulos distratores no ambiente"]',
  'multimodal',
  'moderado',
  '["Dificuldade de permanecer sentado por longos períodos",
    "Impulsividade pode causar conflitos com colegas",
    "Esquecimento de materiais e tarefas — use agenda e lembretes",
    "Desempenho inconsistente não indica falta de esforço"]',
  '["Cronômetro de mesa (timer visual)",
    "Caderno de planejamento diário",
    "Assento próximo ao professor",
    "Acordo de sinalização não-verbal para redirecionamento",
    "Avaliações orais como alternativa às escritas"]',
  'Lei 14.254/2021 — Acompanhamento integral de crianças com TDAH'
),

(
  'Síndrome de Down',
  '["Usar linguagem simples, direta e positiva",
    "Apresentar conteúdo em pequenas partes com muita repetição",
    "Explorar fortemente o canal visual: imagens, vídeos, manipulação",
    "Valorizar o que o aluno já sabe — partir do concreto para o abstrato",
    "Atividades de vida prática integradas ao currículo",
    "Estimular a comunicação verbal mesmo com dificuldades",
    "Jogos e brincadeiras como principal recurso pedagógico",
    "Parceria com colegas para atividades colaborativas"]',
  'visual',
  'lento',
  '["Hipotonia pode afetar escrita manual — use teclado como alternativa",
    "Dificuldades de memória de trabalho — reforce com registros visuais",
    "Pode ter perda auditiva associada — verifique posicionamento",
    "Dificuldades de abstração exigem adaptação de conteúdo"]',
  '["Materiais concretos e manipuláveis",
    "Livros com imagens e letra ampliada",
    "Teclado adaptado ou tablet com caneta",
    "Aplicativos de alfabetização com resposta sonora",
    "Vídeos curtos e coloridos sobre o conteúdo"]',
  'Lei 13.146/2015 — Lei Brasileira de Inclusão (LBI)'
),

(
  'Deficiência Visual',
  '["Descrever verbalmente tudo que é apresentado visualmente",
    "Usar materiais em relevo e manipuláveis para conceitos geométricos",
    "Oferecer textos em Braille ou fonte ampliada (mínimo 18pt)",
    "Leitura em voz alta de enunciados, quadros e imagens",
    "Explorar recursos sonoros: audiolivros, podcasts educativos",
    "Organizar a sala de forma previsível sem mudar mobília sem aviso",
    "Tempo adicional para atividades que exigem percepção espacial",
    "Parceria com professor itinerante de deficiência visual"]',
  'auditivo',
  'flexível',
  '["Iluminação inadequada afeta diretamente o desempenho",
    "Fadiga ocular em leituras prolongadas — faça intervalos",
    "Materiais sem adaptação em Braille ou áudio são barreiras reais",
    "Orientação e mobilidade podem precisar de apoio específico"]',
  '["Impressora Braille ou transcritor Braille",
    "DOSVOX ou NVDA (leitores de tela gratuitos)",
    "Reglete e punção para escrita Braille",
    "Lupa eletrônica para baixa visão",
    "Audiolivros e materiais da Fundação Dorina Nowill"]',
  'Lei 13.146/2015 — LBI | Decreto 5.296/2004 — Acessibilidade'
),

(
  'Deficiência Auditiva',
  '["Posicionar o aluno na primeira fileira, com visão do rosto do professor",
    "Falar de frente para o aluno, sem cobrir a boca — facilita leitura labial",
    "Usar LIBRAS quando possível — solicitar intérprete para escola",
    "Reforçar explicações verbais com textos escritos no quadro",
    "Usar recursos visuais abundantes: mapas, infográficos, vídeos com legenda",
    "Verificar se o aluno usa aparelho auditivo e se está funcionando",
    "Reduzir ruído de fundo na sala (ventilador, barulho externo)",
    "Avaliar aprendizagem por meio escrito ou LIBRAS, não apenas oral"]',
  'visual',
  'moderado',
  '["Ruído de fundo reduz muito a compreensão com aparelho auditivo",
    "Aluno não ouviu — não confunda com desatenção ou desobediência",
    "Dificuldade com português escrito pode ser reflexo da surdez, não déficit cognitivo",
    "Isolamento social — promova atividades colaborativas inclusivas"]',
  '["Intérprete de LIBRAS (direito garantido pela Lei 10.436/2002)",
    "Vídeos com legenda em português",
    "Aplicativos de LIBRAS: Hand Talk, VLibras",
    "Sistema FM (microfone do professor + receptor no aluno)",
    "Materiais escritos e visuais complementando o oral"]',
  'Lei 10.436/2002 — LIBRAS | Lei 13.146/2015 — LBI'
),

(
  'Deficiência Intelectual',
  '["Adaptar o currículo priorizando habilidades funcionais e de vida prática",
    "Usar linguagem simples, concreta e objetiva, sem abstrações",
    "Repetição e reforço contínuo — aprendizagem exige mais tempo",
    "Atividades curtas com objetivo único e claro",
    "Valorizar progressos pequenos com reforço positivo imediato",
    "Integrar conteúdo acadêmico com situações da vida real",
    "Atividades em dupla ou pequenos grupos para aprendizagem colaborativa",
    "Avaliação contínua e processual, nunca apenas por prova escrita"]',
  'multimodal',
  'lento',
  '["Não confunda ritmo de aprendizagem lento com incapacidade",
    "Dificuldades de generalização — ensine em contextos variados",
    "Autoestima frágil — evite comparações com outros alunos",
    "Necessidade de suporte nas transições de atividade e ambiente"]',
  '["Materiais simplificados e adaptados pelo professor",
    "Jogos de memória e associação",
    "Softwares de alfabetização com reforço visual e sonoro",
    "Rotina clara com sequência de pictogramas",
    "PEI (Plano Educacional Individualizado) atualizado anualmente"]',
  'Lei 13.146/2015 — LBI | CID-11 Código 6A00'
),

(
  'Dislexia',
  '["Usar fonte sem serifa (Arial, Comic Sans) em corpo 14 ou maior",
    "Espaçamento entre linhas de 1,5 ou duplo",
    "Fundo colorido levemente (creme ou amarelo claro) para reduzir fadiga",
    "Avaliações orais como alternativa às escritas",
    "Tempo adicional para leitura e escrita — mínimo 25% a mais",
    "Não corrigir toda escrita de uma vez — foque no conteúdo antes da forma",
    "Usar audiolivros e textos em áudio como apoio",
    "Evitar leitura em voz alta obrigatória na frente da turma"]',
  'auditivo',
  'flexível',
  '["Erros ortográficos não refletem desconhecimento do conteúdo",
    "Leitura em voz alta pode ser fonte de ansiedade e vergonha",
    "Dificuldade com cópia do quadro — forneça material impresso",
    "Confusão de letras simétricas (b/d, p/q) é sintoma, não descuido"]',
  '["Texto digitalizado para usar leitor de tela",
    "Gravador para registrar aulas",
    "Aplicativo de texto por voz (ditado)",
    "Régua de leitura para acompanhar linha",
    "Avaliação diferenciada garantida pela Lei 13.146/2015"]',
  'Lei 13.146/2015 — LBI | Lei 14.254/2021'
),

(
  'Paralisia Cerebral',
  '["Adaptar forma de registro: computador, tablet, comunicador",
    "Posicionamento adequado na cadeira — consultar fisioterapeuta",
    "Dar tempo adicional para todas as atividades motoras",
    "Separar dificuldade motora de capacidade cognitiva — não subestime",
    "Usar CAA (Comunicação Alternativa) se necessário",
    "Avaliar por meio oral ou com auxílio de tecnologia assistiva",
    "Atividades adaptadas para motricidade disponível do aluno",
    "Planejar a aula considerando a fadiga muscular"]',
  'multimodal',
  'flexível',
  '["Fadiga muscular aumenta ao longo do dia — priorize atividades importantes cedo",
    "Fala pode ser afetada (disartria) sem comprometer cognição",
    "Dificuldade motora não indica deficiência intelectual",
    "Acessibilidade física da sala é requisito legal"]',
  '["Computador com software de acesso alternativo (varredura, eye tracking)",
    "Prancha de comunicação (CAA)",
    "Mesa adaptada com apoio para membros superiores",
    "Lápis engrossado ou suporte para escrita",
    "Parceria com terapeuta ocupacional da escola"]',
  'Lei 13.146/2015 — LBI | Decreto 5.296/2004'
)

ON CONFLICT (diagnosis) DO NOTHING;

COMMENT ON TABLE diagnosis_strategies IS 'Estratégias pedagógicas por diagnóstico — validadas para AEE (MEC/CID-11/DSM-5)';
