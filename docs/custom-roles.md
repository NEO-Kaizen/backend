# Perfis e perfis customizados

Este documento descreve como os perfis são criados, editados e compostos. As chaves, a custódia, a atribuibilidade e a matriz dos perfis base estão em [`rbac.md`](./rbac.md).

## 1. Perfil base × perfil customizado

Um perfil é uma composição de permissões. Os cinco perfis base — _Solicitante_, _Analista_, _Visualizador_, _Administrador_ e _Admin Root_ — são semeados com a matriz de referência do `rbac.md`.

Perfis customizados nascem por rota e são compostos a partir das mesmas chaves do catálogo. O cliente cria perfis, não capabilities: uma chave nova continua exigindo código, um ponto de verificação no serviço e uma affordance no frontend.

| Propriedade         | Perfil base                                                                    | Perfil customizado                              |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| Origem              | seed                                                                           | rota `POST /profiles`                           |
| Composição          | matriz de referência do `rbac.md`                                              | escolhida pelo editor                           |
| Desativação         | permitida quando não houver usuários vinculados (Admin Root: proteção própria) | permitida quando não houver usuários vinculados |
| Chaves              | subconjunto da matriz de referência                                            | subconjunto escolhido no editor                 |
| Atribuibilidade     | flags do seed                                                                  | flags explícitas, validadas pelo predicado      |
| Conta de Admin Root | criada apenas pelo seed                                                        | não se aplica                                   |

O _Admin Root_ é identificado pela marca `is_root`, nunca pelo nome: a conta é única, nasce só do seed e fica fora de rota.

O perfil `Solicitante` é a composição mínima de autoatendimento: `request:create` global, `request:track` em `own` e `pending_item:respond` em `own`. Ele não tem nenhuma chave interna. Um perfil customizado com as três chaves de autoatendimento e nenhuma chave interna é um Solicitante autenticado.

## 2. `profile:read` e `profile:manage`

| Chave            | O que permite                                                |
| ---------------- | ------------------------------------------------------------ |
| `profile:read`   | Ler perfis e as chaves de cada um                            |
| `profile:manage` | Criar, editar, duplicar e desativar perfis e atribuir chaves |

O Administrador e o Admin Root recebem as duas chaves. Quem tem `profile:manage` cria, edita e concede dentro do próprio conjunto — inclusive conceder `profile:manage`, porque o ator já a tem. Só o Admin Root edita o perfil Admin Root.

Rotas:

| Rota                           | Chave            | Efeito                                                                        |
| ------------------------------ | ---------------- | ----------------------------------------------------------------------------- |
| `GET /profiles`                | `profile:read`   | Lista os perfis e a composição de cada um                                     |
| `GET /profiles/keys`           | `profile:read`   | Devolve o catálogo de chaves na ordem de referência e os predicados das flags |
| `GET /profiles/:id`            | `profile:read`   | Detalha um perfil                                                             |
| `POST /profiles`               | `profile:manage` | Cria um perfil customizado, com corpo integral                                |
| `PATCH /profiles/:id`          | `profile:manage` | Edição parcial e atômica: nome, descrição, flags e/ou composição              |
| `PATCH /profiles/:id/status`   | `profile:manage` | Ativa ou desativa o perfil                                                    |
| `POST /profiles/:id/duplicate` | `profile:manage` | Cria um customizado a partir da composição e das flags de outro               |

`GET /profiles/keys` é declarada antes de `/:id` para não ser capturada pelo parâmetro.

Não há exclusão física: desativar é a operação de saída. Um perfil com usuários vinculados não é desativado sem a realocação desses usuários.

### 2.1 Edição parcial e atômica

`PATCH /profiles/:id` é a única rota de edição. O corpo aceita `name`, `description`, `isAssignableTriage`, `isAssignableMapping` e `permissions`: campo ausente é intocado; campo presente é alterado. `permissions` presente é **substituição integral** da composição, nunca merge. A edição é atômica: ou tudo vale, ou nada muda.

`PUT /profiles/:id/permissions` não existe no contrato. `POST /profiles` mantém o corpo integral do exemplo da § 3, e a desativação continua em `PATCH /profiles/:id/status`.

### 2.2 Contrato dos DTOs

- O DTO de perfil expõe `userCount`: quantas contas usam o perfil.
- O nome do perfil é único, comparação case-insensitive, entre perfis ativos. Criar ou renomear para um nome já ativo é `400`.
- O DTO de usuário expõe `profile: { id, name }`.
- Perfil inativo não recebe conta nova nem designação.

### 2.3 Duplicar um perfil

`POST /profiles/:id/duplicate` cria um perfil customizado a partir da composição e das flags de um perfil existente — base ou customizado. A cópia nasce como customizado, com um nome novo, e passa pelas mesmas validações da criação: sem escalação, dependências, custódia fixa e unicidade de nome. Duplicar é um atalho de edição, não uma forma de escalação. Duplicar o Admin Root é permitido: a cópia é um customizado com as mesmas chaves — as guardas protegem o perfil e a conta `is_root`, não o conjunto de chaves.

## 3. Como compor um perfil

Cada item da composição é um par chave + vínculo. O valor aceito depende do tipo da chave:

| Chave                                           | Valores aceitos           |
| ----------------------------------------------- | ------------------------- |
| `global`                                        | `global`                  |
| posse (`request:track`, `pending_item:respond`) | `own` — fixo, sem seletor |
| demais `custodial`                              | `assigned` ou `all`       |

`own` vale apenas sobre a solicitação em que o ator é o Solicitante (posse); `assigned`, sobre as linhas em que o ator é o Responsável; `all`, sobre qualquer linha. Chave `global` não tem vínculo de linha.

O editor mostra o seletor apenas para as demais custodiais: `assigned` ou `all`. Chave `global` não aceita vínculo; as chaves de posse são fixas em `own`, e o servidor recusa qualquer outro valor para elas.

`own` é sempre um grant explícito. Um perfil que não recebeu `request:track` não vê as próprias solicitações, mesmo sendo o autor: a autoria cria a posse, mas não cria a chave.

As dependências de chave estão na § 1.7 do `rbac.md` e são validadas no servidor: a composição que concede `pending_item:respond` sem `request:track`, por exemplo, é recusada.

Exemplo de criação:

```json
{
  "name": "Coordenador",
  "description": "Tria e redistribui qualquer solicitação",
  "isAssignableTriage": true,
  "isAssignableMapping": false,
  "permissions": [
    { "key": "request:read", "custody": "all" },
    { "key": "request:assign", "custody": "all" },
    { "key": "request:status_change", "custody": "all" },
    { "key": "request:status_override", "custody": "global" },
    { "key": "queue:read", "custody": "all" },
    { "key": "triage:read", "custody": "all" },
    { "key": "triage:write", "custody": "all" },
    { "key": "assignee_directory:read", "custody": "global" }
  ]
}
```

A ordem da composição é a ordem do catálogo, para o contrato ser determinístico. `profile:read` devolve a composição efetiva; `PATCH /profiles/:id` com `permissions` presente substitui a composição inteira (§ 2.1).

## 4. Guardas

Toda edição de perfil passa pelo servidor. As guardas abaixo não são sugestões de interface: são validações de serviço.

1. **Sem escalação.** Um perfil só recebe chaves que o ator possui — `profile:manage` incluída — e vínculo nunca mais amplo que o do concedente: `all` > `assigned`; `own` é fixo nas chaves de posse. O editor não consegue conceder o que não tem.
2. **Perfil Admin Root protegido.** O perfil Admin Root é identificado por `is_root`, nunca pelo nome. Só o Admin Root o edita; ele não perde `profile:manage` nem é desativado. A conta é única, nasce só do seed e fica fora de rota.
3. **Exclusão física não existe.** Nenhum perfil — base ou customizado — é excluído fisicamente; a desativação segue a guarda 4 para todos, salvo o Admin Root (guarda 2).
4. **Perfil com usuários.** Não é desativado sem a realocação dos usuários para outro perfil.
5. **Dependências de chave.** As dependências estão na § 1.7 do `rbac.md`: `*:manage` exige `*:read`; `request:status_override` exige `request:status_change`; `pending_item:respond` exige `request:track`. `request:track` e `pending_item:respond` só aceitam `own`. As flags `is_assignable_triage` e `is_assignable_mapping` exigem o predicado de chaves de trabalho da § 1.4 do `rbac.md`.
6. **Edição atômica da chave de trabalho.** Remover a chave de escrita de uma etapa com a flag ligada — e a flag ausente no corpo — é `400`. Desligar a flag e remover as chaves na mesma chamada é aceito, exceto quando existem solicitações abertas atribuídas a usuários do perfil: a resposta é `400` com os protocolos, até a realocação.
7. **Auditoria.** Toda alteração de perfil grava o antes e o depois, o ator e o momento na trilha de auditoria.
8. **Autoedição.** Ninguém altera a designação de perfil da própria conta pelas rotas administrativas. A troca de perfil de uma conta é uma operação de `user:manage`, sujeita à matriz de contas do `rbac.md`.
9. **Duplicação é criação.** A cópia nasce como customizado e passa por todas as validações da criação (§ 2.3).

## 5. Exemplos

As composições seguem a ordem do catálogo; o exemplo de criação está na § 3.

| Perfil               | Composição                                                                                                                                                                                         | Observação                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Designer de Tema** | `theme:read` global, `theme:manage` global                                                                                                                                                         | Não vê status, categoria, formulário, usuário ou solicitação                    |
| **Coordenador**      | `request:read` all, `request:assign` all, `request:status_change` all, `request:status_override` global, `queue:read` all, `triage:read` all, `triage:write` all, `assignee_directory:read` global | Tria e redistribui qualquer solicitação; `is_assignable_triage` pode ser `true` |
| **Despachante**      | `request:read` all, `request:assign` all, `queue:read` all, `assignee_directory:read` global                                                                                                       | Distribui, não tria; não é atribuível                                           |
| **Auditor**          | `request:read` all, `queue:read` all, `reports:read` global, `audit:read` all                                                                                                                      | Lê tudo, não escreve                                                            |
| **Cliente Externo**  | `request:create` global, `request:track` own, `pending_item:respond` own                                                                                                                           | Composição do Solicitante; nenhuma chave interna                                |

`own` aparece no Cliente Externo e em todo perfil que receba `request:track` ou `pending_item:respond`: é a posse, não a custódia interna. O _Solicitante_ base usa exatamente essa composição.

Os exemplos acima destacam as chaves internas que distinguem cada perfil. O autoatendimento é uma escolha do editor: um perfil que também abre e acompanha solicitações recebe `request:create` global e `request:track` em `own`; para responder às próprias pendências, acrescenta `pending_item:respond` em `own` (dependência na § 1.7 do `rbac.md`). Sem essas chaves, o usuário não abre nem acompanha as próprias solicitações, mesmo sendo autor.

## 6. Efeito no frontend

- `GET /auth/me` devolve `role` e `permissions: [{ key, custody }]`. A tela usa `has(key)` e o vínculo, não o nome do perfil.
- A abertura de solicitação usa `has("request:create")`; “minhas solicitações” usa `has("request:track")`; a resposta a pendências usa `has("pending_item:respond")`.
- O cadastro de usuário lê os perfis com `profile:read` e mostra os ativos, inclusive customizados.
- Abas, botões e guardas de rota derivam da chave. Uma tela nova não pergunta “é Administrador?”; pergunta “tem `theme:manage`?”.
- A única porta sem chave é a pública anônima, no modo `PUBLIC`: sem sessão, não há ator nem perfil para avaliar.
- Remover `request:create`, `request:track` ou `pending_item:respond` de um perfil exige confirmação explícita (ConfirmDialog) que diga a consequência — sem a chave, o autor perde a operação correspondente. A auditoria antes/depois permanece no servidor.
- O rótulo do perfil vem do nome real do perfil; `getRoleDisplayLabel` se aposenta.
- `role` continua no DTO para exibição, mas não é a fonte da decisão de acesso.
