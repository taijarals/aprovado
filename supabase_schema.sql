-- Execute este script no SQL Editor do seu projeto no Supabase

-- 1. Garante que o schema existe
CREATE SCHEMA IF NOT EXISTS aprovado;

-- 2. Tabela de Concursos (Exams)
CREATE TABLE aprovado.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  edition_year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'arquivado'))
);

-- 3. Tabela de Tópicos do Edital
CREATE TABLE aprovado.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES aprovado.exams(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  recurrence INTEGER DEFAULT 0,
  trend TEXT CHECK (trend IN ('crescente', 'estável', 'decrescente')),
  weight NUMERIC,
  priority NUMERIC,
  summary TEXT,
  exam_tips TEXT,
  source TEXT
);

-- 4. Tabela de Semanas do Cronograma
CREATE TABLE aprovado.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES aprovado.exams(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- 5. Tabela de Metas (Goals)
CREATE TABLE aprovado.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES aprovado.weeks(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES aprovado.topics(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('teoria', 'revisao')),
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- 6. Tabela de Materiais
CREATE TABLE aprovado.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES aprovado.goals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('videoaula', 'pdf', 'questoes', 'tarefa')),
  title TEXT NOT NULL,
  url TEXT,
  study_tip TEXT,
  ai_summary TEXT
);

-- 7. Tabela de Questões
CREATE TABLE aprovado.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES aprovado.topics(id) ON DELETE SET NULL,
  exam_id UUID NOT NULL REFERENCES aprovado.exams(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  statement TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('certo_errado', 'multipla_escolha')),
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  source TEXT NOT NULL CHECK (source IN ('ia_nova', 'ia_estilo_banca')),
  banca_style TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Progresso do Usuário (User Progress)
CREATE TABLE aprovado.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES aprovado.topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('nao_estudado', 'estudando', 'estudado', 'revisado')) DEFAULT 'nao_estudado',
  questions_done INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  mastery_score NUMERIC DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- 9. Tabela de Conclusão de Metas/Materiais (Goal Completions)
CREATE TABLE aprovado.goal_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES aprovado.materials(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, material_id)
);

-- 10. Tabela de Tentativas de Questões (Question Attempts)
CREATE TABLE aprovado.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES aprovado.questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE aprovado.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovado.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovado.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovado.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovado.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovado.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovado.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovado.goal_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovado.question_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Tabelas de Conteúdo (Leitura Pública para Autenticados)
CREATE POLICY "Leitura permitida para usuários autenticados" ON aprovado.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura permitida para usuários autenticados" ON aprovado.topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura permitida para usuários autenticados" ON aprovado.weeks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura permitida para usuários autenticados" ON aprovado.goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura permitida para usuários autenticados" ON aprovado.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura permitida para usuários autenticados" ON aprovado.questions FOR SELECT TO authenticated USING (true);

-- Políticas de RLS para Tabelas de Progresso (Isolamento total por usuário)
CREATE POLICY "Usuário gerencia próprio progresso" ON aprovado.user_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário gerencia próprias conclusões" ON aprovado.goal_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário gerencia próprias tentativas" ON aprovado.question_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
