# RBAC — permissões, custódia e atribuição

Este documento é o contrato do controle de acesso do backend. Ele define as permissões (`recurso:ação`), o que cada uma permite, como a custódia limita a linha, quem pode ser designado _Responsável_ e a matriz dos cinco perfis base. A criação e a edição de perfis — inclusive perfis customizados — estão em [`custom-roles.md`](./custom-roles.md).

**Regra de mudança:** toda alteração de chave, custódia, atribuibilidade ou matriz de perfil atualiza este documento, `custom-roles.md` quando aplicável e o `GLOSSARY.md` na mesma mudança.

## 1. O modelo

Quatro conceitos explicam toda decisão de acesso. Eles não se derivam uns dos outros.

| Conceito            | Pergunta que responde                       | Onde é resolvido                    |
| ------------------- | ------------------------------------------- | ----------------------------------- |
| **Permissão**       | O que o ator pode fazer?                    | Chave `recurso:ação`, no perfil     |
| **Custódia**        | Sobre qual linha a chave vale?              | Linha, a cada operação              |
| **Atribuibilidade** | O ator pode ser escolhido como Responsável? | Flag do perfil + chaves de trabalho |
| **Posse**           | O ator é o Solicitante desta solicitação?   | E-mail da conta ou e-mail declarado |

### 1.1 Permissão

A permissão é a chave `recurso:ação`, como `triage:write` ou `theme:manage`. O recurso é o nome do domínio em inglês, com `_` como separador interno; a ação é um dos verbos da § 2. A chave é contrato: o backend decide com ela, o frontend monta a interface com ela e o RBAC configurável semeia exatamente o mesmo catálogo. Uma chave nova exige código — um ponto de verificação no serviço e uma affordance no frontend. Nenhum perfil inventa uma capability.

### 1.2 Custódia

Toda chave é `global` ou `custodial`.

- **`global`** — a chave não depende da linha: abrir uma solicitação, relatório consolidado, lista de usuários, configuração do portal, perfil.
- **`custodial`** — a chave só vale sobre linhas alcançadas pelo ator. A linha é resolvida a cada operação, nunca no login.

A custódia não vai no token e não envelhece com ele. As fontes do vínculo com a linha são:

| Fonte                                                         | Vale para                                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `requests.professional_id` via `details_professional.user_id` | solicitação, Fila, Triagem, Priorização, Pendências internas, Notas internas e Auditoria |
| `mappings.professional_id` do Mapeamento aberto mais recente  | `mapping:read`, `mapping:write` e Fila, além do Responsável da solicitação               |
| `requests.mapping_professional_id`                            | Custódia inicial de Mapeamento/Fila antes de existir qualquer linha de Mapeamento        |
| `requests.requester_email`                                    | posse: `request:track` e `pending_item:respond`, comparando com o e-mail da conta        |

Snapshots de triagem e de mapeamento são histórico: eles registram o que aconteceu, não concedem acesso ao que acontece agora.

### 1.3 Os três vínculos

Uma chave `custodial` é concedida em um de três vínculos. O valor é o mesmo no documento, no banco e no `GET /auth/me`.

| Vínculo      | Valor no código | Vale sobre                                  | Quem usa nos perfis base                                                  |
| ------------ | --------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| **Posse**    | `own`           | a solicitação em que o ator é o Solicitante | todos os perfis em `request:track` e `pending_item:respond`               |
| **Custódia** | `assigned`      | linhas em que o ator é o Responsável        | Analista nas chaves internas                                              |
| **Todas**    | `all`           | qualquer linha, sem filtro                  | Visualizador nas internas de leitura; Administrador e Admin Root em todas |

`own` não significa “dono da fila” nem “dono do sistema”: significa a solicitação em que o ator é o Solicitante. `assigned` é a custódia — o vínculo que o Responsável corrente tem com a linha. `all` dispensa o filtro de linha.

Abrir uma solicitação estabelece a posse: o autor passa a ser o Solicitante daquela linha. As chaves `request:track` e `pending_item:respond` operam sobre esse vínculo em `own`. Autoria **não** concede `request:read`, `queue:read`, `triage:read` nem custódia interna: para ver a solicitação na visão interna, o autor precisa da chave interna e do vínculo `assigned`/`all`.

Só `request:track` e `pending_item:respond` aceitam `own` — nenhuma outra chave custodial usa esse vínculo. As duas têm **custódia fixa em `own`**: posse é o único vínculo que elas modelam. Não existe `request:track` em `assigned`/`all` — acompanhar a solicitação de outra pessoa é papel da visão interna (`request:read`), e responder à pendência de outra pessoa é papel de `pending_item:review`.

Chave `global` não tem vínculo de linha: no código e na API, o valor é `global`.

### 1.4 Atribuibilidade

A atribuibilidade é a propriedade do perfil cujos usuários podem ser escolhidos como _Responsável_. Ela exige duas coisas: a flag explícita do perfil (`is_assignable_triage` ou `is_assignable_mapping`) e o predicado de chaves de trabalho.

| Flag                    | Predicado                                         |
| ----------------------- | ------------------------------------------------- |
| `is_assignable_triage`  | `request:read` + `triage:read` + `triage:write`   |
| `is_assignable_mapping` | `request:read` + `mapping:read` + `mapping:write` |

Ter as chaves não basta: a flag é uma decisão de produto. O Administrador e o Admin Root têm todas as chaves, mas as flags ficam desligadas — eles não entram no pool por acidente.

Atribuibilidade não é `request:assign`: atribuir é escolher o Responsável; ser atribuível é poder ser escolhido.

### 1.5 O que não se confunde

| Termo                | Pergunta que responde                   | Exemplo                                                  |
| -------------------- | --------------------------------------- | -------------------------------------------------------- |
| **`request:assign`** | quem pode escolher o Responsável        | o Analista redistribui a solicitação que custodía        |
| **Atribuibilidade**  | quem pode ser escolhido                 | perfil com `is_assignable_triage` e as chaves de triagem |
| **Custódia**         | sobre qual linha a chave custodial vale | `requests.responsible_id = analista.id`                  |
| **Posse**            | quem abriu a solicitação                | o autor acompanha a própria solicitação em `own`         |

### 1.6 Solicitante público × Solicitante autenticado

O termo _Solicitante_ cobre dois casos que não são o mesmo ator:

|                | Público                                                        | Autenticado                                                                  |
| -------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Quem é         | pessoa sem conta                                               | conta com sessão; qualquer perfil                                            |
| Perfil         | não existe                                                     | perfil vigente; o perfil `Solicitante` tem as três chaves de autoatendimento |
| Identidade     | e-mail declarado (`X-Requester-Identity` ou query) + protocolo | e-mail da conta, vindo da sessão, + protocolo                                |
| Autorização    | porta pública, sem chave                                       | `request:create`, `request:track` em `own`, `pending_item:respond` em `own`  |
| Abertura       | `POST /requests` sem chave                                     | `POST /requests` com `request:create`                                        |
| Acompanhamento | `GET /requests?email=`, `/:protocol`, `/tracking` sem chave    | as mesmas rotas com `request:track` em `own`                                 |
| Pendências     | leitura e resposta sem chave                                   | `pending_item:respond` em `own`                                              |
| Visão interna  | nenhuma                                                        | só com a chave interna e a custódia                                          |

A porta pública existe apenas porque não há ator: sem sessão, não há perfil nem chave para avaliar, e ela só opera no modo `PUBLIC`. Com sessão, qualquer perfil é um Solicitante **por chaves** — o Administrador que abre uma solicitação vê a própria solicitação exatamente como o perfil Solicitante, não como a porta pública. A sessão decide qual porta o ator usa; o modo de acesso decide se a porta pública é permitida.

O perfil `Solicitante` não é um caso fora do RBAC: ele é a composição de `request:create`, `request:track` e `pending_item:respond`, sem nenhuma chave interna.

### 1.7 Dependências de chave

Três dependências são validadas no servidor. Uma composição que viole qualquer uma delas é recusada, e o editor de perfis bloqueia o grant correspondente.

| Chave que exige           | Dependência               | Por quê                                                                                |
| ------------------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| `*:manage`                | `*:read` da mesma família | quem altera precisa ler o que altera                                                   |
| `request:write`           | `request:read`            | editar o conteúdo interno sem poder ler a solicitação não é uma capability válida      |
| `request:status_override` | `request:status_change`   | o override libera o alvo protegido; a decisão sobre qual solicitação continua na outra |
| `pending_item:respond`    | `request:track`           | a pendência vive dentro de uma solicitação; responder sem acompanhar é agir às cegas   |

As demais combinações não têm dependência: `request:create` é independente — um perfil pode abrir sem acompanhar — e `request:track` sozinho é um Solicitante somente-leitura, que vê a própria solicitação mas não responde pendências. A chave `request:write` também precisa de `request:read`; suas Custódias podem ter alcances diferentes, e a resposta da mutação não revela conteúdo fora da Custódia de leitura.

## 2. Os onze verbos

Toda chave termina em um destes verbos. O verbo é parte do contrato: `export` não é `read`, `track` não é `read`, e `status_override` não é `status_change`.

| Verbo             | Significado                                                     | Exemplos                                   |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `read`            | ler a linha ou a visão administrativa                           | `request:read`, `queue:read`, `theme:read` |
| `write`           | criar ou editar o conteúdo                                      | `request:write`, `triage:write`            |
| `create`          | abrir uma solicitação                                           | `request:create`                           |
| `track`           | acompanhar as próprias solicitações                             | `request:track`                            |
| `assign`          | escolher ou trocar o Responsável                                | `request:assign`                           |
| `status_change`   | mudar o status dentro do fluxo permitido                        | `request:status_change`                    |
| `status_override` | mudar para alvo restrito ou fora do modo da etapa               | `request:status_override`                  |
| `export`          | extrair a fila em arquivo                                       | `queue:export`                             |
| `review`          | validar um lote de pendências                                   | `pending_item:review`                      |
| `respond`         | responder às pendências da própria solicitação                  | `pending_item:respond`                     |
| `manage`          | criar, editar, ativar ou desativar uma entidade ou configuração | `user:manage`, `form:manage`               |

## 3. Catálogo das 39 chaves

A coluna **Custódia** diz se a chave depende da linha. A coluna **O que permite** descreve a capability, não o perfil: quem recebe a chave é decisão da matriz da § 4.

### 3.1 Solicitação

| Chave                     | Recurso | Ação            | Custódia    | O que permite                                                                                                                                                                     |
| ------------------------- | ------- | --------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request:create`          | request | create          | `global`    | Abrir uma solicitação; o autor passa a ser o Solicitante dela e a posse nasce com a linha                                                                                         |
| `request:track`           | request | track           | `custodial` | Acompanhar as próprias solicitações na projeção do Solicitante — nunca a visão interna; custódia fixa em `own`                                                                    |
| `request:read`            | request | read            | `custodial` | Ler a solicitação na visão interna                                                                                                                                                |
| `request:write`           | request | write           | `custodial` | Editar o conteúdo interno da solicitação; exige também `request:read`                                                                                                             |
| `request:assign`          | request | assign          | `custodial` | Atribuir e reatribuir o Responsável                                                                                                                                               |
| `request:status_change`   | request | status_change   | `custodial` | Mudar o status para um alvo permitido pelo fluxo                                                                                                                                  |
| `request:status_override` | request | status_override | `global`    | Mudar o status para alvo restrito ou fora do modo da etapa; também libera a Triagem em Status restrito quando há `triage:write` + Custódia, sem tornar o alvo da Triagem elegível |

### 3.2 Fila e relatórios

| Chave          | Recurso | Ação   | Custódia    | O que permite                              |
| -------------- | ------- | ------ | ----------- | ------------------------------------------ |
| `queue:read`   | queue   | read   | `custodial` | Ler a fila e as métricas dela              |
| `queue:export` | queue   | export | `custodial` | Exportar a fila em CSV                     |
| `reports:read` | reports | read   | `global`    | Ler o dashboard e as métricas consolidadas |

### 3.3 Triagem, mapeamento e priorização

| Chave                  | Recurso        | Ação  | Custódia    | O que permite                                                   |
| ---------------------- | -------------- | ----- | ----------- | --------------------------------------------------------------- |
| `triage:read`          | triage         | read  | `custodial` | Ler a triagem                                                   |
| `triage:write`         | triage         | write | `custodial` | Registrar a triagem                                             |
| `mapping:read`         | mapping        | read  | `custodial` | Ler o mapeamento                                                |
| `mapping:write`        | mapping        | write | `custodial` | Registrar e concluir o mapeamento                               |
| `prioritization:write` | prioritization | write | `custodial` | Registrar a avaliação e ler os critérios necessários ao cálculo |

### 3.4 Colaboração

| Chave                  | Recurso       | Ação    | Custódia    | O que permite                                                                                                                |
| ---------------------- | ------------- | ------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pending_item:read`    | pending_item  | read    | `custodial` | Ler as pendências da solicitação                                                                                             |
| `pending_item:write`   | pending_item  | write   | `custodial` | Abrir um lote de pendências                                                                                                  |
| `pending_item:review`  | pending_item  | review  | `custodial` | Revisar e validar os itens de um lote                                                                                        |
| `pending_item:respond` | pending_item  | respond | `custodial` | Ler e responder às pendências da própria solicitação; inclui anexar arquivos; custódia fixa em `own` e exige `request:track` |
| `internal_note:read`   | internal_note | read    | `custodial` | Ler as notas internas e a linha do tempo                                                                                     |
| `internal_note:write`  | internal_note | write   | `custodial` | Escrever notas internas                                                                                                      |

### 3.5 Auditoria

| Chave        | Recurso | Ação | Custódia    | O que permite                            |
| ------------ | ------- | ---- | ----------- | ---------------------------------------- |
| `audit:read` | audit   | read | `custodial` | Ler a trilha de auditoria da solicitação |

### 3.6 Diretório, contas e perfis

| Chave                     | Recurso            | Ação   | Custódia | O que permite                                                                           |
| ------------------------- | ------------------ | ------ | -------- | --------------------------------------------------------------------------------------- |
| `assignee_directory:read` | assignee_directory | read   | `global` | Ler a lista de usuários ativos que podem receber solicitações                           |
| `user:read`               | user               | read   | `global` | Ler as contas de usuário                                                                |
| `user:manage`             | user               | manage | `global` | Criar, editar, ativar e redefinir a senha de contas, dentro da matriz de contas (§ 4.2) |
| `profile:read`            | profile            | read   | `global` | Ler os perfis e as chaves de cada um                                                    |
| `profile:manage`          | profile            | manage | `global` | Criar, editar, duplicar e desativar perfis e atribuir chaves                            |

### 3.7 Portal

| Chave                          | Recurso               | Ação   | Custódia | O que permite                                                                 |
| ------------------------------ | --------------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `theme:read`                   | theme                 | read   | `global` | Ler o tema e os assets (logo, avatar, login, favicon) na visão administrativa |
| `theme:manage`                 | theme                 | manage | `global` | Alterar o tema e os assets                                                    |
| `category:read`                | category              | read   | `global` | Ler as categorias na visão administrativa                                     |
| `category:manage`              | category              | manage | `global` | Criar, editar, ordenar e ativar categorias                                    |
| `status:read`                  | status                | read   | `global` | Ler os status do ciclo na visão administrativa                                |
| `status:manage`                | status                | manage | `global` | Criar, editar, ordenar e ativar status                                        |
| `portal_setting:read`          | portal_setting        | read   | `global` | Ler o modo de acesso, a identidade e a máscara do protocolo                   |
| `portal_setting:manage`        | portal_setting        | manage | `global` | Alterar o modo de acesso, a identidade e a máscara                            |
| `prioritization_config:read`   | prioritization_config | read   | `global` | Ler os critérios e os pesos da priorização                                    |
| `prioritization_config:manage` | prioritization_config | manage | `global` | Alterar os critérios e os pesos                                               |

### 3.8 Formulário

| Chave         | Recurso | Ação   | Custódia | O que permite                     |
| ------------- | ------- | ------ | -------- | --------------------------------- |
| `form:read`   | form    | read   | `global` | Ler a definição do formulário     |
| `form:manage` | form    | manage | `global` | Alterar a definição do formulário |

**Totais:** 39 chaves em onze verbos. **19 `custodial`** e **20 `global`**.

Detalhes que costumam gerar bug:

- `request:create` é `global` porque a linha ainda não existe; a posse nasce com ela.
- `request:track` é a projeção do Solicitante; `request:read` é a visão interna. Uma não substitui a outra. `request:track` devolve status, reunião e pendências, nunca triagem, prioridade ou notas internas.
- `request:status_override` é `global` porque libera o **alvo protegido**; a solicitação sobre a qual ele incide continua limitada por `request:status_change`. Ele não substitui a outra chave.
- `prioritization:write` é `custodial` para a avaliação, mas inclui a leitura global dos critérios necessários ao cálculo. Quem só lê a configuração usa `prioritization_config:read`; não reutilize `prioritization:write` para isso.
- `request:track` e `pending_item:respond` têm custódia fixa em `own` (dependências na § 1.7). Responder à pendência de outra pessoa é `pending_item:review`; acompanhar a solicitação de outra pessoa é `request:read`. `pending_item:respond` inclui a leitura das próprias pendências, como `prioritization:write` inclui os critérios; não crie uma chave separada de leitura para o Solicitante.
- `assignee_directory:read` não é `user:read`: é o diretório de quem pode receber solicitações — extensão de profissional, flag, predicado e conta ativa —, não a lista de usuários.
- `queue:read` e `queue:export` são a própria Fila e as métricas sobre ela.
- `audit:read` tem uma porta por domínio: `request:read` lê a solicitação; `triage:read`, `mapping:read`, `pending_item:read`, `internal_note:read` e `audit:read` leem as suas.
- `theme` cobre tema e assets. `portal_setting` cobre modo de acesso e identidade (nome da plataforma e máscara do protocolo).

## 4. Perfis base

Os cinco perfis base são semeados com a matriz de referência; exclusão física não existe para nenhum perfil; a desativação segue a regra comum (bloqueada quando há usuários vinculados). O perfil Admin Root é identificado pela marca `is_root`, nunca pelo nome; existe no máximo uma conta com ele, e é o único com proteções próprias. `profile:manage` pode alterar a composição dentro das guardas de [`custom-roles.md`](./custom-roles.md).

```text
Admin Root
   └── Administrador
         └── Visualizador
               └── Analista
Solicitante  (perfil autenticado; ator externo, fora da hierarquia)
```

A hierarquia define **o que cada perfil enxerga**, não herança de permissão: o Visualizador enxerga mais que o Analista e escreve menos. Permissão não se herda por posição.

O perfil de leitura chama-se **Visualizador** — antes, _Gestor_. A renomeação é uma migration no banco, os seeds fazem lookup pelo nome atual e as trilhas de auditoria antigas preservam o nome da época.

Todos os perfis base recebem as três chaves de autoatendimento (`request:create`, `request:track`, `pending_item:respond`). A tabela abaixo destaca o que distingue cada perfil nas áreas internas.

| Perfil            | Pode                                                                                                                                                                       | Não pode                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Solicitante**   | Abrir solicitações, acompanhar as próprias e responder às próprias pendências (as três chaves de autoatendimento)                                                          | Acessar as áreas internas; possuir qualquer chave interna                                                                                                                          |
| **Analista**      | Triar, mapear, priorizar, colaborar e ler as solicitações sob sua custódia; receber designação                                                                             | Ler solicitações fora da custódia; exportar a fila; ler relatórios; gerenciar contas/perfis                                                                                        |
| **Visualizador**  | Ler as áreas internas de qualquer solicitação; escrever nota interna                                                                                                       | Alterar solicitação, status ou responsável; ler os critérios de priorização; configurar o portal                                                                                   |
| **Administrador** | Gerenciar contas de perfis estritamente abaixo do seu — Solicitante, Analista, Visualizador e customs, inclusive os que têm `user:manage`; conteúdo, configuração e perfis | Gerenciar contas de perfis de autoridade igual ou maior; criar ou promover Admin Root                                                                                              |
| **Admin Root**    | Todas as permissões; gerenciar qualquer conta, inclusive de autoridade igual; editar o perfil Admin Root                                                                   | Gerenciar contas com o perfil Admin Root (fora de rota, e única); alterar a designação de perfil da própria conta, o próprio status ou a própria senha pelas rotas administrativas |

### 4.1 A matriz

Legenda: `—` = o perfil não tem a chave; `global` = chave global; `own` = posse; `assigned` = chave custodial sob custódia; `all` = chave custodial sobre qualquer linha. A coluna **Solicitante** é o perfil autenticado; no modo público não há perfil nem coluna.

| #   | Chave                          | Solicitante | Analista | Visualizador | Administrador | Admin Root |
| --- | ------------------------------ | ----------- | -------- | ------------ | ------------- | ---------- |
| 1   | `request:create`               | global      | global   | global       | global        | global     |
| 2   | `request:track`                | own         | own      | own          | own           | own        |
| 3   | `request:read`                 | —           | assigned | all          | all           | all        |
| 4   | `request:write`                | —           | assigned | —            | all           | all        |
| 5   | `request:assign`               | —           | assigned | —            | all           | all        |
| 6   | `request:status_change`        | —           | assigned | —            | all           | all        |
| 7   | `request:status_override`      | —           | —        | —            | global        | global     |
| 8   | `queue:read`                   | —           | assigned | all          | all           | all        |
| 9   | `queue:export`                 | —           | —        | all          | all           | all        |
| 10  | `reports:read`                 | —           | —        | global       | global        | global     |
| 11  | `triage:read`                  | —           | assigned | all          | all           | all        |
| 12  | `triage:write`                 | —           | assigned | —            | all           | all        |
| 13  | `mapping:read`                 | —           | assigned | all          | all           | all        |
| 14  | `mapping:write`                | —           | assigned | —            | all           | all        |
| 15  | `prioritization:write`         | —           | assigned | —            | all           | all        |
| 16  | `pending_item:read`            | —           | assigned | all          | all           | all        |
| 17  | `pending_item:write`           | —           | assigned | —            | all           | all        |
| 18  | `pending_item:review`          | —           | assigned | —            | all           | all        |
| 19  | `pending_item:respond`         | own         | own      | own          | own           | own        |
| 20  | `internal_note:read`           | —           | assigned | all          | all           | all        |
| 21  | `internal_note:write`          | —           | assigned | all          | all           | all        |
| 22  | `audit:read`                   | —           | assigned | all          | all           | all        |
| 23  | `assignee_directory:read`      | —           | global   | global       | global        | global     |
| 24  | `user:read`                    | —           | —        | —            | global        | global     |
| 25  | `user:manage`                  | —           | —        | —            | global        | global     |
| 26  | `profile:read`                 | —           | —        | —            | global        | global     |
| 27  | `profile:manage`               | —           | —        | —            | global        | global     |
| 28  | `theme:read`                   | —           | —        | —            | global        | global     |
| 29  | `theme:manage`                 | —           | —        | —            | global        | global     |
| 30  | `category:read`                | —           | —        | —            | global        | global     |
| 31  | `category:manage`              | —           | —        | —            | global        | global     |
| 32  | `status:read`                  | —           | —        | —            | global        | global     |
| 33  | `status:manage`                | —           | —        | —            | global        | global     |
| 34  | `portal_setting:read`          | —           | —        | —            | global        | global     |
| 35  | `portal_setting:manage`        | —           | —        | —            | global        | global     |
| 36  | `prioritization_config:read`   | —           | —        | —            | global        | global     |
| 37  | `prioritization_config:manage` | —           | —        | —            | global        | global     |
| 38  | `form:read`                    | —           | —        | —            | global        | global     |
| 39  | `form:manage`                  | —           | —        | —            | global        | global     |

**Contagem por perfil**

| Perfil        | Chaves | `custodial` | `global` |
| ------------- | ------ | ----------- | -------- |
| Solicitante   | 3      | 2           | 1        |
| Analista      | 20     | 18          | 2        |
| Visualizador  | 14     | 11          | 3        |
| Administrador | 39     | 19          | 20       |
| Admin Root    | 39     | 19          | 20       |

Todo perfil base recebe `request:track` e `pending_item:respond` em `own`: qualquer usuário autenticado é também um Solicitante. `own` é posse; `assigned` é custódia; autoria nunca vira custódia interna.

### 4.2 Admin Root

O Admin Root é o teto da gestão de contas, identificado pela marca `is_root`, nunca pelo nome. Ele tem as mesmas chaves do Administrador; a diferença não está no conjunto de chaves, e sim nas guardas de conta e de perfil:

- a conta é única: o seed cria apenas se não existir Admin Root, nunca sobrescreve, e nenhuma rota cria, promove, desativa, troca de perfil ou redefine a conta;
- gerencia qualquer conta, inclusive de autoridade igual; contas com o perfil Admin Root ficam fora de rota — e não existe uma segunda;
- é o único que edita o perfil Admin Root, que não perde `profile:manage` nem é desativado;
- não é atribuível: as flags `is_assignable_*` ficam desligadas.

**Matriz de contas, por autoridade:** quem tem `user:manage` gerencia contas de perfis **estritamente abaixo** do seu — todo par chave+vínculo do alvo está contido no conjunto do ator, e os conjuntos são diferentes. A contenção respeita a custódia: `all` contém `assigned`; `assigned` não contém `all`; `own` só igual a `own`. As flags `is_assignable_*` não entram na comparação. Um Administrador não gerencia outro Administrador (igual), mas gerencia um custom com `user:manage` que esteja abaixo. O Admin Root é a exceção: gerencia qualquer conta, inclusive de autoridade igual, exceto contas com o perfil Admin Root. Ninguém gerencia a própria conta pelas rotas administrativas.

Conceder `profile:manage` não é exclusividade do Admin Root: segue a regra comum de escalação — quem a tem pode concedê-la, porque o ator já a possui. As chaves e os vínculos propagam para baixo e nunca excedem o conjunto do concedente. Um Administrador, que tem todas as chaves, pode compor um perfil com todas elas — decisão consciente do modelo, não acidente.

## 5. Como a custódia é resolvida

| Chave                                                                      | Fonte do vínculo                                                                                                                                          |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request:read`, `request:write`, `request:assign`, `request:status_change` | `requests.responsible_id`                                                                                                                                 |
| `triage:read`, `triage:write`                                              | `requests.responsible_id`                                                                                                                                 |
| `mapping:read`, `mapping:write`                                            | Responsável da solicitação **ou** `mappings.professional_id` da linha aberta mais recente; antes de existir uma linha, `requests.mapping_professional_id` |
| `prioritization:write`                                                     | `requests.responsible_id`                                                                                                                                 |
| `pending_item:read`, `pending_item:write`, `pending_item:review`           | `requests.responsible_id`                                                                                                                                 |
| `internal_note:read`, `internal_note:write`                                | `requests.responsible_id`                                                                                                                                 |
| `audit:read`                                                               | `requests.responsible_id`, com uma porta por domínio                                                                                                      |
| `queue:read`, `queue:export`                                               | Responsável da solicitação **ou** do Mapeamento corrente; antes da primeira linha, `requests.mapping_professional_id`; `all` dispensa filtro              |
| `request:track`, `pending_item:respond`                                    | posse: `requests.requester_email` = e-mail da conta do ator (custódia fixa em `own`)                                                                      |
| chaves `global`                                                            | nenhuma verificação de linha                                                                                                                              |

Regras de aplicação:

- A custódia é lida na operação, não no login. O guard relê o usuário e o perfil no banco a cada requisição; desativação, troca de perfil e troca de Responsável valem imediatamente.
- A rota tem o gate grosso: sessão válida e a chave. O serviço do domínio aplica a custódia, em um lugar só por domínio.
- `all` dispensa o filtro de linha. `assigned` compara o Responsável corrente com o ator. `own` compara o e-mail do Solicitante (`requests.requester_email`) com o e-mail da conta.
- Sem sessão, não há ator: a porta pública do modo `PUBLIC` é a única que não avalia chaves. Ela usa o e-mail declarado e o protocolo.
- Snapshots de triagem e de mapeamento não concedem acesso. A linha aberta mais recente do Mapeamento é a fonte vigente; quando ainda não existe linha de Mapeamento, vale a designação inicial da solicitação. Mapeamento concluído é histórico.
- Solicitação órfã não é visível ao Analista custodial; ela é atribuída por quem tem `request:assign` em `all`.

## 6. Atribuir e ser atribuível

`request:assign` é a permissão de escolher ou trocar o Responsável. Ela é `custodial`: o Analista atribui as solicitações que custodía; o Visualizador não atribui; o Administrador e o Admin Root atribuem qualquer uma.

A atribuibilidade é independente:

- **Quem pode atribuir** — `request:assign`.
- **Quem pode ser escolhido** — a flag `is_assignable_triage` ou `is_assignable_mapping` **e** o predicado de chaves de trabalho da § 1.4.
- **Sobre qual solicitação** — a custódia da linha.

Regras de validação do alvo:

- perfil sem a chave de escrita da etapa não pode ser escolhido: a resposta é `400`, não `403` — o ator tem `request:assign`; o alvo é que é inválido;
- usuário inativo ou perfil inativo não é alvo;
- a flag sozinha não basta: o predicado de chaves é revalidado no servidor;
- reatribuir usa a mesma chave e as mesmas validações;
- o Administrador e o Admin Root têm as chaves, mas não são atribuíveis.

Nos perfis base, só o Analista tem as duas flags ligadas.

### 6.1 Extensão de profissional

A extensão de profissional (`details_professional`, 1:1 com a conta) habilita o usuário a ser designado _Responsável_. Ela segue a atribuibilidade, não o nome do perfil:

- nasce na criação de usuário cujo perfil tem `is_assignable_triage` ou `is_assignable_mapping`;
- backfill transacional ao ligar a flag num perfil que já tem usuários ativos;
- backfill transacional ao mover uma conta, via `user:manage`, para um perfil com a flag;
- o diretório de atribuíveis (`assignee_directory:read`) exige extensão, flag, predicado de chaves e conta ativa.

## 7. Mapa rota → chave

O contrato de rotas é a especificação OpenAPI em `src/docs/`; a tabela abaixo
resume o mapeamento de capabilities. O que vale é a chave; a rota pode variar
sem mudar a permissão.

| Rota                                                                                                  | Chave / regra                                                                                            |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `POST /requests`                                                                                      | `request:create` com sessão; sem sessão no modo `PUBLIC`, porta pública sem chave                        |
| `POST /requests/:protocol/public/verify`                                                              | nenhuma; porta pública de verificação de identidade do Solicitante, com rate-limit                       |
| `GET /requests?email=`                                                                                | `request:track` em `own` com sessão; porta pública sem sessão                                            |
| `GET /requests/:protocol`                                                                             | `request:track` em `own` com sessão; porta pública sem sessão                                            |
| `GET /requests/:protocol/tracking`                                                                    | `request:track` em `own` com sessão; porta pública sem sessão                                            |
| `GET /requests/:protocol/internal`                                                                    | `request:read` + custódia; fora dela retorna 404                                                         |
| `PATCH /requests/:protocol/internal`                                                                  | `request:write` + custódia; exige também `request:read`; sem custódia de leitura retorna acknowledgement |
| `PATCH /requests/:protocol/internal/assignee`, `PATCH /requests/:protocol/assignee`                   | `request:assign` + custódia; alvo inválido retorna 400 `assignee_not_assignable`                         |
| `PATCH /requests/:protocol/status`                                                                    | `request:status_change` + custódia; alvo restrito exige `request:status_override` global                 |
| `GET /requests/assignees`, `GET /users/analysts`                                                      | `assignee_directory:read` (diretório por flag e predicado, não por nome de Perfil)                       |
| `GET /queue`, `GET /queue/metrics`                                                                    | `queue:read`                                                                                             |
| `GET /reports/requests.csv`                                                                           | `queue:export`                                                                                           |
| `GET /reports/dashboard`                                                                              | `reports:read`                                                                                           |
| `GET /requests/:protocol/triage`                                                                      | `triage:read` + custódia                                                                                 |
| `POST /requests/:protocol/triage`                                                                     | `triage:write` + custódia                                                                                |
| `GET /queue/requests/:protocol/mapping`                                                               | `mapping:read` + custódia do mapeamento corrente                                                         |
| `PUT /queue/requests/:protocol/mapping`                                                               | `mapping:write` + custódia do mapeamento corrente                                                        |
| `GET /prioritization/criteria`                                                                        | `prioritization:write` (avaliador) ou `prioritization_config:read` (configuração)                        |
| `PUT /prioritization/:protocol/score`                                                                 | `prioritization:write` + custódia                                                                        |
| `GET /requests/:protocol/pending-items`                                                               | `pending_item:respond` em `own` na porta do Solicitante; `pending_item:read` + custódia na porta interna |
| `POST /requests/:protocol/pending-items`                                                              | `pending_item:write` + custódia                                                                          |
| `PATCH /requests/:protocol/pending-items/review`                                                      | `pending_item:review` + custódia                                                                         |
| `PATCH /requests/:protocol/pending-items/:id`                                                         | `pending_item:respond` em `own` com sessão; porta pública sem sessão                                     |
| `POST /requests/:protocol/pending-items/:id/attachments`                                              | `pending_item:respond` em `own` com sessão; porta pública sem sessão                                     |
| `GET /requests/:protocol/internal-notes`                                                              | `internal_note:read` + custódia                                                                          |
| `POST /requests/:protocol/internal-notes`                                                             | `internal_note:write` + custódia                                                                         |
| `PUT /requests/:protocol/internal-notes/read`                                                         | `internal_note:read` + custódia                                                                          |
| `GET /audit-history`, `GET /audit-history/:id`, `GET /audit-logs/:protocol`                           | `audit:read` + custódia                                                                                  |
| `GET /users`, `GET /users/:id`, `GET /users/metrics`                                                  | `user:read`                                                                                              |
| `POST /users`, `PUT /users/:id`, `PATCH /users/:id/status`, `POST /users/:id/reset-password`          | `user:manage` + matriz de contas                                                                         |
| `GET /users/me`, `PUT /users/me`                                                                      | sessão; autoatendimento sem chave                                                                        |
| `GET /profiles`, `GET /profiles/keys`, `GET /profiles/:id`                                            | `profile:read`                                                                                           |
| `POST /profiles`, `PATCH /profiles/:id`, `PATCH /profiles/:id/status`, `POST /profiles/:id/duplicate` | `profile:manage`                                                                                         |
| `GET /portal-config`                                                                                  | nenhuma; projeção pública                                                                                |
| `GET /portal-config/<seção>`                                                                          | `theme:read`, `category:read`, `status:read`, `portal_setting:read` ou `prioritization_config:read`      |
| `PATCH /portal-config/theme`, `/assets`                                                               | `theme:manage`                                                                                           |
| `PATCH /portal-config/categories`                                                                     | `category:manage`                                                                                        |
| `PATCH /portal-config/statuses`                                                                       | `status:manage`                                                                                          |
| `PATCH /portal-config/access`, `/identity`                                                            | `portal_setting:manage`                                                                                  |
| `PATCH /portal-config/prioritization-weights`                                                         | `prioritization_config:manage`                                                                           |
| rotas de formulário                                                                                   | `form:read` / `form:manage`                                                                              |
| `GET /auth/me`                                                                                        | sessão válida, sem chave específica                                                                      |

A leitura administrativa do portal é por seção: a resposta devolve apenas as seções que o ator pode ler. A projeção pública de `GET /portal-config` continua sem chave.

## 8. Contrato de sessão

`GET /auth/me` devolve o perfil e a lista efetiva de permissões. Exemplo parcial para o Analista:

```json
{
  "id": "0f7c...",
  "name": "Ana",
  "email": "ana@empresa.com",
  "avatarUrl": null,
  "role": "Analista",
  "mustChangePassword": false,
  "permissions": [
    { "key": "request:create", "custody": "global" },
    { "key": "request:track", "custody": "own" },
    { "key": "request:read", "custody": "assigned" },
    { "key": "queue:read", "custody": "assigned" },
    { "key": "assignee_directory:read", "custody": "global" }
  ]
}
```

O perfil `Solicitante` devolve exatamente as três chaves de autoatendimento:

```json
{
  "role": "Solicitante",
  "permissions": [
    { "key": "request:create", "custody": "global" },
    { "key": "request:track", "custody": "own" },
    { "key": "pending_item:respond", "custody": "own" }
  ]
}
```

- `role` é o nome do perfil, para exibição.
- `permissions` é a lista efetiva, na ordem do catálogo. Chave ausente significa permissão ausente.
- `custody` usa os valores `global`, `own`, `assigned` e `all`.
- A lista é calculada a partir do perfil vigente a cada requisição; mudanças no perfil valem na requisição seguinte.
- O frontend decide por `has(key)` e pelo vínculo, não pelo nome do perfil. A tela “minhas solicitações” usa `has("request:track")`; a resposta a pendências usa `has("pending_item:respond")`; a abertura usa `has("request:create")`.
- A única porta sem chave é a pública anônima, no modo `PUBLIC`: sem sessão, não há ator para avaliar.

## 9. Invariantes

Estas regras não são expressáveis como chave e continuam no código:

- `request:assign` não decorre de `triage:write`: um perfil pode triar sem distribuir e distribuir sem triar.
- A atribuibilidade exige a flag explícita e o predicado de chaves; ter as chaves não torna o perfil atribuível.
- Autoria estabelece posse; as chaves de posse operam sobre ela e não aceitam outro vínculo (§ 1.3). Autoria não concede `request:read` nem custódia interna.
- A custódia é por linha e é lida a cada operação. Snapshots e token não concedem acesso.
- `request:status_override` libera o alvo protegido em `PATCH /status`; não substitui `request:status_change` nem sua Custódia. Na Triagem, a mesma chave global permite atuar sobre uma solicitação cujo Status atual é restrito, mas não substitui `triage:write` + Custódia nem torna o Status de saída restrito elegível.
- `queue:read` e `queue:export` são a própria Fila do ator; o responsável do mapeamento não a amplia.
- Sem escalação cobre chave e vínculo: o concedente não amplia o que possui (`all` > `assigned`; `own` fixo nas chaves de posse; `profile:manage` incluída).
- Contas, por autoridade (§ 4.2): quem tem `user:manage` gerencia perfis estritamente abaixo; o Admin Root gerencia qualquer conta, inclusive de autoridade igual; contas com o perfil Admin Root ficam fora de rota; ninguém gerencia a própria conta pelas rotas administrativas.
- O Admin Root é único: no máximo uma conta `is_root`, criada só pelo seed; o perfil não perde `profile:manage` nem é desativado, e não é atribuível.
- Snapshots de auditoria guardam o nome do perfil vigente no momento do registro; trilhas antigas continuam exibindo _Gestor_.
- Toda recusa auditável registra a _Tentativa_ com o motivo, sem revelar a existência de recurso que o ator não pode ver.

## 10. LGPD

Como o contrato de acesso trata dados pessoais:

- **Menor privilégio por composição.** Cada perfil recebe só as chaves que precisa, e a custódia limita a linha: menos exposição dos dados do Solicitante.
- **Rastreabilidade.** Toda criação, edição, duplicação e desativação de perfil grava ator, antes e depois; a troca de designação via `user:manage` também.
- **Perfis não guardam dados do titular.** A tabela de perfis tem nome, descrição, flags e chaves; os dados pessoais vivem na conta.
- **Desativação em vez de exclusão.** Perfis não são excluídos fisicamente; a desativação preserva a integridade referencial da trilha. Exclusão e retificação de dados do titular são tratamento da frente de contas, não da de perfis.
- **Diretório mínimo.** `assignee_directory:read` expõe apenas quem pode receber solicitações (§ 6.1), nunca a lista completa de usuários.
- **Porta pública mínima.** O acompanhamento anônimo usa e-mail declarado + protocolo, sem criar conta.
