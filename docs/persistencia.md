# Estratégia de Persistência

## Banco de Dados Principal
A aplicação utiliza o **Supabase (PostgreSQL)** como solução de persistência primária em nuvem, operando inteiramente dentro do schema customizado `aprovado`.

> **⚠️ Configuração Obrigatória no Supabase:**
> Para que o PostgREST permita consultas e inserções no schema `aprovado`, certifique-se de que ele está adicionado em **Settings > API > Exposed schemas** no seu painel do Supabase.

### Volume de Dados Carregado (SEFAZ-BA e SEFAZ-AL)
- **Editais (`exams`):** 2 registros ("SEFAZ-BA", 2022 e "SEFAZ-AL", 2026).
- **Tópicos Globais (`topics`):** 375 tópicos mapeados e persistidos no banco de dados para o edital SEFAZ-BA.
- **Relações Tópico-Edital (`topic_exams`):** 268 relações cadastradas para a SEFAZ-BA com métricas de tendência, recorrência, peso e prioridade calculada.
- **Cronograma (`weeks`, `goals`, `materials`):** 16 semanas, 156 metas e 543 materiais de estudo cadastrados com links reais do Gran Cursos e dicas de estudo.

### Tabelas do Domínio
- **Conteúdo e Relacionamentos:** `exams`, `topics`, `topic_exams` (relação muitos-para-muitos), `weeks`, `goals`, `materials`, `questions`.
- **Dados Isolados do Usuário:** `user_progress` (comportando rastreamento segmentado por edital `exam_id`), `goal_completions`, `question_attempts`.
- **Sistema:** `auth.users` (Schema `auth`).

## Políticas de Segurança (RLS - Row Level Security)
1. **Tabelas de Conteúdo (`exams`, `topics`, `topic_exams`, `weeks`, `goals`, `materials`, `questions`):**
   - Acesso público de leitura para qualquer usuário autenticado (`SELECT TO authenticated USING (true)`).
2. **Tabelas de Progresso (`user_progress`, `goal_completions`, `question_attempts`):**
   - Isolamento estrito por usuário dono via `auth.uid() = user_id`.
