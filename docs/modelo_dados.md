# Modelo de Dados

Este documento descreve a estrutura das entidades e suas relações no banco de dados. O projeto utiliza o schema `aprovado` para abrigar todas as regras de negócio de maneira isolada.

## Relacionamentos Principais
As entidades dividem-se em dois grandes grupos:
1. **Dados de Conteúdo (Leitura Pública):** Estruturas dos editais, cronogramas, tópicos, tabela de relação muitos-para-muitos `topic_exams`, metas e banco de questões.
2. **Dados de Progresso (Privados por Usuário):** Tabelas que monitoram o status de aprendizado, histórico de tentativas e conclusão de cada usuário autenticado, segregadas por edital (`exam_id`).

---

## 1. Dados de Conteúdo

### `exams` (Concursos)
Representa os editais ou concursos suportados pelo sistema (ex: SEFAZ-BA 2022 e SEFAZ-AL 2026).
- **Campos:** `id`, `name` (ex: SEFAZ-BA, SEFAZ-AL), `state` (BA, AL), `edition_year`, `status` (ativo/arquivado).

### `topics` (Tópicos do Edital - Globais)
Assuntos genéricos reaproveitáveis entre diferentes editais.
- **Campos:** `id`, `discipline`, `subject`, `topic_name`, `summary`, `exam_tips`, `source`, `created_at`.

### `topic_exams` (Relação Tópicos <-> Concursos)
Tabela associativa muitos-para-muitos que armazena as métricas contextuais de um tópico em um edital específico.
- **Relações:** Pertence a um `topic_id` e a um `exam_id` (Constraint UNIQUE na tupla).
- **Campos:** `id`, `topic_id`, `exam_id`, `recurrence`, `trend`, `weight`, `priority`, `items_count`, `is_discursive`.

### `weeks` (Semanas de Estudo)
Organizadores lógicos de cronograma estruturado em semanas.
- **Relações:** Pertence a um `exam_id`.
- **Campos:** `id`, `week_number`, `title`, `order_index`.

### `goals` (Metas)
Metas semanais para o estudante cumprir (teoria ou revisão).
- **Relações:** Pertence a um `week_id`. Opcionalmente lincada a um `topic_id`.
- **Campos:** `id`, `week_id`, `topic_id`, `type` (teoria/revisao), `title`, `order_index`.

### `materials` (Materiais)
Recursos vinculados a uma meta (videoaula, PDF, questões).
- **Relações:** Pertence a um `goal_id`.
- **Campos:** `id`, `goal_id`, `type`, `title`, `url`, `study_tip`, `ai_summary`.

### `questions` (Banco de Questões)
Banco de questões simuladas geradas via IA ou adaptadas no estilo de bancas.
- **Relações:** Pertence a um `topic_id` e a um `exam_id`.
- **Campos:** `id`, `topic_id`, `exam_id`, `discipline`, `statement`, `question_type`, `options`, `correct_answer`, `explanation`, `source`, `banca_style`, `difficulty`.

---

## 2. Dados de Progresso (Contexto do Usuário)

### `user_progress` (Progresso por Tópico e Concurso)
Monitora o domínio do usuário sobre cada tópico, permitindo acompanhamento separado por edital.
- **Relações:** Pertence a um `user_id`, `topic_id` e `exam_id` (Constraint UNIQUE composta).
- **Campos:** `id`, `user_id`, `topic_id`, `exam_id`, `status` (nao_estudado, estudando, estudado, revisado), `questions_done`, `correct_count`, `mastery_score`, `next_review_at`, `updated_at`.

### `goal_completions` (Conclusões de Materiais)
Registro de "check" em um material/meta.
- **Relações:** Pertence a um `user_id` e a um `material_id`.
- **Campos:** `id`, `user_id`, `material_id`, `completed_at`.

### `question_attempts` (Tentativas de Resposta)
Histórico de quais alternativas o usuário escolheu ao responder as questões.
- **Relações:** Pertence a um `user_id` e a um `question_id`.
- **Campos:** `id`, `user_id`, `question_id`, `selected_answer`, `is_correct`, `attempted_at`.
