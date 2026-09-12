# Estratégia de Persistência

## Banco de Dados Principal
A aplicação utiliza o **Supabase (PostgreSQL)** como solução de persistência primária em nuvem, operando inteiramente dentro do schema customizado `aprovado`.

> **⚠️ Configuração Obrigatória no Supabase:**
> Para que o PostgREST permita consultas e inserções no schema `aprovado`, certifique-se de que ele está adicionado em **Settings > API > Exposed schemas** no seu painel do Supabase.

### Volume de Dados Carregado (SEFAZ-BA e SEFAZ-AL)
- **Editais (`exams`):** 2 registros ("SEFAZ-BA", 2022, Banca FCC/Outras e "SEFAZ-AL", 2026, Auditor Fiscal da Receita Estadual, Banca CESPE / CEBRASPE).
- **Tópicos Globais (`topics`):** 434 tópicos reais e específicos cadastrados na base (sendo 225 compartilhados entre BA e AL e 166 exclusivos do SEFAZ-AL).
- **Relações Tópico-Edital (`topic_exams`):** 
  - SEFAZ-BA: 268 relações cadastradas.
  - SEFAZ-AL: 391 relações cadastradas (225 compartilhados + 166 exclusivos).
- **Cronograma (`weeks`, `goals`, `materials`):** 16 semanas, 156 metas e 543 materiais de estudo cadastrados com links reais do Gran Cursos e dicas de estudo detalhadas.

### Tabelas do Domínio
- **Conteúdo e Relacionamentos:** `exams`, `topics`, `topic_exams` (relação muitos-para-muitos), `weeks`, `goals`, `materials`, `questions`.
- **Dados Isolados do Usuário:** `user_progress` (comportando rastreamento segmentado por edital `exam_id`), `goal_completions`, `question_attempts`.
- **Sistema:** `auth.users` (Schema `auth`).

## Políticas de Segurança (RLS - Row Level Security)
1. **Tabelas de Conteúdo (`exams`, `topics`, `topic_exams`, `weeks`, `goals`, `materials`, `questions`):**
   - Acesso público de leitura para qualquer usuário autenticado (`SELECT TO authenticated USING (true)`).
2. **Tabelas de Progresso (`user_progress`, `goal_completions`, `question_attempts`):**
   - Isolamento estrito por usuário dono via `auth.uid() = user_id`.
