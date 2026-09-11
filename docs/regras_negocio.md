# Regras de Negócio

Este documento centraliza as regras de negócio lógicas e fluxos de usuário da aplicação.

## 1. Fluxo de Autenticação e Autorização

- **Obrigatoriedade de Login:** A aplicação é estritamente privada. O usuário não pode acessar nenhuma funcionalidade de conteúdo (Dashboard, Edital, Questões) sem uma sessão ativa.
- **Redirecionamento de Não-Autenticados:** Qualquer tentativa de acesso direto via URL a uma rota protegida por um usuário sem sessão redireciona imediatamente para a tela `/login`.
- **Redirecionamento de Autenticados:** Se um usuário logado acessar a tela de `/login`, ele deve ser automaticamente redirecionado para a rota raiz protegida (`/`).
- **Estado de Carregamento (Loading):** Durante a checagem inicial da sessão com o Supabase (ao recarregar a página), o aplicativo deve bloquear o acesso aos componentes e exibir um spinner visual para evitar *flickering*.
- **Logout:** O usuário pode encerrar a sessão a qualquer momento através do menu. Após a revogação do token no backend do Supabase, o redirecionamento para a tela de login ocorre automaticamente através da reatividade do `AuthContext`.

## 2. Estruturação do Edital e Cronograma

### Priorização de Tópicos
A ordem e relevância com que um tópico de edital é sugerido ao aluno depende do cálculo matemático de **Prioridade**.

**Fórmula:**
`Prioridade = (Recorrência + 1) * Peso * Fator de Tendência`

**Racional das variáveis:**
- **Recorrência:** Número bruto de vezes que o assunto caiu em provas anteriores daquela banca para a área fiscal. Adicionamos `+1` na fórmula para garantir que um tópico inédito não seja anulado.
- **Peso:** Pontuação/peso intrínseco da disciplina naquele edital específico.
- **Fator de Tendência:** Métrica comportamental recente:
  - *Crescente*: Multiplicador `1.2`.
  - *Estável*: Multiplicador `1.0`.
  - *Decrescente*: Multiplicador `0.8`.

## 3. Comportamento das Telas Principais

### Dashboard (`/`)
- Exibe os KPIs do concurso selecionado no `ExamContext`: percentual de progresso geral, tópicos concluídos, tópicos pendentes, total de questões respondidas e taxa de acerto.
- Apresenta um gráfico de barras (`BarChart` via Recharts) com a prioridade média por disciplina para orientar o foco do estudante.

### Plano de Estudo (`/plano`)
- Exibe a lista de semanas estruturadas em formato de acordeão (com a primeira semana expandida por padrão).
- Cada semana contém as metas de teoria e revisão, acompanhadas de seus respectivos materiais (videoaulas, PDFs, questões, tarefas).
- Permite marcar a conclusão de materiais (`goal_completions`), recalculando o progresso instantaneamente.
- Oferece um botão para exibir o `study_tip` (dica de estudo estratégica) em modal.
- Possui filtro por disciplina que alterna para visualização em lista plana.

### Edital Mestre (`/edital`)
- Tabela completa de tópicos do edital selecionado, unindo `topics` e `topic_exams`.
- Colunas: Disciplina/Assunto, Recorrência, Tendência, Peso e Prioridade calculada.
- Permite ordenação por qualquer coluna e filtros combinados por disciplina e status de estudo do usuário (`user_progress`).
- Indica visualmente quando um tópico pertence a múltiplos concursos (ex: badge "Também em SEFAZ-AL").

### Questões (`/questoes`)
- Módulo de resolução de questões com exibição de uma questão por vez.
- Registra cada tentativa na tabela `question_attempts` e revela o gabarito comentado (`explanation`) imediatamente após a resposta.
- Contém uma sub-aba de estatísticas detalhando o total respondido, taxa de acerto global e breakdown por disciplina.
