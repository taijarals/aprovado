# Regras de Negócio

Este documento centraliza as regras de negócio lógicas e fluxos de usuário da aplicação.

## 1. Fluxo de Autenticação e Autorização

- **Obrigatoriedade de Login:** A aplicação é estritamente privada. O usuário não pode acessar nenhuma funcionalidade de conteúdo (Dashboard, Edital, Questões) sem uma sessão ativa.
- **Redirecionamento de Não-Autenticados:** Qualquer tentativa de acesso direto via URL a uma rota protegida (ex: `/`) por um usuário sem sessão redireciona imediatamente para a tela `/login`.
- **Redirecionamento de Autenticados:** Se um usuário logado acessar a tela de `/login`, ele deve ser automaticamente redirecionado para a rota raiz protegida (`/`).
- **Estado de Carregamento (Loading):** Durante a checagem inicial da sessão com o Supabase (ao recarregar a página), o aplicativo deve bloquear o acesso aos componentes e exibir um spinner visual para evitar *flickering* (redirecionamento falso antes do tempo).
- **Logout:** O usuário pode encerrar a sessão a qualquer momento através do menu. Após a revogação do token no backend do Supabase, o redirecionamento para a tela de login ocorre automaticamente através da reatividade do `AuthContext`.

## 2. Estruturação do Edital e Cronograma

### Priorização de Tópicos
A ordem e relevância com que um tópico de edital é sugerido ao aluno depende do cálculo matemático de **Prioridade**.

**Fórmula:**
`Prioridade = (Recorrência + 1) * Peso * Fator de Tendência`

**Racional das variáveis:**
- **Recorrência:** Número bruto de vezes que o assunto caiu em provas anteriores daquela banca para a área fiscal. Adicionamos `+1` na fórmula para garantir que um tópico inédito (recorrência 0) não seja anulado na multiplicação e ainda mantenha alguma relevância baseada em seu peso.
- **Peso:** Pontuação/peso intrínseco da disciplina naquele edital específico (ex: Direito Tributário costuma ter peso 2 ou 3).
- **Fator de Tendência:** Uma métrica comportamental da banca recente:
  - *Crescente*: Multiplicador `1.2` (Banca está cobrando mais isso nos últimos 2 anos).
  - *Estável*: Multiplicador `1.0` (Neutro).
  - *Decrescente*: Multiplicador `0.8` (Frequência em queda).

O script de carga inicial (`seed.ts`) utiliza essa regra no momento em que estrutura a ementa do edital no banco, populando a coluna `priority`.
