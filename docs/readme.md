# Aprova Fisco

## Visão Geral
O **Aprova Fisco** é um aplicativo web focado em otimizar e organizar os estudos de candidatos para os concursos públicos da Área Fiscal, especificamente **SEFAZ-BA** e **SEFAZ-AL**.

## Público-Alvo
Candidatos e concurseiros que estão se preparando para os cargos de Auditor Fiscal e similares nas Secretarias da Fazenda dos estados da Bahia e Alagoas, necessitando de um direcionamento claro de editais, plano de estudos e resolução de questões.

## Funcionalidades

### Construídas (Até o momento)
- [x] Setup inicial do projeto (React, TypeScript, Vite, Tailwind CSS).
- [x] Configuração de roteamento simplificado com Wouter.
- [x] Autenticação completa via Supabase Auth (Login/Cadastro com E-mail e Senha).
- [x] Proteção de rotas (Redirecionamento automático para usuários não logados).
- [x] Layout base responsivo com Sidebar de navegação e seletor de edital ativo.
- [x] **Dashboard:** KPIs de progresso, tópicos concluídos, taxa de acerto e gráfico de prioridade média por disciplina.
- [x] **Plano de Estudo:** Cronograma em formato de acordeão por semanas, marcação de conclusão de materiais, visualização de `study_tip` em modal e filtro por disciplina.
- [x] **Edital Mestre:** Tabela completa de tópicos com métricas de recorrência, tendência, peso, prioridade calculada, ordenação, filtros e indicador de tópicos compartilhados entre editais.
- [x] **Questões:** Módulo de resolução de questões com gabarito comentado instantâneo, registro de tentativas e aba de estatísticas e desempenho por disciplina.

## Como rodar o projeto localmente

1. Certifique-se de ter o Node.js instalado.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto (copie o modelo de `.env.example`) e preencha as variáveis do Supabase:
   ```env
   VITE_SUPABASE_URL="SUA_URL_DO_SUPABASE"
   VITE_SUPABASE_ANON_KEY="SUA_ANON_KEY_DO_SUPABASE"
   SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:3000` no seu navegador.
