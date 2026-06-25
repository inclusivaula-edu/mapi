-- Seeds: Legislação Federal Completa — gov.br/compras
-- Cobre: Decreto 10.024/2019, IN SEGES 65+67/2021, PNCP, SRP, TCU

INSERT INTO bid_references (organization_id, lei, artigo, ementa, tipo, area) VALUES

-- ── PREGÃO ELETRÔNICO (Decreto 10.024/2019) ──────────────────
(NULL, 'Decreto 10.024/2019', 'Art. 1º', 'Regulamenta o pregão eletrônico para aquisição de bens e serviços comuns no âmbito da Administração Pública federal', 'federal', 'pregao'),
(NULL, 'Decreto 10.024/2019', 'Art. 4º', 'Sistema eletrônico utilizado pela Administração Pública federal: ComprasNet / PNCP', 'federal', 'pregao'),
(NULL, 'Decreto 10.024/2019', 'Art. 11', 'Fase de lances: duração mínima de 10 minutos, prorrogação automática', 'federal', 'pregao'),
(NULL, 'Decreto 10.024/2019', 'Art. 15', 'Aceitabilidade da proposta: pregoeiro analisa exequibilidade', 'federal', 'pregao'),
(NULL, 'Decreto 10.024/2019', 'Art. 17', 'Habilitação: documentos enviados via sistema após arrematação', 'federal', 'pregao'),
(NULL, 'Decreto 10.024/2019', 'Art. 20', 'Adjudicação e homologação pelo pregoeiro e autoridade competente', 'federal', 'pregao'),
(NULL, 'Decreto 10.024/2019', 'Art. 24', 'Prazo de validade da proposta: mínimo 60 dias salvo edital dispor diferente', 'federal', 'pregao'),

-- ── ESTUDO TÉCNICO PRELIMINAR — IN SEGES 67/2021 ─────────────
(NULL, 'IN SEGES/ME nº 67/2021', 'Art. 7º', 'Conteúdo obrigatório do ETP: necessidade, estimativa de quantidade, levantamento de mercado, estimativa de valor, descrição da solução, justificativa, viabilidade', 'federal', 'etp'),
(NULL, 'IN SEGES/ME nº 67/2021', 'Art. 8º', 'ETP deve conter análise de sustentabilidade e impacto ambiental quando aplicável', 'federal', 'etp'),
(NULL, 'IN SEGES/ME nº 67/2021', 'Art. 10', 'ETP dispensa: contratações com valores até R$ 8.000 (compras) e R$ 16.000 (serviços) — exceto obras', 'federal', 'etp'),
(NULL, 'IN SEGES/ME nº 67/2021', 'Art. 12', 'Pesquisa de preços: mínimo 3 cotações ou painel de preços do governo federal', 'federal', 'etp'),

-- ── TERMO DE REFERÊNCIA — IN SEGES 65/2021 ───────────────────
(NULL, 'IN SEGES/ME nº 65/2021', 'Art. 6º', 'TR deve conter: objeto, fundamentação, descrição dos requisitos, modelo de execução, modelo de gestão, critérios de medição e pagamento, forma de seleção e estimativa de valor', 'federal', 'tr'),
(NULL, 'IN SEGES/ME nº 65/2021', 'Art. 8º', 'Modelo de execução do objeto: obrigações do contratado e critérios de qualidade', 'federal', 'tr'),
(NULL, 'IN SEGES/ME nº 65/2021', 'Art. 9º', 'Modelo de gestão do contrato: fiscal administrativo, fiscal técnico, gestor de contrato', 'federal', 'tr'),
(NULL, 'IN SEGES/ME nº 65/2021', 'Art. 14', 'Adequação orçamentária: indicação do programa de trabalho e elemento de despesa', 'federal', 'tr'),
(NULL, 'IN SEGES/ME nº 65/2021', 'Art. 18', 'Critério de julgamento e regime de execução devem estar explícitos no TR', 'federal', 'tr'),

-- ── SICAF — HABILITAÇÃO FEDERAL ───────────────────────────────
(NULL, 'Instrução Normativa SLTI nº 2/2010', 'Art. 4º', 'SICAF: níveis de cadastramento — habilitação jurídica, regularidade fiscal federal, estadual e municipal, qualificação econômico-financeira, qualificação técnica', 'federal', 'sicaf'),
(NULL, 'Lei 14.133/2021', 'Art. 66', 'Fornecedor deve estar cadastrado no SICAF ou sistema equivalente para participar de licitações federais', 'federal', 'sicaf'),
(NULL, 'Decreto 3.722/2001', 'Art. 1º', 'Regulamenta o SICAF — Sistema de Cadastramento Unificado de Fornecedores', 'federal', 'sicaf'),
(NULL, 'Lei 9.012/1995', 'Art. 29', 'Regularidade perante a Fazenda Nacional: certidão negativa de débitos tributários federais', 'federal', 'sicaf'),

-- ── PNCP — PORTAL NACIONAL DE CONTRATAÇÕES ───────────────────
(NULL, 'Lei 14.133/2021', 'Art. 174', 'PNCP: portal unificado obrigatório para publicação de todos os atos relativos às contratações públicas a partir de 1º/1/2024', 'federal', 'pncp'),
(NULL, 'Lei 14.133/2021', 'Art. 175', 'Prazos de publicação no PNCP: editais publicados com antecedência mínima de 8 a 35 dias úteis conforme modalidade', 'federal', 'pncp'),
(NULL, 'Decreto 10.764/2021', 'Art. 1º', 'Institui o PNCP como sistema oficial de publicidade dos atos de contratação pública federal', 'federal', 'pncp'),

-- ── SISTEMA DE REGISTRO DE PREÇOS (SRP / ARP) ────────────────
(NULL, 'Decreto 11.462/2023', 'Art. 1º', 'Regulamenta o Sistema de Registro de Preços (SRP) no âmbito federal — substitui Decreto 7.892/2013', 'federal', 'srp'),
(NULL, 'Decreto 11.462/2023', 'Art. 5º', 'ARP: validade máxima de 12 meses, prorrogável por igual período', 'federal', 'srp'),
(NULL, 'Decreto 11.462/2023', 'Art. 9º', 'Órgão gerenciador: responsável pelo procedimento licitatório e pela ARP', 'federal', 'srp'),
(NULL, 'Decreto 11.462/2023', 'Art. 14', 'Órgão participante: integra a ARP após o registro, sem necessidade de novo processo licitatório', 'federal', 'srp'),
(NULL, 'Decreto 11.462/2023', 'Art. 22', 'Cancelamento de itens da ARP: quando o preço registrado tornar-se superior ao praticado no mercado', 'federal', 'srp'),

-- ── CONTRATO ADMINISTRATIVO (Lei 14.133/2021) ────────────────
(NULL, 'Lei 14.133/2021', 'Art. 92', 'Cláusulas necessárias: objeto, preço, prazo, garantia, fiscalização, obrigações, penalidades, rescisão, legislação aplicável', 'federal', 'contrato'),
(NULL, 'Lei 14.133/2021', 'Art. 104', 'Garantia contratual: até 5% do valor, podendo chegar a 10% em obras complexas', 'federal', 'contrato'),
(NULL, 'Lei 14.133/2021', 'Art. 112', 'Alteração unilateral do contrato pelo poder público: até 25% acréscimo/redução para obras e serviços', 'federal', 'contrato'),
(NULL, 'Lei 14.133/2021', 'Art. 117', 'Fiscalização: gestor e fiscal do contrato — atribuições e responsabilidades', 'federal', 'contrato'),
(NULL, 'Lei 14.133/2021', 'Art. 131', 'Recebimento provisório e definitivo: prazos e responsabilidades', 'federal', 'contrato'),

-- ── TCU — JURISPRUDÊNCIA ──────────────────────────────────────
(NULL, 'TCU — Súmula 247', 'Item 1', 'É obrigatória a admissão da adjudicação por item, e não por preço global, nos editais das licitações para a contratação de obras, serviços, compras e alienações', 'federal', 'tcu'),
(NULL, 'TCU — Acórdão 2170/2018', 'Plenário', 'Pesquisa de preços deve utilizar preferencialmente o Painel de Preços do governo federal e contratos vigentes', 'federal', 'tcu'),
(NULL, 'TCU — Acórdão 1214/2013', 'Plenário', 'ETP obrigatório antes de abertura de licitação: ausência configura falha grave de planejamento', 'federal', 'tcu'),

-- ── PREFERÊNCIA TI NACIONAL ───────────────────────────────────
(NULL, 'Decreto 7.174/2010', 'Art. 3º', 'Preferência para bens e serviços de TI de origem nacional em licitações federais — margem de até 25%', 'federal', 'ti'),
(NULL, 'Lei 8.248/1991', 'Art. 3º', 'Política Nacional de Informática: preferência a produtos com tecnologia nacional desenvolvida no país', 'federal', 'ti'),

-- ── LEI DO PREGÃO ─────────────────────────────────────────────
(NULL, 'Lei 10.520/2002', 'Art. 1º', 'Institui a modalidade pregão para aquisição de bens e serviços comuns pela Administração Pública', 'federal', 'pregao'),
(NULL, 'Lei 10.520/2002', 'Art. 4º', 'Fases do pregão: abertura, análise de propostas, fase de lances, habilitação, adjudicação', 'federal', 'pregao')

ON CONFLICT DO NOTHING;
