# Referência de Perfil: identidade estável e rótulo mutável

**Status:** aceito — 23/11/2026

O contrato público de Perfil passa a ser `profile: { id, name }`
(`ProfileReference`). `id` é `String(profiles.profile_id)` — a identidade
estável, a mesma exposta em `/profiles/:id` e aceita como `profileId` nas
escritas de conta. `name` é rótulo de exibição, mutável pelo editor de Perfis.

As respostas de autenticação, de usuários e da timeline publicam a referência;
os payloads de criação/edição de conta enviam `profileId`. O nome não identifica
nem autoriza: a autorização continua nas Permissões e na Custódia
(`docs/rbac.md`), e nenhuma query nova resolve Perfil por nome.

Snapshots históricos preservam o que o banco registrou:

- Nota interna grava `author_profile_id_at_creation` +
  `author_profile_name_at_creation`. Renomear o Perfil não reescreve a nota.
- Notas anteriores ao snapshot têm só o nome: expõem `profile.id = null` e o
  nome histórico. Nenhum ID é inferido de um nome mutável.
- Evento de auditoria grava `actor_profile_id` + `actor_profile_name` no momento
  da escrita. Eventos anteriores expõem `actor.profile = null`; o antigo
  `actor.role`, que vinha de um JOIN com o Perfil vigente, deixa de existir.

## Alternativas consideradas

- **Manter o nome como identificador:** era o estado anterior (`role` aqui,
  `profile` ali). O nome é editável e o Perfil pode ser renomeado, então o
  identificador deixaria de casar com o histórico e com a designação.
- **Adicionar um uuid público a `profiles`:** seguiria a regra 1 de
  `docs/database/identifier-patterns.md`, mas `GET /profiles/:id` já expõe
  `profile_id` como string e migrar as URLs quebraria consumidores sem ganho de
  segurança. O serial fica registrado como exceção documentada.
- **Expor em auditoria o Perfil vigente do ator:** o JOIN atual mostrava o
  Perfil de hoje num evento de ontem. O snapshot de ID+nome registra o que
  valia na hora e não inventa histórico.

## Consequências

- É uma mudança de contrato: `role: string` e `profile: string` deixam de
  existir, e `POST/PUT /users` só aceita `profileId`. O frontend migra junto.
- Renomear um Perfil não altera o histórico de notas e eventos; só novas
  referências usam o nome novo.
- Perfis nunca são excluídos fisicamente; as FKs de snapshot usam
  `ON DELETE RESTRICT` e a trilha `audit_history` segue append-only.
- A chave de Permissão que **autorizou** uma ação não é auditada. As recusas
  ganham `denied_permission_keys` estruturado; a decisão de autorização
  completa continua fora da trilha.

## Emenda — 25/11/2026 (Rodada 01 do RBAC)

A sessão (`login`, `GET /auth/me` e troca de senha) passa a publicar
`profile: { id, name, isRoot }` (`SessionProfileReference`), extensão de
`ProfileReference` com a marca estável `profiles.is_root`. A referência
genérica `{ id, name }` continua valendo para listagens, timeline e snapshots
de auditoria; `isRoot` não é propagado para esses contextos. O nome do Perfil
Admin Root segue editável, e nenhum cliente deve derivar autoridade do rótulo —
a identidade vem da marca.
