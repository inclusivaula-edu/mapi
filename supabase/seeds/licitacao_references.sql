-- Seeds: Legislação de Licitações (Lei 14.133/2021 + Lei 8.666/1993)
-- organization_id NULL = disponível para todas as organizações

INSERT INTO bid_references (organization_id, lei, artigo, ementa, tipo, area) VALUES
-- Nova Lei de Licitações (14.133/2021)
(NULL, 'Lei 14.133/2021', 'Art. 6º', 'Definições: obra, serviço, compra, alienação, contratação, licitação, pregão, concorrência', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 11', 'Objetivos do processo licitatório: isonomia, vantajosidade, eficiência', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 17', 'Publicidade do edital e prazos mínimos para apresentação de propostas', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 25', 'Critérios de julgamento: menor preço, melhor técnica, técnica e preço, maior lance, maior retorno econômico', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 28', 'Modalidades: pregão, concorrência, concurso, leilão, diálogo competitivo', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 33', 'Exigências de habilitação: jurídica, técnica, fiscal, econômico-financeira', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 59', 'Qualificação técnica: atestados de capacidade técnica, certificações', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 63', 'Regularidade fiscal e trabalhista como condição de habilitação', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 72', 'Proposta: especificação, quantitativo, preço unitário e global', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 89', 'Contratação direta: dispensa e inexigibilidade de licitação', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 92', 'Formalização do contrato: cláusulas obrigatórias', 'federal', 'licitacoes'),
(NULL, 'Lei 14.133/2021', 'Art. 155', 'Sanções administrativas: advertência, multa, impedimento, declaração de inidoneidade', 'federal', 'licitacoes'),
-- Lei 8.666/1993 (transição)
(NULL, 'Lei 8.666/1993', 'Art. 3º', 'Princípios: legalidade, impessoalidade, moralidade, igualdade, publicidade', 'federal', 'licitacoes'),
(NULL, 'Lei 8.666/1993', 'Art. 22', 'Modalidades antigas: concorrência, tomada de preços, convite, concurso, leilão', 'federal', 'licitacoes'),
(NULL, 'Lei 8.666/1993', 'Art. 27', 'Documentação exigida: habilitação jurídica, qualificação técnica e econômico-financeira', 'federal', 'licitacoes'),
-- Declarações obrigatórias
(NULL, 'CF/1988', 'Art. 7º, XXXIII', 'Proibição de trabalho noturno, perigoso ou insalubre a menores de 18 e de qualquer trabalho a menores de 16 anos', 'federal', 'licitacoes'),
(NULL, 'LC 123/2006', 'Art. 3º', 'Definição de microempresa e empresa de pequeno porte para tratamento diferenciado em licitações', 'federal', 'licitacoes')
ON CONFLICT DO NOTHING;
