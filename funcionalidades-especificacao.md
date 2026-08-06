# Serviços do Backend — Tirador de Pedidos do NEO

## SOLICITCOES

### Cadastrar solicitação
Cria uma nova solicitação por meio do formulário, valida os campos obrigatórios, gera o protocolo e insere o pedido na fila.

- `POST /requests`
  ```json
  {
    "solicitante": {
      "nome": "Maria Oliveira",
      "email": "maria.oliveira@instituicao.gov.br",
      "area": "Recursos Humanos",
      "departamento": "Folha de Pagamento",
      "gestor": "João Santos",
      "contatoAdicional": "(11) 99999-0000"
    },
    "demanda": {
      "processo": "Pagamento de diárias",
      "titulo": "Automatizar conferência de diárias",
      "tipo": "Melhoria de processo",
      "categoria": "Automação",
      "descricao": "Descrição da necessidade...",
      "problema": "Conferência manual e demorada",
      "resultadoEsperado": "Redução de tempo...",
      "justificativa": "..."
    },
    "operacional": {
      "etapas": "...",
      "sistemas": "SIAFI",
      "frequencia": "Diária",
      "volumetria": 500,
      "pessoasEnvolvidas": 3,
      "tempoMedioExecucao": "2h",
      "controlesManuais": true,
      "riscos": "...",
      "impactoCliente": "...",
      "prazoDesejado": "2026-09-30",
      "criticidade": "Alta"
    },
    "complementar": {
      "possuiDocumentacao": true,
      "dependenciaOutrasAreas": "Sim (TI)",
      "tratamentoRestrito": false,
      "observacoes": "..."
    },
    "preferenciasHorario": ["08:00", "10:00", "14:00"]
  }
  ```

### Listar solicitações
Lista todas as solicitações cadastradas com filtros e paginação.

- `GET /requests`
- Query: `?status=&prioridade=&categoria=`

### Consultar solicitação por protocolo(para adms)
Busca uma solicitação pelo número do protocolo.

- `GET /requests/:protocol`

### Acompanhar solicitação publicamente
Consulta a solicitação pelo protocolo e e-mail do solicitante (acompanhamento público sem autenticação).

- `GET /requests/:protocol?email=maria@instituicao.gov.br`

### Editar solicitação
Atualiza/complementa informações da solicitação.

- `PUT /requests/:protocol`
- Body: campos parciais dos blocos do cadastro (ex.: `{ "complementar": { "observacoes": "..." } }`)

## FILA

### Listar fila centralizada
Lista a fila com as informações de cada pedido (protocolo, data de entrada, processo, área, categoria, prioridade, criticidade, status, responsável, previsão de mapeamento e última atualização), com filtros, ordenação e paginação.

- `GET /queue`

## Status e triagem

### Alterar status
Altera o status do pedido registrando status anterior, novo status, data/hora, usuário responsável e justificativa quando aplicável.

- `PUT /triage/:protocol/status`
  ```json
  { 
    "status": "Pendente de informações", 
    "justificativa": "Aguardando dados de volumetria" 
  }
  ```

### Registrar resultado da triagem
Registra o resultado da triagem (elegível, pendente, fora do escopo, direcionada, duplicada, cancelada ou backlog). A justificativa é obrigatória quando não elegível.

- `PUT /triage/:protocol/eligibility`
  ```json
  {
    "resultado": "Não elegível",
    "justificativa": "Fora do escopo do NEO"
  }
  ```

### Registrar pendência
Registra pendência de informações destinadas ao solicitante.

- `POST /triage/:protocol/pendencies` (planejado na especificação)
  ```json
  { "pendencia": "Solicitar documentação do processo", "destino": "solicitante" }
  ```

## Priorização

### Listar critérios de priorização
Lista os 10 critérios de priorização (impacto operacional, risco, urgência, volumetria, esforço manual, impacto no cliente, prazo regulatório, áreas impactadas, alinhamento estratégico e complexidade estimada), cada um com nota de 1 a 5.

- `GET /prioritization/criteria`

### Registrar notas de priorização
Registra as notas por critério, calcula a pontuação final (por pesos configuráveis ou manual) e classifica em baixa, média, alta ou crítica. Exige motivo quando a prioridade é ajustada manualmente.

- `PUT /prioritization/:protocol/score`
  ```json
  {
    "notas": { "impactoOperacional": 4, "risco": 3, "urgencia": 5, "volumetria": 2, "esforcoManual": 3, "impactoCliente": 4, "prazoRegulatorio": 5, "areasImpactadas": 2, "alinhamentoEstrategico": 4, "complexidade": 3 },
    "pesos": { "impactoOperacional": 2, "urgencia": 3 },
    "justificativa": "nota explicativa"
  }
  ```

## Responsáveis

### Atribuir responsável
Atribui manualmente o responsável pelo mapeamento à solicitação, mantendo o histórico (substituição também é registrada).

- `POST /assignees/:protocol/assign`

### Ver histórico de atribuições
Retorna o histórico de atribuições de responsável de um protocolo.

- `GET /assignees/:protocol/history`

## Mapeamento

### Agendar mapeamento
Registra manualmente o agendamento do mapeamento com responsável, data, horário, duração, modalidade, link, local, participantes, observações e status de confirmação.

- `POST /mapping/:protocol/schedule`
  ```json
  {
    "responsavel": "João Ferreira",
    "data": "2026-08-10",
    "horario": "10:00",
    "duracao": "60min",
    "modalidade": "presencial",
    "link": "https://...",
    "local": "Sala NEO",
    "participantes": ["Maria Oliveira"],
    "observacoes": "...",
    "confirmado": true
  }
  ```

### Atualizar mapeamento/reunião
Atualiza os dados do mapeamento ou reunião registrada.

- `PUT /mapping/:protocol/meeting`
- Body: campos parciais do agendamento

## COMUNICACAO

### Listar modelos de texto
Lista os 7 modelos de texto prontos para comunicação manual (confirmação de recebimento, solicitação de informação complementar, confirmação de agendamento, não elegibilidade, direcionamento, atualização de status e encerramento).

- `GET /settings/templates`

## AUDITORIA

### Ver histórico de auditoria
Retorna o histórico de auditoria de um protocolo (eventos de criação, status, prioridade, atribuição, substituição, mapeamento, pendência, conclusão e cancelamento, com usuário, data/hora, valor anterior e novo valor).

- `GET /audit/:protocol`

## INDICADORES

### Consultar dashboard
Retorna o painel resumido de indicadores com filtro por período: total de solicitações, por status, categoria, área, prioridade, responsável, sem responsável, pendentes, fora do prazo, concluídas, elegíveis/não elegíveis e tempos de atendimento (abertura → triagem, abertura → mapeamento).

- `GET /reports/dashboard`
- Query: `?periodo=&de=&ate=&setor=`

## Exportação

### Exportar dados
Exporta a fila e os principais dados em Excel ou CSV, respeitando os filtros aplicados e incluindo os campos mínimos (protocolo, data de abertura, área, processo, categoria, status, prioridade, responsável, mapeamento, última atualização, resultado da triagem e data de conclusão). Restrito a usuários autorizados.

- `GET /reports/export`


## Configurações

### Listar categorias
Lista as categorias cadastradas.

- `GET /settings/categories`

### Listar categorias ativas
Lista somente as categorias ativas, para uso no formulário de solicitação.

- `GET /settings/categories/active`

### Cadastrar categoria
Cadastra uma nova categoria (o administrador pode ativar ou desativar categorias sem alterar código).

- `POST /settings/categories`
  ```json
  { "nome": "Análise de dados", "ativa": true }
  ```

## Usuários e autenticação

### Registrar usuário
Cria uma conta de usuário e retorna o token de autenticação.

- `POST /auth/register`
  ```json
  { "name": "Maria Oliveira", "email": "maria@instituicao.gov.br", "password": "123456" }
  ```

### Fazer login
Autentica o usuário e retorna os dados do usuário e o token.

- `POST /auth/login`
  ```json
  { "email": "maria@instituicao.gov.br", "password": "123456" }
  ```

### Criar usuário
Cria um usuário pelo administrador.

- `POST /users`
  ```json
  { "name": "João Santos", "email": "joao@instituicao.gov.br", "password": "123456" }
  ```

### Listar usuários
Lista todos os usuários cadastrados.

- `GET /users`

### Buscar usuário por id
Consulta um usuário pelo seu id.

- `GET /users/:id`

### Atualizar usuário
Atualiza os dados de um usuário (nome, e-mail ou senha).

- `PUT /users/:id`
- Body: `{ "name": "...", "email": "...", "password": "..." }` (campos parciais)

### Atualizar perfil do usuário
Atualiza o perfil/permissões do usuário (solicitante, analista, administrador ou gestor).

- `PUT /users/:id/profile`
  ```json
  { "perfil": "analista" }
  ```

### Excluir usuário
Remove um usuário do sistema.

- `DELETE /users/:id`
