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

**Fórmula de Prioridade (Seed SEFAZ-BA):**
`Prioridade = ((Tendência * 0.3 + Recorrência * 0.4 + PesoNormalizado * 0.3) * 10)`

**Racional das variáveis:**
- **Tendência (0 a 10 - peso 30%):** Avalia a propensão recente da banca (ex: FGV/Cebraspe) cobrar o assunto em provas fiscais recentes.
- **Recorrência (0 a 10 - peso 40%):** Frequência histórica com que o assunto foi cobrado nos editais anteriores da SEFAZ-BA (2019 e 2022).
- **Peso Normalizado (0 a 10 - peso 30%):** Relevância pontual da disciplina/tópico no edital, normalizada para a base 0-10 caso venha na escala original de 0-5.
- O resultado é multiplicado por 10 para fornecer uma nota de prioridade de 0 a 100, facilitando a classificação em faixas (Altíssima, Alta, Média, Baixa).

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

## 4. Funcionalidades de Inteligência Artificial Generativa (Gemini)

### 4.1 Geração de Resumo sob Demanda
- **Disponibilidade:** Na tela de **Plano de Estudo**, junto a cada material que possua `study_tip`.
- **Cache (Economia de Chamadas):** Se o material já possui o campo `ai_summary` preenchido no banco de dados, a interface exibe o botão "Resumo IA" que abre diretamente o modal com o resumo salvo. Caso contrário, exibe o botão "Gerar Resumo IA".
- **Comportamento:** Ao clicar, o sistema invoca o backend que chama o Gemini (`gemini-2.5-flash`) com contexto do `study_tip` e do título, gerando um resumo didático objetivo, salvando no banco de dados e exibindo para o usuário.

### 4.2 Geração de Questões sob Demanda
- **Disponibilidade:** Na tela de **Questões**, através do botão "Gerar novas questões".
- **Parâmetros:** O usuário escolhe o tópico, a quantidade (3, 5 ou 10) e opcionalmente o estilo de banca (Livre, CESPE/CEBRASPE, FGV, FCC).
- **Regras:**
  - O prompt instrui o Gemini a utilizar o resumo e dicas de prova do tópico como base de conteúdo.
  - As questões geradas são estritamente originais ("no estilo da banca", nunca apresentadas como questões oficiais de provas anteriores).
  - São salvas na tabela `questions` com `source = "ia_nova"` ou `"ia_estilo_banca"`.
  - Erros de API ou limites de taxa são tratados com mensagens amigáveis na interface.
