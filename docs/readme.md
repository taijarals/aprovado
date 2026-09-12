# Aprova Fisco

## Visão Geral
O **Aprova Fisco** é um aplicativo web focado em otimizar e organizar os estudos de candidatos para os concursos públicos da Área Fiscal, especificamente **SEFAZ-BA** e **SEFAZ-AL**.

## Público-Alvo
Candidatos e concurseiros que estão se preparando para os cargos de Auditor Fiscal e similares nas Secretarias da Fazenda dos estados da Bahia e Alagoas, necessitando de um direcionamento claro de editais, plano de estudos e resolução de questões.

## Funcionalidades

### Funcionalidades (Status Final)

- [x] **Setup & Arquitetura:** React, TypeScript, Vite, Tailwind CSS, Wouter, Express backend proxy, Supabase (schema `aprovado`) e Supabase Auth.
- [x] **Múltiplos Editais:** Suporte completo e seletor ativo para **SEFAZ-BA (2022)** e **SEFAZ-AL (2026)** com tópicos compartilhados e exclusivos.
- [x] **Dashboard:** KPIs de progresso, tópicos pendentes, questões respondidas, taxa de acerto e gráfico de prioridade média por disciplina.
- [x] **Onboarding & Boas-Vindas:** Tela de boas-vindas dinâmica para novos usuários orientando o início pela Semana 1.
- [x] **Plano de Estudo:** Cronograma estruturado por semanas, conclusão de materiais e **Geração de Resumos com IA** (`gemini-2.5-flash`) sob demanda com cache em banco de dados.
- [x] **Edital Mestre:** Tabela completa de tópicos com métricas de recorrência, tendência, peso, prioridade calculada e filtros avançados.
- [x] **Questões & Repetição Espaçada:** Módulo de resolução com gabarito comentado, **Geração de Questões Inéditas com IA** (estilo CESPE, FGV, FCC, livre) e algoritmo de revisão espaçada (SM-2 simplificado) atualizando `mastery_score` e `next_review_at`.
- [x] **Responsividade & UX:** Sidebar colapsável em mobile, navegação fluida e design system limpo sem poluição visual.

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
