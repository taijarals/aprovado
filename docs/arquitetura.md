# Arquitetura do Sistema

## Stack Tecnológica
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Backend (Custom Server):** Express (`server.ts`) para rotas de API seguras e proxy seguro para IA.
- **Roteamento:** Wouter.
- **Banco de Dados:** Supabase (PostgreSQL schema `aprovado` + Supabase Auth).
- **Inteligência Artificial:** Gemini (`@google/genai` SDK usando o modelo `gemini-2.5-flash`), executado com segurança no backend.

## Estrutura de Pastas

A organização do diretório segue um padrão de separação de responsabilidades:

- `/server.ts`: Servidor Node.js em Express que atua como backend intermediário para chamadas seguras ao Gemini e operações privilegiadas via `SUPABASE_SERVICE_ROLE_KEY`.
- `/src/components/`: Componentes visuais e de layout reutilizáveis.
- `/src/contexts/`: Gerenciadores de estado global (ex: `AuthContext.tsx`, `ExamContext.tsx`).
- `/src/lib/`: Configurações de clientes (ex: `supabase.ts`).
- `/src/pages/`: Componentes de telas (`Dashboard.tsx`, `PlanoEstudo.tsx`, `Questoes.tsx`, etc.).
- `/docs/`: Documentação viva do sistema (arquitetura, regras de negócio, modelo de dados, persistência).

## Fluxo de Comunicação e IA Generativa
1. O usuário requisita a geração de um resumo didático ou de questões inéditas na interface.
2. O frontend chama o endpoint correspondente no backend (`/api/ai/summary` ou `/api/ai/questions`).
3. O servidor (`server.ts`) processa o prompt usando o SDK oficial `@google/genai` com o modelo `gemini-2.5-flash`.
4. O resultado gerado pela IA é persistido no banco de dados Supabase e retornado ao cliente.
5. A UI atualiza instantaneamente para exibir o conteúdo cacheado ou recém-gerado.
