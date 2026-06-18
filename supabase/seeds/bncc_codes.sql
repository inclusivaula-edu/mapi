-- ============================================================
-- SEED: bncc_codes
-- Objetivos de aprendizagem da BNCC — séries do EF I e EF II
-- Fonte: Base Nacional Comum Curricular (MEC, 2018)
-- Rodar no Supabase SQL Editor após a migration principal
-- ============================================================

CREATE TABLE IF NOT EXISTS bncc_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  grade       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  objective   TEXT NOT NULL,
  competency  TEXT,
  area        TEXT
);

INSERT INTO bncc_codes (code, grade, subject, objective, competency, area) VALUES

-- ── MATEMÁTICA EF I ─────────────────────────────────────────
('EF01MA01','1º ano EF','Matemática','Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas','Números','Matemática'),
('EF01MA03','1º ano EF','Matemática','Estimar e comparar quantidades de objetos de dois conjuntos (em torno de 20 elementos)','Números','Matemática'),
('EF02MA01','2º ano EF','Matemática','Comparar e ordenar números naturais (até a ordem de centenas) pela compreensão de características do sistema de numeração decimal','Números','Matemática'),
('EF02MA05','2º ano EF','Matemática','Construir fatos básicos da adição e subtração e utilizá-los no cálculo mental e escrito','Operações','Matemática'),
('EF03MA01','3º ano EF','Matemática','Ler, escrever e comparar números naturais de até a ordem de unidade de milhar','Números','Matemática'),
('EF03MA07','3º ano EF','Matemática','Identificar e registrar, em linguagem matemática, a ideia de fração como parte de inteiros','Frações','Matemática'),
('EF03MA12','3º ano EF','Matemática','Reconhecer o sistema monetário brasileiro e identificar equivalência de valores de cédulas e moedas','Grandezas e medidas','Matemática'),
('EF04MA01','4º ano EF','Matemática','Ler, escrever e ordenar números naturais até a ordem das dezenas de milhar','Números','Matemática'),
('EF04MA10','4º ano EF','Matemática','Identificar e estender padrões numéricos e geométricos, incluindo padrões de sequências','Álgebra','Matemática'),
('EF05MA02','5º ano EF','Matemática','Representar e comparar frações com denominadores diferentes, usando a ideia de equivalência de frações','Frações','Matemática'),
('EF05MA14','5º ano EF','Matemática','Reconhecer, nomear e comparar polígonos, considerando lados e vértices, e desenhá-los','Geometria','Matemática'),
('EF06MA01','6º ano EF','Matemática','Comparar, ordenar, ler e escrever números naturais e números racionais em diferentes contextos','Números','Matemática'),
('EF07MA12','7º ano EF','Matemática','Reconhecer e construir figuras obtidas por combinações de transformações geométricas','Geometria','Matemática'),
('EF08MA01','8º ano EF','Matemática','Representar os números reais na reta numérica e no plano cartesiano','Números','Matemática'),
('EF09MA06','9º ano EF','Matemática','Compreender as relações entre os conceitos e procedimentos dos diferentes campos da Matemática','Números','Matemática'),

-- ── LÍNGUA PORTUGUESA EF I ──────────────────────────────────
('EF01LP01','1º ano EF','Língua Portuguesa','Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo','Leitura','Linguagens'),
('EF01LP03','1º ano EF','Língua Portuguesa','Identificar e nomear as letras do alfabeto em sequência e fora dela','Escrita','Linguagens'),
('EF02LP01','2º ano EF','Língua Portuguesa','Ler palavras com correspondências regulares diretas entre letras e fonemas','Leitura','Linguagens'),
('EF02LP07','2º ano EF','Língua Portuguesa','Identificar a finalidade de textos de diferentes gêneros, especialmente de literatura infantil','Leitura','Linguagens'),
('EF03LP01','3º ano EF','Língua Portuguesa','Ler e compreender, silenciosamente e, em seguida, em voz alta, com autonomia e fluência','Leitura','Linguagens'),
('EF04LP01','4º ano EF','Língua Portuguesa','Identificar a função social de textos que circulam em campos da vida social diversos','Leitura','Linguagens'),
('EF05LP01','5º ano EF','Língua Portuguesa','Relacionar o texto com experiências e conhecimentos prévios','Leitura','Linguagens'),
('EF06LP01','6º ano EF','Língua Portuguesa','Identificar e analisar o uso expressivo da linguagem em textos literários','Educação literária','Linguagens'),
('EF07LP01','7º ano EF','Língua Portuguesa','Identificar, em textos de diferentes gêneros, marcas linguísticas que evidenciam o locutor e o interlocutor','Análise linguística','Linguagens'),
('EF08LP01','8º ano EF','Língua Portuguesa','Identificar e analisar efeitos de sentido que decorrem do uso de recursos linguísticos e multissemióticos','Análise linguística','Linguagens'),
('EF09LP01','9º ano EF','Língua Portuguesa','Relacionar o texto literário com seu contexto de produção e com a tradição literária','Educação literária','Linguagens'),

-- ── CIÊNCIAS EF I ───────────────────────────────────────────
('EF01CI01','1º ano EF','Ciências','Comparar características de diferentes materiais presentes em objetos de uso cotidiano','Matéria e energia','Ciências da Natureza'),
('EF02CI01','2º ano EF','Ciências','Identificar de onde vêm os alimentos consumidos pela família','Vida e evolução','Ciências da Natureza'),
('EF03CI02','3º ano EF','Ciências','Identificar características sobre o modo de vida dos animais (alimentação, locomoção, habitat)','Vida e evolução','Ciências da Natureza'),
('EF04CI01','4º ano EF','Ciências','Identificar misturas na vida diária, com base em suas propriedades físicas','Matéria e energia','Ciências da Natureza'),
('EF05CI08','5º ano EF','Ciências','Construir propostas coletivas para um consumo mais consciente e criar soluções para diminuição do consumo de energia elétrica','Terra e Universo','Ciências da Natureza'),

-- ── HISTÓRIA EF II ──────────────────────────────────────────
('EF06HI01','6º ano EF','História','Identificar diferentes formas de compreensão da noção de tempo e de periodização dos processos históricos','Espaços, tempos, sujeitos e linguagens','Ciências Humanas'),
('EF07HI01','7º ano EF','História','Explicar o significado de "modernidade" e suas lógicas de inclusão e exclusão','Mundo moderno','Ciências Humanas'),
('EF08HI06','8º ano EF','História','Identificar e contextualizar o protagonismo dos povos africanos na diáspora africana','Século XIX','Ciências Humanas'),
('EF09HI01','9º ano EF','História','Descrever e contextualizar os principais aspectos sociais, culturais, econômicos e políticos da história do Brasil','Modernidade contemporânea','Ciências Humanas'),

-- ── GEOGRAFIA EF II ─────────────────────────────────────────
('EF06GE01','6º ano EF','Geografia','Comparar modificações das paisagens nos lugares de vivência e os usos desses lugares em diferentes tempos','Sujeito e seu lugar no mundo','Ciências Humanas'),
('EF07GE08','7º ano EF','Geografia','Organizar informações e dados coletados sobre as transformações do espaço natural e humanizado','Natureza, ambientes e qualidade de vida','Ciências Humanas'),
('EF08GE04','8º ano EF','Geografia','Relacionar conflitos e outras situações causadoras de diferentes processos migratórios no mundo contemporâneo','Mundo do trabalho','Ciências Humanas'),
('EF09GE03','9º ano EF','Geografia','Identificar e comparar diferentes domínios morfoclimáticos do Brasil','Formas, processos e gestão do território','Ciências Humanas')

ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE bncc_codes IS 'Base BNCC curada — objetivos de aprendizagem EF I e II (MEC 2018)';
