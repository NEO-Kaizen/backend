# Motor de Permissões: catálogo em código e concessões em tabela

**Status:** aceito — 19/11/2026

O acesso do portal deixa de ser decidido pelo nome do Perfil e passa a ser
decidido pela Permissão `recurso:ação` (§ `docs/rbac.md`). As 39 chaves vivem
num módulo de domínio puro (`src/shared/catalog/permissionCatalog.ts`), que
descreve ordem de referência, tipo de custódia, vínculos aceitos, dependências,
posse fixa e predicados de Atribuibilidade. A composição de cada Perfil —
quais chaves e em que vínculo — vive no banco, na tabela `profile_permissions`
(Perfil × chave × vínculo, única por Perfil + chave). O seed dos perfis base e a
sessão (`GET /auth/me`) consomem o catálogo; não existe cópia paralela das
chaves.

## Alternativas consideradas

- **Catálogo inteiramente no banco:** permitiria criar chaves sem deploy, mas a
  chave é contrato — uma chave nova exige ponto de verificação no serviço e
  affordance na interface. Chave criada por configuração viraria permissão
  silenciosa sem efeito.
- **Composição em código (sem tabela):** simples, mas impediria perfis
  customizados e edição pela interface, que é o objetivo do RBAC configurável.

## Consequências

- Chave nova é sempre mudança de código, nunca configuração; a suíte contratual
  futura aponta direto para as funções puras do catálogo.
- O seed dos perfis base **regrava** marca, flags e vínculos ao estado de
  referência a cada execução (upsert por Perfil + chave). Quando o G1 (ticket 07)
  tornar os Perfis base editáveis por `profile:manage`, essa decisão deve ser
  revisada: re-rodar o seed passaria a reverter edições legítimas de composição.
- O CHECK do banco cobre apenas o domínio do vínculo (`global`, `own`,
  `assigned`, `all`); a validade das chaves é do catálogo em código.
