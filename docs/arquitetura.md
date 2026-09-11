# Arquitetura do Sistema

## Stack Tecnológica
- **Frontend:** React 19, TypeScript, Vite (bundler e dev server rápido), Tailwind CSS (estilização utilitária).
- **Roteamento:** Wouter (roteador minimalista baseado em hooks).
- **Backend / Banco de Dados:** Supabase (PostgreSQL + Supabase Auth).
- **Inteligência Artificial:** Gemini (via `@google/genai`), já configurado para uso futuro.

## Estrutura de Pastas

A organização do diretório `src/` segue um padrão de separação de responsabilidades:

- `/src/components/`: Componentes visuais e de layout reutilizáveis (ex: `Layout.tsx`).
- `/src/contexts/`: Gerenciadores de estado global usando React Context API (ex: `AuthContext.tsx`).
- `/src/lib/`: Configurações e instâncias de clientes de terceiros (ex: `supabase.ts`).
- `/src/pages/`: Componentes que representam telas inteiras roteáveis (ex: `Login.tsx`, `Dashboard.tsx`).

## Fluxo de Comunicação (Camadas)

A arquitetura segue um fluxo unidirecional de dados e responsabilidades:

1. **Camada de Interface (Componentes e Páginas):**
   - Interage com o usuário e exibe informações.
   - Não acessa o banco de dados diretamente.
   - Ex: `Dashboard.tsx` exibe os dados do usuário.

2. **Camada de Estado / Regras (Contextos e Hooks):**
   - Fornece dados para a interface e encapsula a lógica de negócio principal.
   - Ex: `useAuth()` hook provido pelo `AuthContext.tsx` gerencia se o usuário está logado, ouvindo as mudanças de sessão.

3. **Camada de Serviços / Infraestrutura (Client API):**
   - Acessa o mundo externo (APIs, Banco de Dados).
   - Ex: `src/lib/supabase.ts` exporta a instância configurada do Supabase Client, que se comunica via rede com o banco de dados PostgreSQL.

**Exemplo de fluxo de Login:**
`Login.tsx` (Interface) → Submete formulário → Chama função assíncrona usando `supabase.auth` (Serviço) → Atualiza `AuthContext` (Estado) → Redireciona via Wouter e renderiza `Dashboard.tsx` (Interface).
