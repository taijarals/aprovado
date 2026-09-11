# Estratégia de Persistência

## Banco de Dados Principal
A aplicação utiliza o **Supabase (PostgreSQL)** como solução de persistência primária em nuvem, operando inteiramente dentro do schema customizado `aprovado`.

> **⚠️ Configuração Obrigatória no Supabase:**
> Para que o PostgREST permita consultas e inserções no schema `aprovado`, certifique-se de que ele está adicionado em **Settings > API > Exposed schemas** no seu painel do Supabase.

### Volume de Dados Carregado (SEFAZ-BA)
- **Editais (`exams`):** 1 registro ("SEFAZ-BA", 2022).
- **Tópicos Globais (`topics`)**: Base de tópicos cadastrada.
- **Relações Tópico-Edital (`topic_exams`)**: Métricas de recorrência, tendência, peso e prioridade calculada por edital.
- **Cronograma (`weeks`, `goals`, `materials`)**: 16 semanas estruturadas, com centenas de metas e materiais oficiais acompanhados de seus respectivos `study_tip`.

### Tabelas do Domínio
- **Conteúdo e Relacionamentos:** `exams`, `topics`, `topic_exams` (relação muitos-para-muitos), `weeks`, `goals`, `materials`, `questions`.
- **Dados Isolados do Usuário:** `user_progress` (comportando rastreamento segmentado por edital `exam_id`), `goal_completions`, `question_attempts`.
- **Sistema:** `auth.users` (Schema `auth`).

## Políticas de Segurança (RLS - Row Level Security)
1. **Tabelas de Conteúdo (`exams`, `topics`, `topic_exams`, `weeks`, `goals`, `materials`, `questions`):**
   - Acesso público de leitura para qualquer usuário autenticado (`SELECT TO authenticated USING (true)`).
2. **Tabelas de Progresso (`user_progress`, `goal_completions`, `question_attempts`):**
   - Isolamento estrito por usuário dono via `auth.uid() = user_id`.
