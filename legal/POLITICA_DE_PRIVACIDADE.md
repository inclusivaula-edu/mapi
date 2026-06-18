# POLÍTICA DE PRIVACIDADE — MAPI

**Vigência a partir da data de aceite | Lei nº 13.709/2018 (LGPD)**

---

## 1. CONTROLADOR DOS DADOS

**MAPI Tecnologia Ltda**
CNPJ: [a preencher após abertura de empresa]
E-mail do Encarregado (DPO): privacidade@mapi.com.br

---

## 2. DADOS COLETADOS

| Categoria | Dados | Finalidade | Base Legal (LGPD) |
|-----------|-------|------------|-------------------|
| Cadastro | Nome, e-mail, organização | Criação e gestão de conta | Execução de contrato (Art. 7º, V) |
| Uso | Logs de requisição, endpoints acessados, timestamps | Billing, segurança, observabilidade | Legítimo interesse (Art. 7º, IX) |
| Conteúdo | Textos inseridos nos formulários (tema de aula, descrição contratual) | Processamento pela IA para geração do documento | Execução de contrato (Art. 7º, V) |
| Dados de alunos | Nome, diagnóstico, série, idade (inseridos pelo professor) | Personalização da aula/PEI | Execução de contrato + consentimento do responsável |
| Dados de partes contratuais | Nomes e qualificações inseridos em contratos | Geração do documento | Execução de contrato |
| Métricas de qualidade | Score de qualidade dos documentos gerados, latência | Melhoria do produto | Legítimo interesse |

---

## 3. DADOS QUE NÃO COLETAMOS

- Não coletamos senhas (autenticação gerenciada pelo Supabase Auth).
- Não coletamos dados de cartão de crédito (processamento via gateway externo — Mercado Pago/Stripe).
- Não utilizamos dados inseridos para treinar modelos de IA sem consentimento explícito.
- Não vendemos dados a terceiros.

---

## 4. DADOS SENSÍVEIS — ATENÇÃO ESPECIAL

Diagnósticos médicos de alunos (TEA, TDAH, Síndrome de Down, etc.) são **dados sensíveis** conforme o Art. 11 da LGPD.

Ao inserir esses dados na Plataforma, o Usuário declara:
- Ter autorização dos responsáveis legais do aluno (para menores).
- Ter base legal para o tratamento (execução de política pública de educação especial — Art. 11, II, b).
- Que os dados serão utilizados exclusivamente para fins pedagógicos.

O MAPI trata esses dados com camada adicional de segurança: isolamento por organização (RLS no banco de dados), criptografia em trânsito (HTTPS/TLS 1.3) e em repouso (Supabase AES-256).

---

## 5. COMPARTILHAMENTO DE DADOS

| Destinatário | Dados Compartilhados | Finalidade |
|---|---|---|
| OpenAI (EUA) | Conteúdo dos formulários (input) | Processamento pelo modelo de IA |
| Supabase (EUA) | Todos os dados armazenados | Banco de dados e autenticação |
| Mercado Pago / Stripe | Dados de pagamento | Processamento de assinaturas |

**Transferência internacional**: OpenAI e Supabase estão nos EUA. A transferência é realizada com base no Art. 33, II da LGPD (país com nível de proteção adequado ou garantias contratuais equivalentes — SCCs da UE adotadas como referência).

O MAPI não compartilha dados com outras entidades sem consentimento explícito, exceto por obrigação legal.

---

## 6. RETENÇÃO DE DADOS

| Dado | Período de Retenção |
|---|---|
| Conta e organização | Até cancelamento + 5 anos (obrigação legal) |
| Documentos gerados (aulas, contratos) | Até exclusão pelo Usuário ou cancelamento da conta |
| Logs de uso | 12 meses |
| Dados de alunos | Até exclusão pelo Usuário ou cancelamento |
| Backups | 30 dias após exclusão |

---

## 7. SEUS DIREITOS (Art. 18 LGPD)

Como titular de dados, você tem direito a:

- **Acesso**: saber quais dados temos sobre você.
- **Correção**: corrigir dados incompletos ou desatualizados.
- **Eliminação**: solicitar exclusão dos dados tratados com base em consentimento.
- **Portabilidade**: receber seus dados em formato estruturado (JSON/CSV).
- **Revogação de consentimento**: a qualquer momento, sem ônus.
- **Informação sobre compartilhamento**: saber com quem seus dados são compartilhados.
- **Oposição**: opor-se a tratamentos realizados com base em legítimo interesse.

**Como exercer:** envie e-mail para privacidade@mapi.com.br com assunto "Direitos LGPD — [seu nome]". Responderemos em até 15 dias.

---

## 8. SEGURANÇA

Medidas técnicas adotadas:
- **Transporte**: HTTPS/TLS 1.3 obrigatório em todas as conexões.
- **Armazenamento**: AES-256 no banco de dados (Supabase).
- **Isolamento**: Row Level Security (RLS) — cada organização acessa apenas seus próprios dados.
- **Autenticação**: JWT com expiração, sem armazenamento de senhas em texto claro.
- **Logs**: registros de acesso mantidos por 12 meses para auditoria.

Em caso de incidente de segurança que afete dados pessoais, notificaremos a ANPD e os titulares afetados no prazo legal (Art. 48 LGPD).

---

## 9. COOKIES

O frontend utiliza **localStorage** apenas para armazenar o token de sessão JWT. Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.

---

## 10. MENORES DE IDADE

O MAPI não coleta dados diretamente de menores de 18 anos. Dados de alunos menores são inseridos por profissionais adultos (professores, coordenadores) no exercício de suas funções. O tratamento tem base legal na execução de política pública educacional e requer autorização dos responsáveis conforme o Art. 14 da LGPD.

---

## 11. ALTERAÇÕES NESTA POLÍTICA

Notificaremos os usuários por e-mail com 30 dias de antecedência sobre alterações materiais nesta Política. O uso continuado da Plataforma após a vigência das alterações implica aceitação.

---

## 12. ENCARREGADO DE DADOS (DPO)

Nome: [a designar]
E-mail: privacidade@mapi.com.br
Disponível para: titulares de dados, ANPD e autoridades competentes.

---

*Última atualização: Junho de 2026*
