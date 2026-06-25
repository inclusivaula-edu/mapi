-- Seeds: Legislação LGPD (Lei 13.709/2018 + Resoluções ANPD)

INSERT INTO lgpd_references (organization_id, lei, artigo, ementa, tipo) VALUES
(NULL, 'Lei 13.709/2018', 'Art. 5º', 'Definições: dado pessoal, dado sensível, titular, controlador, operador, encarregado (DPO), ANPD', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 6º', 'Princípios: finalidade, adequação, necessidade, livre acesso, qualidade, transparência, segurança, prevenção, não discriminação, responsabilização', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 7º', 'Bases legais para tratamento: consentimento, obrigação legal, administração pública, pesquisa, contrato, exercício de direitos, proteção da vida, tutela da saúde, interesse legítimo, proteção do crédito', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 8º', 'Consentimento: livre, informado, inequívoco, para finalidades determinadas, revogável', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 11', 'Tratamento de dados sensíveis: consentimento específico ou sem consentimento quando indispensável', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 14', 'Tratamento de dados de crianças e adolescentes: consentimento específico de responsável legal', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 15', 'Término do tratamento: finalidade alcançada, período encerrado, revogação, determinação da ANPD', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 18', 'Direitos do titular: confirmação, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamento, revogação, oposição', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 33', 'Transferência internacional: nível adequado, garantias, consentimento, cooperação jurídica, saúde pública', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 37', 'Registro de operações de tratamento (ROPA): controlador e operador devem manter registro', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 38', 'Relatório de Impacto à Proteção de Dados (RIPD): ANPD pode determinar elaboração', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 41', 'Encarregado (DPO): nomeação, identidade pública, canal de comunicação com titulares e ANPD', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 46', 'Medidas de segurança: técnicas e administrativas para proteção contra acessos não autorizados', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 48', 'Comunicação de incidentes: prazo razoável à ANPD e ao titular quando risco ou dano relevante', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 50', 'Boas práticas e governança: programas de compliance, políticas internas, auditorias', 'federal'),
(NULL, 'Lei 13.709/2018', 'Art. 52', 'Sanções: advertência, multa (até 2% do faturamento, limitada a R$ 50M por infração), publicização, bloqueio, eliminação, suspensão', 'federal'),
(NULL, 'Resolução CD/ANPD nº 2/2022', 'Art. 1º', 'Regulamenta aplicação da LGPD para agentes de tratamento de pequeno porte: dispensa de DPO, prazos em dobro, ROPA simplificado', 'anpd'),
(NULL, 'Resolução CD/ANPD nº 4/2023', 'Art. 1º', 'Regulamenta dosimetria e aplicação de sanções administrativas pela ANPD', 'anpd')
ON CONFLICT DO NOTHING;
