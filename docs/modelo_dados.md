# Modelo de Dados

Este documento descreve a estrutura das entidades e suas relações no banco de dados.

## Entidade: Usuário (Auth)

Atualmente, o domínio central de dados repousa sobre a entidade de usuário gerada pelo Supabase.

- **Tabela:** `auth.users` (Gerenciada pelo Supabase)
- **Campos Relevantes:**
  - `id` (UUID): Identificador único do usuário, servirá como chave estrangeira (`user_id`) para todos os dados futuros no schema `aprovado`.
  - `email` (String): E-mail utilizado para login.
  - `created_at` (Timestamp): Data de registro do usuário.

*(Este arquivo será expandido significativamente na Fase 2, onde diagramaremos as tabelas e relações do domínio do concurso, como Tópicos do Edital, Sessões de Estudo e Questões).*
