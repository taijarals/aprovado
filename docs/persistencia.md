# Estratégia de Persistência

## Banco de Dados Principal
A aplicação utiliza o **Supabase (PostgreSQL)** como solução de persistência primária em nuvem, operando inteiramente dentro do schema customizado `aprovado`.

> **⚠️ Configuração Obrigatória no Supabase:**
> Para que o PostgREST permita consultas e inserções no schema `aprovado`, certifique-se de que ele está adicionado em **Settings > API > Exposed schemas** no seu painel do Supabase.

### Volume de Dados Carregado (SEFAZ-BA e SEFAZ-AL)
- **Editais (`exams`):** 2 registros ("SEFAZ-BA", 2022 e "SEFAZ-AL", 2026).
- **Tópicos Globais (`topics`)**: Base unificada de tópicos (incluindo 225 compartilhados BA+AL e 166 exclusivos de AL).
- **Relações Tópico-Edital (`topic_exams`)**: Métricas de recorrência, tendência (`crescente`, `estável`, `decrescente` ou `novo`), peso, prioridade, número de itens (`items_count`) e discursiva (`is_discursive`) por edital.
- **Cronograma (`weeks`, `goals`, `materials`)**: Estruturado para SEFAZ-BA (16 semanas) e pronto para expansão em SEFAZ-AL.

### Tabelas do Domínio
- **Conteúdo e Relacionamentos:** `exams`, `topics`, `topic_exams` (relação muitos-para-muitos), `weeks`, `goals`, `materials`, `questions`.
- **Dados Isolados do Usuário:** `user_progress` (comportando rastreamento segmentado por edital `exam_id`), `goal_completions`, `question_attempts`.
- **Sistema:** `auth.users` (Schema `auth`).

## Políticas de Segurança (RLS - Row Level Security)
1. **Tabelas de Conteúdo (`exams`, `topics`, `topic_exams`, `weeks`, `goals`, `materials`, `questions`):**
   - Acesso público de leitura para qualquer usuário autenticado (`SELECT TO authenticated USING (true)`).
2. **Tabelas de Progresso (`user_progress`, `goal_completions`, `question_attempts`):**
   - Isolamento estrito por usuário dono via `auth.uid() = user_id`.
