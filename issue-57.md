### Contexto

O Backend atualmente aceita apenas Analista, Gestor e Administrador, associa papéis por IDs numéricos fixos e registra o usuário encontrado no console. A migration, porém, ainda contém o perfil `solicitante`. E o perfil de solicitante voltará a ser uma role.

### Objetivo

Resolver o perfil pelo relacionamento do banco, autenticar Solicitantes e disponibilizar sessão confiável sem expor dados sensíveis.

### Escopo incluído

- reincluir `Solicitante` no tipo de papel;
- consultar o nome do perfil por `JOIN`, sem mapa por ID;
- impedir login de usuário/perfil inativo;
- remover logs de usuário e `password_hash`;
- padronizar o DTO de login com o Frontend;
- disponibilizar `GET /auth/me` validando JWT no Backend;
- preparar indicador de troca obrigatória de senha.

### Critérios de aceite

- [ ] Os quatro perfis autenticam quando ativos.
- [ ] Nenhum ID de perfil é interpretado por posição fixa.
- [ ] Usuário inativo recebe resposta genérica de credenciais inválidas.
- [ ] Senha/hash nunca aparece em resposta ou log.
- [ ] `/auth/me` rejeita sessão inválida e retorna usuário válido sem segredo.
- [ ] Typecheck, lint, format check e validação HTTP passam.

### Evidências esperadas

- login de Administrador e Solicitante;
- tentativa com conta inativa;
- resposta de `/auth/me`;
- resultados das validações.