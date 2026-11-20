# Contexto: Tirador de Pedidos do NEO (MAAT)

Vocabulário do domínio do portal MAAT, que registra e acompanha demandas operacionais. Este glossário descreve **o que os termos significam** — não onde eles ficam no código, nem como são implementados.

**Regra de leitura:** quando um termo aparece aqui em itálico, ele é o termo canônico do domínio. Os sinônimos listados em _Evitar_ não devem ser usados em documentos, conversas de produto, nomes de campo, coluna, constraint ou chave de permissão. Os identificadores técnicos seguem a convenção de nomenclatura em inglês do modelo de dados: são convenção, não vocabulário.

## Solicitação e acompanhamento

**Solicitação**:
O registro submetido por um solicitante para atender uma necessidade operacional, com protocolo próprio e ciclo de vida definido por status.
_Evitar_: pedido, demanda, requisição, ticket, chamado.

**Protocolo**:
Identificador público e curto que permite acompanhar uma solicitação sem expor a identidade interna; é opaco e não é credencial.
_Evitar_: código, referência, número do pedido, id público.

**Máscara**:
Prefixo fixo do protocolo, configurado por portal. Compõe apenas o formato exibido: não acrescenta entropia e não reescreve protocolos já emitidos.
_Evitar_: máscara de formatação, template.

**Solicitante**:
Pessoa que registra uma solicitação e acompanha seu andamento. Pode atuar de forma anônima — a porta pública, sem conta nem perfil — ou autenticada, com uma conta regida pelas chaves `request:create`, `request:track` e `pending_item:respond`. Em ambos os casos, o vínculo com a solicitação é a _Posse_, não a custódia interna.
_Evitar_: cliente, usuário externo, requisitante.

**Anexo**:
Arquivo enviado junto da solicitação, vinculado a ela e disponível para consulta do time interno.
_Evitar_: documento, upload, arquivo.

**Fila**:
Conjunto ordenado de solicitações em aberto, com critérios de ordenação e métricas de acompanhamento.
_Evitar_: lista, caixa de entrada.

**Status**:
Etapa do ciclo de vida de uma solicitação, com visibilidade definida (pública, interna ou restrita). Quando a triagem encerra, o Status em que a solicitação é deixada é o Veredito.
_Evitar_: estado, fase, situação.

**Categoria**:
Classificação ordenável da solicitação. O solicitante a escolhe na abertura — e é ela que define o formulário que ele preenche. A pendência permite que ele a corrija; a triagem pode reclassificar.
_Evitar_: tipo, assunto, label, tema.

**Prioridade**:
Faixa de criticidade atribuída a uma solicitação — Baixa, Média, Alta ou Crítica.
_Evitar_: gravidade, urgência, severidade.

**Classificação**:
Atributo que situa a solicitação no fluxo: Status, Prioridade e Categoria. São atributos da solicitação, nunca perguntas do formulário. Só a Categoria é pedida ao solicitante — e é ela que escolhe o formulário que ele preenche.
_Evitar_: tipo, rótulo, tag.

## Análise e priorização

**Triagem**:
Avaliação inicial que verifica a aderência da solicitação ao escopo e define o caminho de tratamento.
_Evitar_: análise inicial, filtro, qualificação.

**Veredito**:
Desfecho da triagem: o Status em que a triagem deixa a solicitação. Não há lista fixa de vereditos — os Status que podem encerrar uma triagem são os que o Administrador configura para isso.
_Evitar_: resultado da triagem, decisão, status da triagem.

**Mapeamento**:
Sessão de levantamento com as áreas envolvidas na solução, com participantes, responsável designado e registro próprio.
_Evitar_: reunião, call, workshop.

**Análise de viabilidade**:
Etapa em que se avalia a possibilidade técnica e operacional de atender a solicitação já mapeada.
_Evitar_: estudo, benchmarking, viabilidade.

**Priorização**:
Cálculo da prioridade de uma solicitação a partir de critérios ponderados.
_Evitar_: pontuação (é o resultado da priorização), ranking, ordenação.

**Critério**:
Quesito ponderado usado no cálculo da priorização, com peso ajustável.
_Evitar_: requisito, atributo, métrica.

## Formulário

**Formulário**:
Definição de o que uma solicitação pede, composta por blocos e campos. É administrável, e a versão semeada descreve o formulário de abertura de solicitação.
_Evitar_: formulário do legado, intake, requerimento.

**Bloco**:
Seção de um formulário, que agrupa campos sob um mesmo assunto — identificação, demanda, operacional, complementar.
_Evitar_: seção, passo, etapa.

**Campo**:
Pergunta de um bloco de formulário, com tipo, obrigatoriedade e limites. O valor preenchido é a resposta.
_Evitar_: campo do banco, coluna, atributo, input.

## Colaboração

**Pendência**:
Item que impede o avanço de uma solicitação e exige ação do solicitante ou do time. Pode pedir a correção de um campo ou apenas registrar uma observação.
_Evitar_: tarefa, item, bug, recado.

**Nota interna**:
Registro de comunicação interna sobre uma solicitação, visível apenas para o time e integrado à linha do tempo.
_Evitar_: comentário, mensagem, observação (reservado a pendência).

**Linha do tempo**:
Sequência unificada dos acontecimentos de uma solicitação: a auditoria e as notas internas.
_Evitar_: histórico, feed, atividade.

**Auditoria**:
Registro imutável do que foi criado ou alterado no sistema, com autor, momento e valor anterior e novo. O conjunto dos registros de uma solicitação é a _trilha de alteração_.
_Evitar_: log, histórico, trilha de mudanças.

**Tentativa**:
Registro imutável de uma ação que foi recusada — por falta de permissão ou por regra de negócio. Preservado mesmo quando a ação não aconteceu. A _recusa_ é o ato; a _tentativa_ é o registro dele. O conjunto é a _trilha de tentativas_.
_Evitar_: erro, negação, log.

## Acesso

**Permissão**:
Capability nomeada `recurso:ação` — o que um perfil pode fazer, como `triage:write` ou `audit:read`. A permissão é contrato; o perfil é a composição de permissões. Uma permissão nova exige código, não configuração.
_Evitar_: direito, autorização (autorização é o processo), regra.

**Posse**:
Vínculo do _Solicitante_ com a solicitação que ele abriu. Não é custódia interna: nasce ao abrir e autoriza acompanhar e responder à própria solicitação. No código, as chaves `request:track` e `pending_item:respond` valem sobre esse vínculo em `own`; com sessão, a identidade é o e-mail da conta, e sem sessão a porta pública usa o e-mail declarado e o protocolo. As duas chaves têm custódia fixa em `own`, e responder pendência exige `request:track`.
_Evitar_: propriedade, ownership, dono.

**Custódia**:
Vínculo entre um usuário e uma linha que o autoriza a agir sobre ela. Uma permissão é `global` (não depende da linha) ou `custodial` (só vale sobre linhas em custódia). Na matriz, a chave custodial é concedida em `assigned` (Responsável corrente) ou `all` (sem filtro de linha); `own` (posse) é exclusivo de `request:track` e `pending_item:respond`. As fontes são o _Responsável_ corrente (`requests.responsible_id`); para as chaves de mapeamento, o responsável do mapeamento corrente também conta; e, para `request:track` e `pending_item:respond`, o e-mail do Solicitante (`requests.requester_email`). Os snapshots de triagem e de mapeamento não concedem acesso.
_Evitar_: escopo, abrangência, alcance, dono, ownership.

**Atribuibilidade (atribuível)**:
Propriedade do perfil cujos usuários podem ser escolhidos como _Responsável_ e conseguem trabalhar na solicitação. O predicado é derivado das chaves de leitura e escrita da etapa; a participação no pool é uma flag explícita. Não se confunde com `request:assign`, que é a permissão de escolher o Responsável.
_Evitar_: elegível, selecionável, disponível.

**Extensão de profissional**:
Registro 1:1 com a conta que habilita o usuário a ser designado _Responsável_. Segue a _Atribuibilidade_: nasce com a conta de perfil atribuível, é reprocessada ao ligar a flag ou ao mover a conta, e o diretório de atribuíveis exige extensão, flag, predicado e conta ativa.
_Evitar_: cadastro de analista, dados profissionais.

**Perfil**:
Conjunto de permissões atribuído a um usuário. Os cinco perfis base — _Solicitante_, _Analista_, _Visualizador_, _Administrador_ e _Admin Root_ — são semeados com a matriz de referência. O _Solicitante_ base tem as três chaves de autoatendimento (`request:create`, `request:track` e `pending_item:respond`) e nenhuma chave interna. Perfis customizados são compostos das mesmas permissões por quem tem `profile:manage`; o cliente cria perfis, não capabilities. O _Solicitante_ descreve um ator externo e não ocupa a hierarquia interna.
_Evitar_: papel, cargo, função, role.

**Admin Root**:
Perfil raiz do sistema, identificado por `is_root` e único: existe no máximo uma conta com ele, criada apenas pelo seed, sem auto-registro nem promoção pela API e fora das rotas administrativas. Tem todas as permissões, gerencia qualquer conta — inclusive de autoridade igual — e é o único que edita o perfil Admin Root.
_Evitar_: super-admin, root, administrador mestre.

**Responsável**:
Pessoa designada para conduzir a triagem ou o mapeamento de uma solicitação. O vínculo com a solicitação é a _Custódia_; a propriedade do perfil de poder receber essa designação é a _Atribuibilidade_.
_Evitar_: analista (é o perfil, não o vínculo), dono, responsável técnico.

**Modo de acesso**:
Configuração que determina se a abertura de solicitação exige autenticação ou está liberada ao público.
_Evitar_: modo de portal, visibilidade, tipo de acesso.

**Aparência**:
Conjunto de cores e estilos que o portal apresenta. Há mais de uma; duas são vigentes ao mesmo tempo, uma para o slot claro e outra para o slot escuro, e o solicitante escolhe entre as oferecidas.
_Evitar_: tema, theme, skin, paleta.

## Notificações e Eventos

**Notificação**:
Projeção gravada por destinatário na mesma transação de um evento de negócio, permitindo acompanhar atualizações de solicitações de forma síncrona ou em tempo real.
_Evitar_: alerta, aviso, push, pop-up.

**Evento**:
Fato de negócio imutável que desencadeia reações e notificações no sistema, validado estruturalmente por contrato.
_Evitar_: mensagem, trigger, ação.

**Payload**:
Conteúdo restrito associado a um Evento ou Notificação, limitado à Allowlist para omitir dados confidenciais ou técnicos.
_Evitar_: body, dados completos, json bruto.

**Allowlist**:
Lista fechada de campos permitidos em um Payload, garantindo que o destinatário receba apenas ponteiros e informações públicas essenciais.
_Evitar_: whitelist, lista permitida.

**Destinatário**:
Usuário que recebe uma Notificação (na v1, vinculado ao `requester_user_id` da solicitação).
_Evitar_: usuário notificado, receptor.

**Canal**:
Mecanismo de entrega de Notificações (na v1, canal in-app; preparado para e-mail no RF31).
_Evitar_: meio, adaptador de envio.

**Stream**:
Canal contínuo de entrega de Notificações em tempo real via Server-Sent Events (SSE).
_Evitar_: websocket, conexão aberta, canal ao vivo.
