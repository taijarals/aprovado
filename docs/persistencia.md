# Estratégia de Persistência

## Banco de Dados Principal
A aplicação utiliza o **Supabase (PostgreSQL)** como solução de persistência primária em nuvem.

### O Schema `aprovado`
Para isolar os dados deste aplicativo de outros projetos que possam habitar o mesmo cluster/banco do Supabase, definimos que **todas as tabelas do domínio da aplicação** vão viver dentro de um schema customizado chamado `aprovado` (ao invés do schema padrão `public`).

O cliente Supabase (`src/lib/supabase.ts`) está globalmente configurado para utilizar este schema:
```javascript
{ db: { schema: 'aprovado' } }
```

### Tabelas Atuais (Fase 2)

As seguintes tabelas compõem o banco (todas em `aprovado`, exceto `auth.users`):
- **Conteúdo Público/Geral:** `exams`, `topics`, `weeks`, `goals`, `materials`, `questions`.
- **Dados Isolados do Usuário:** `user_progress`, `goal_completions`, `question_attempts`.
- **Sistema:** `auth.users` (Gerenciada pelo Supabase).

## Políticas de Segurança (RLS - Row Level Security)
A segurança é gerenciada diretamente no banco de dados através de políticas RLS em todas as tabelas:

1. **Tabelas de Conteúdo:**
   - Possuem a política de `SELECT TO authenticated USING (true)`.
   - Isso significa que qualquer usuário que fizer login no app consegue ler (baixar) editais, tópicos, planos de estudo e questões do banco. Edição/remoção só podem ser feitas via painel do Supabase ou superusuários (para garantir que alunos não alterem questões).

2. **Tabelas de Progresso (`user_progress`, `goal_completions`, `question_attempts`):**
   - Possuem políticas rígidas baseadas no UUID do dono: `FOR ALL TO authenticated USING (auth.uid() = user_id)`.
   - Assim, o usuário X só poderá visualizar, criar, atualizar ou remover o seu próprio progresso no plano de estudos e no banco de questões. Dados de terceiros ficam inacessíveis no nível do banco.
