# Modelo de Dados

Este documento descreve a estrutura das entidades e suas relações no banco de dados. O projeto utiliza o schema `aprovado` para abrigar todas as regras de negócio de maneira isolada.

## Relacionamentos Principais
As entidades dividem-se em dois grandes grupos:
1. **Dados de Conteúdo (Leitura Pública):** Estruturas dos editais, cronogramas, tópicos, metas e banco de questões.
2. **Dados de Progresso (Privados por Usuário):** Tabelas que monitoram o status de aprendizado e conclusão de cada usuário autenticado.

---

## 1. Dados de Conteúdo

### `exams` (Concursos)
Representa os editais ou concursos suportados pelo sistema.
- **Campos:** `id`, `name` (ex: SEFAZ-BA), `state` (BA, AL), `edition_year`, `status` (ativo/arquivado).

### `topics` (Tópicos do Edital)
Assuntos cobrados em um exame, com dados estatísticos de incidência.
- **Relações:** Pertence a um `exam_id`.
- **Campos:** `id`, `discipline`, `subject`, `topic_name`, `recurrence`, `trend`, `weight`, `priority` (calculada), `summary`, `exam_tips`, `source`.

### `weeks` (Semanas de Estudo)
Organizadores lógicos de cronograma estruturado em semanas.
- **Relações:** Pertence a um `exam_id`.
- **Campos:** `id`, `week_number`, `title`, `order_index`.

### `goals` (Metas)
Metas semanais para o estudante cumprir (teoria ou revisão).
- **Relações:** Pertence a um `week_id`. Opcionalmente lincada a um `topic_id`.
- **Campos:** `id`, `type` (teoria/revisao), `title`, `order_index`.

### `materials` (Materiais)
Recursos vinculados a uma meta (videoaula, PDF, questões).
- **Relações:** Pertence a um `goal_id`.
- **Campos:** `id`, `type`, `title`, `url`, `study_tip`, `ai_summary`.

### `questions` (Banco de Questões)
Banco de questões simuladas geradas via IA ou adaptadas, nunca importadas nativamente de bancas (questão de direitos autorais).
- **Relações:** Pertence a um `topic_id` e a um `exam_id`.
- **Campos:** `id`, `discipline`, `statement`, `question_type` (certo_errado/multipla_escolha), `options` (jsonb), `correct_answer`, `explanation`, `source` (ia_nova/ia_estilo_banca), `banca_style` (ex: FGV, CESPE), `difficulty`.

---

## 2. Dados de Progresso (Contexto do Usuário)

### `auth.users` (Tabela do Sistema)
Gerenciada pelo Supabase Auth.
- **Campos Relevantes:** `id` (usado como `user_id` nas FKs).

### `user_progress` (Progresso por Tópico)
Monitora o domínio do usuário sobre cada tópico do edital.
- **Relações:** Pertence a um `user_id` e a um `topic_id` (Chave única composta).
- **Campos:** `id`, `status` (nao_estudado, estudando, estudado, revisado), `questions_done`, `correct_count`, `mastery_score`, `next_review_at` (espaçamento).

### `goal_completions` (Conclusões de Materiais)
Registro de "check" em um material/meta.
- **Relações:** Pertence a um `user_id` e a um `material_id` (Chave única composta).
- **Campos:** `id`, `completed_at`.

### `question_attempts` (Tentativas de Resposta)
Histórico de quais alternativas o usuário escolheu ao responder as questões.
- **Relações:** Pertence a um `user_id` e a um `question_id`.
- **Campos:** `id`, `selected_answer`, `is_correct`, `attempted_at`.
