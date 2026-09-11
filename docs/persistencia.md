# Estratégia de Persistência

## Banco de Dados Principal
A aplicação utiliza o **Supabase (PostgreSQL)** como solução de persistência primária em nuvem, operando inteiramente dentro do schema customizado `aprovado`.

### Tabelas do Domínio
- **Conteúdo e Relacionamentos:** `exams`, `topics`, `topic_exams` (relação muitos-para-muitos), `weeks`, `goals`, `materials`, `questions`.
- **Dados Isolados do Usuário:** `user_progress` (comportando rastreamento segmentado por edital `exam_id`), `goal_completions`, `question_attempts`.
- **Sistema:** `auth.users` (Schema `auth`).

## Políticas de Segurança (RLS - Row Level Security)
1. **Tabelas de Conteúdo (`exams`, `topics`, `topic_exams`, `weeks`, `goals`, `materials`, `questions`):**
   - Acesso público de leitura para qualquer usuário autenticado (`SELECT TO authenticated USING (true)`).
2. **Tabelas de Progresso (`user_progress`, `goal_completions`, `question_attempts`):**
   - Isolamento estrito por usuário dono via `auth.uid() = user_id`.
