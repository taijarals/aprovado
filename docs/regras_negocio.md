# Regras de Negócio

Este documento centraliza as regras de negócio lógicas e fluxos de usuário da aplicação.

## 1. Fluxo de Autenticação e Autorização

- **Obrigatoriedade de Login:** A aplicação é estritamente privada. O usuário não pode acessar nenhuma funcionalidade de conteúdo (Dashboard, Edital, Questões) sem uma sessão ativa.
- **Redirecionamento de Não-Autenticados:** Qualquer tentativa de acesso direto via URL a uma rota protegida (ex: `/`) por um usuário sem sessão redireciona imediatamente para a tela `/login`.
- **Redirecionamento de Autenticados:** Se um usuário logado acessar a tela de `/login`, ele deve ser automaticamente redirecionado para a rota raiz protegida (`/`).
- **Estado de Carregamento (Loading):** Durante a checagem inicial da sessão com o Supabase (ao recarregar a página), o aplicativo deve bloquear o acesso aos componentes e exibir um spinner visual para evitar *flickering* (redirecionamento falso antes do tempo).
- **Logout:** O usuário pode encerrar a sessão a qualquer momento através do menu. Após a revogação do token no backend do Supabase, o redirecionamento para a tela de login ocorre automaticamente através da reatividade do `AuthContext`.
