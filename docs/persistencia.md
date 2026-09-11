# Estratégia de Persistência

## Banco de Dados Principal
A aplicação utiliza o **Supabase (PostgreSQL)** como solução de persistência primária em nuvem.

### O Schema `aprovado`
Para isolar os dados deste aplicativo de outros projetos que possam habitar o mesmo cluster/banco do Supabase, definimos que **todas as tabelas do domínio da aplicação** vão viver dentro de um schema customizado chamado `aprovado` (ao invés do schema padrão `public`).

O cliente Supabase (`src/lib/supabase.ts`) está globalmente configurado para utilizar este schema:
```javascript
{ db: { schema: 'aprovado' } }
```

### Tabelas Atuais

Atualmente, o projeto possui apenas as tabelas geradas e gerenciadas automaticamente pelo sistema de autenticação do Supabase:

- **`auth.users` (Schema `auth`)**: Tabela nativa do Supabase que armazena os dados de credenciais, email, e IDs (UUID) dos usuários. Não é gerenciada manualmente pela aplicação, apenas lida via métodos de autenticação.

*(Nota: À medida que tabelas de domínio, como `topicos`, `questoes` e `plano_estudo` forem criadas na Fase 2, elas serão listadas aqui e deverão residir no schema `aprovado` e possuirão chave estrangeira apontando para `auth.users(id)`).*

## Políticas de Segurança (RLS - Row Level Security)
No momento, como apenas o Auth está em uso, a segurança é baseada em JWTs do Supabase gerando sessões locais. 
Assim que as tabelas de domínio forem criadas no schema `aprovado`, o RLS será ativado em **todas** as tabelas. As políticas de segurança garantirão que:
- O usuário X só poderá ler, atualizar ou deletar registros do plano de estudo/histórico de questões criados pelo usuário X (`user_id = auth.uid()`).
