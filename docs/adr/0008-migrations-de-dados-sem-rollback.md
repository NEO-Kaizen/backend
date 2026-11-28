# Migrations de dados sem rollback de dados

**Status:** aceito — 25/11/2026

`CODING_STANDARDS.md` §6.3 pede `down` reversível em toda migration. As duas
migrations de dados da Rodada 01 do RBAC —
`20261125120000_backfill_rbac_dependencies.js` e
`20261125120100_remove_form_permission_grants.js` — têm `down` no-op
deliberado, e esta é a exceção registrada.

O backfill concede as dependências novas (`request:create` → `request:track`,
`request:assign` → `assignee_directory:read`, `user:manage` → `profile:read`)
a Perfis que já existiam. Sem uma tabela de log, a linha não diz se a concessão
nasceu nesta migration ou se já era legítima: um `down` que apagasse os pares
poderia remover `request:track` de um Perfil que sempre o teve. A remoção das
chaves `form:read`/`form:manage` segue a mesma lógica — o estado anterior era
exatamente o que a migration descarta, e não há como reconstruí-lo sem inventar
concessões.

## Alternativas consideradas

- **Tabela de log permanente:** distinguiria o que cada migration inseriu, mas
  cria estrutura de longa duração para um evento único; a auditoria de release
  cobre o registro.
- **`down` heurístico (apagar dependências de quem tem a chave principal):**
  reversível na forma, incorreto no conteúdo — quebraria Perfis legítimos.
- **Não migrar e exigir recomposição manual:** deixa o login e `/auth/me`
  quebrados até a intervenção, porque `buildEffectivePermissions` falha alto
  para dependência ausente e para chave fora do catálogo.

## Consequências

- O `down` das duas migrations não desfaz dados; reverter o código exige
  recompôr as concessões manualmente, se necessário. O cabeçalho de cada
  arquivo repete a justificativa.
- A migration roda **antes** de a aplicação nova receber tráfego; a ordem está
  em `docs/database/authentication-persistence.md`.
- O aceite da entrega registra a exceção e a mudança de dados no PR e na nota
  de release.
