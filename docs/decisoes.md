# Registro de Decisões Técnicas (ADR - Architecture Decision Records)

Este documento registra cronologicamente decisões arquiteturais e técnicas importantes e o raciocínio por trás delas.

### Fase 1: Setup Inicial

- **Decisão: Uso de React 19, Vite e Tailwind CSS.**
  - *Contexto:* Necessidade de um frontend rápido, produtivo e fácil de escalar sem o peso de um framework Fullstack massivo se a renderização for essencialmente no lado do cliente (SPA).
  - *Motivo:* Vite oferece HMR extremamente rápido e configuração mínima. Tailwind elimina a necessidade de múltiplos arquivos CSS e promove consistência no design system.

- **Decisão: Supabase para Backend e Auth.**
  - *Contexto:* Precisamos de um banco relacional robusto (PostgreSQL) e autenticação de forma rápida.
  - *Motivo:* Supabase fornece PostgreSQL completo na nuvem, cliente amigável (`supabase-js`) e resolve a complexidade de Auth/Sessões sem demandar um servidor Node.js backend manual para validação inicial de credenciais.

- **Decisão: Uso de `wouter` para Roteamento.**
  - *Contexto:* Precisamos de navegação entre rotas de login e dashboard.
  - *Motivo:* O `wouter` é muito mais minimalista e leve do que o `react-router`, facilitando a configuração rápida de SPAs com menos boilerplate e tamanho de bundle menor.

### Fase 1.5: Configuração de Schema Isolado e Docs

- **Decisão: Migração do banco para o schema customizado `aprovado`.**
  - *Contexto:* Evitar colisões e misturas de dados caso o mesmo banco do Supabase seja utilizado para diferentes aplicações.
  - *Motivo:* A separação clara (usando `db: { schema: 'aprovado' }` no cliente) aumenta a governança dos dados, mantém as tabelas de negócio do Aprova Fisco unidas em um único schema e deixa o schema `public` vazio e seguro.
  
- **Decisão: Implementação de "Documentação Viva" (`/docs`).**
  - *Contexto:* Projetos construídos iterativamente podem perder contexto de regras e estruturas ao longo do tempo.
  - *Motivo:* Manter arquivos em Markdown dentro do próprio repositório garante que a estrutura, persistência e as regras de negócio sejam lidas e atualizadas sistematicamente pelo desenvolvedor/assistente de IA em cada fase, prevenindo desvios arquiteturais.

### Fase 2: Modelagem de Dados e Banco

- **Decisão: Divisão clara entre Dados Estruturais e Progresso Pessoal.**
  - *Contexto:* O aplicativo precisa exibir os mesmos concursos e questões para todos, mas rastrear isoladamente os acertos de cada candidato.
  - *Motivo:* Tabelas públicas (exams, topics, questions) otimizam cache e leitura (sem clonar dados). Tabelas isoladas (user_progress, question_attempts) cruzam o ID do usuário (auth.uid) com o ID estrutural para rastreamento exclusivo.
  
- **Decisão: Fonte de Questões definida como `ia_nova` ou `ia_estilo_banca`.**
  - *Contexto:* Riscos de direitos autorais ou termos de serviço ao fazer *scraping* ou importar bancos completos oficiais (QConcursos, TecConcursos).
  - *Motivo:* Definimos explicitamente na regra de dados que as questões não são as oficiais, mas recriações geradas por Inteligência Artificial no exato estilo da banca real (FGV, CESPE) com base no edital, conferindo segurança jurídica e escopo flexível (Fase 3+ com Gemini).

- **Decisão: Deleções em Cascata (ON DELETE CASCADE) em FKs de dependência forte.**
  - *Contexto:* O que acontece quando um exame (Concurso) é deletado?
  - *Motivo:* Propagar deleções ajuda na limpeza e manutenção do banco. Se um concurso é apagado, semanas (`weeks`), tópicos e metas vinculadas devem ir junto, pois não têm existência autônoma fora daquele concurso. Progresso atrelado a eles também é apagado.
