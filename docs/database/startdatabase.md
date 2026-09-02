# Documentação da Modelagem de Banco de Dados

## 1. Visão geral

O banco de dados foi modelado para gerenciar um processo de **solicitação, análise, priorização e acompanhamento de demandas**.

O fluxo principal é:

1. Um **solicitante** registra uma nova solicitação.
2. A solicitação é vinculada a uma **categoria**.
3. Podem ser inseridos **anexos** e registros de **histórico**.
4. A solicitação passa por uma etapa de **análise de viabilidade**.
5. É realizada a **priorização**, considerando critérios como risco, urgência, impacto operacional e esforço.
6. Um responsável pode ser associado à solicitação e registrar movimentações no histórico.

---

## 2. Entidades do modelo


| Tabela                | Finalidade                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `solicitante`         | Armazena os dados das pessoas que abrem solicitações e/ou atuam como responsáveis.          |
| `categoria`           | Mantém as categorias disponíveis para classificação das solicitações.                    |
| `solicitacao`         | Tabela central do modelo, contendo os dados da demanda solicitada.                             |
| `priorizacao`         | Registra os critérios utilizados para priorizar uma solicitação.                            |
| `analise_viabilidade` | Armazena informações relacionadas à análise de viabilidade e ao agendamento de mapeamento. |
| `anexo`               | Armazena metadados de arquivos anexados às solicitações.                                    |
| `historico_log`       | Registra eventos, ações e alterações realizadas em uma solicitação.                      |

---

# 3. Dicionário de Dados

## 3.1. Tabela `solicitante`

Armazena os usuários envolvidos no processo, especialmente os responsáveis pela abertura das solicitações.


| Campo               | Tipo             | Descrição                                                          |
| ------------------- | ---------------- | -------------------------------------------------------------------- |
| `id`                | `serial`         | Identificador único do solicitante. Chave primária.                |
| `nome_completo`     | `varchar(255)`   | Nome completo do solicitante.                                        |
| `email_corporativo` | `varchar(255)`   | E-mail corporativo do solicitante. Recomenda-se unicidade.           |
| `area_solicitante`  | `varchar(100)`   | Área organizacional à qual o solicitante pertence.                 |
| `departamento`      | `varchar(100)`   | Departamento do solicitante.                                         |
| `nome_gestor`       | `varchar(255)`   | Nome do gestor responsável pelo solicitante.                        |
| `contato_adicional` | `varchar(255)`   | Canal alternativo de contato, como telefone, Teams ou outro e-mail.  |
| `perfil`            | `perfil_usuario` | Perfil de acesso do usuário no sistema. Tipo enumerado ou domínio. |
| `criado_em`         | `timestamp`      | Data e hora de criação do cadastro.                                |
| `atualizado_em`     | `timestamp`      | Data e hora da última atualização do cadastro.                    |

### Observações

- O campo `perfil` sugere a existência de um tipo customizado chamado `perfil_usuario`.
- É recomendável que `email_corporativo` possua uma restrição `UNIQUE`.
- Esta tabela é utilizada tanto para identificar o autor da solicitação quanto o responsável por seu tratamento.

---

## 3.2. Tabela `categoria`

Responsável pela classificação das solicitações.


| Campo   | Tipo           | Descrição                                                |
| ------- | -------------- | ---------------------------------------------------------- |
| `id`    | `serial`       | Identificador único da categoria. Chave primária.        |
| `nome`  | `varchar(100)` | Nome da categoria.                                         |
| `ativo` | `boolean`      | Indica se a categoria está disponível para utilização. |

### Regras sugeridas

- Categorias inativas não devem ser disponibilizadas para novas solicitações.
- Recomenda-se uma restrição de unicidade para o campo `nome`.

Exemplos de categorias:

- Automação de processos;
- Melhoria de processo;
- Integração de sistemas;
- Relatórios;
- Ajuste operacional;
- Análise de dados.

---

## 3.3. Tabela `solicitacao`

É a principal tabela do modelo. Contém os dados da solicitação registrada pelo usuário.


| Campo                             | Tipo                     | Descrição                                                                                         |
| --------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| `id`                              | `serial`                 | Identificador único da solicitação. Chave primária.                                             |
| `protocolo`                       | `varchar(20)`            | Código identificador da solicitação para consulta e rastreabilidade.                             |
| `solicitante_id`                  | `integer`                | Identificador do solicitante que abriu a demanda. Chave estrangeira para`solicitante.id`.           |
| `categoria_id`                    | `integer`                | Categoria da solicitação. Chave estrangeira para`categoria.id`.                                   |
| `nome_processo_atual`             | `varchar(255)`           | Nome do processo atual relacionado à solicitação.                                                |
| `titulo_resumido`                 | `varchar(255)`           | Título curto e objetivo da solicitação.                                                          |
| `descricao_necessidade`           | `text`                   | Descrição detalhada da necessidade ou problema identificado.                                      |
| `justificativa_resultado`         | `text`                   | Justificativa da solicitação e resultados esperados.                                              |
| `volumetria_aproximada_mensal`    | `varchar(100)`           | Estimativa mensal de volume de atividades, transações ou demandas envolvidas.                     |
| `tempo_medio_execucao_item`       | `varchar(100)`           | Tempo médio atual necessário para execução de uma unidade do processo.                          |
| `impacto_operacional_percebido`   | `text`                   | Descrição do impacto operacional gerado pelo problema ou oportunidade.                            |
| `prazo_desejado`                  | `date`                   | Data desejada para conclusão ou disponibilização da solução.                                   |
| `preferencia_horarios_mapeamento` | `text`                   | Preferências de horário para reuniões de levantamento ou mapeamento.                             |
| `prioridade`                      | `prioridade_solicitacao` | Nível de prioridade da solicitação. Tipo enumerado ou domínio.                                  |
| `status`                          | `status_solicitacao`     | Situação atual da solicitação no fluxo. Tipo enumerado ou domínio.                             |
| `responsavel_id`                  | `integer`                | Usuário responsável pelo acompanhamento da solicitação. Chave estrangeira para`solicitante.id`. |
| `score_total`                     | `integer`                | Pontuação consolidada da priorização da solicitação.                                          |
| `data_abertura`                   | `timestamp`              | Data e hora de abertura da solicitação.                                                           |
| `ultima_atualizacao`              | `timestamp`              | Data e hora da última modificação da solicitação.                                              |

### Relacionamentos

- Uma solicitação possui um solicitante.
- Uma solicitação pertence a uma categoria.
- Uma solicitação pode possuir um responsável.
- Uma solicitação pode possuir diversos anexos.
- Uma solicitação pode possuir diversos registros de histórico.
- Uma solicitação pode possuir análise de viabilidade.
- Uma solicitação pode possuir dados de priorização.

### Regras de negócio sugeridas

1. O campo `protocolo` deve ser único.
2. O campo `data_abertura` deve ser preenchido automaticamente na criação.
3. O campo `ultima_atualizacao` deve ser atualizado a cada alteração.
4. O campo `responsavel_id` pode ser nulo enquanto a solicitação ainda não tiver sido atribuída.
5. O campo `score_total` pode ser calculado automaticamente a partir dos critérios da tabela `priorizacao`.
6. O prazo desejado não deve ser anterior à data de abertura da solicitação.

---

## 3.4. Tabela `priorizacao`

Armazena os critérios utilizados para avaliar e ordenar as solicitações.


| Campo                 | Tipo      | Descrição                                                                                           |
| --------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `id`                  | `serial`  | Identificador único do registro de priorização. Chave primária.                                   |
| `solicitacao_id`      | `integer` | Solicitação avaliada. Chave estrangeira para`solicitacao.id`.                                       |
| `risco`               | `integer` | Grau de risco associado à solicitação ou ao processo atual.                                        |
| `urgencia`            | `integer` | Grau de urgência da demanda.                                                                         |
| `rv_...`              | `integer` | Critério adicional de avaliação identificado no modelo. O nome deve ser validado no banco físico. |
| `impacto_operacional` | `integer` | Pontuação referente ao impacto operacional da solicitação.                                        |
| `esforco`             | `integer` | Pontuação referente ao esforço estimado para implementação.                                      |

> Observação: o nome exato do terceiro critério de priorização não está totalmente legível no diagrama. Recomenda-se confirmar a nomenclatura diretamente no script SQL ou no banco de dados.

### Exemplo de critérios de avaliação

Uma escala possível seria de `1` a `5`:


| Critério             | Valor baixo    | Valor alto                            |
| --------------------- | -------------- | ------------------------------------- |
| `risco`               | Baixo risco    | Alto risco                            |
| `urgencia`            | Pode aguardar  | Necessita tratamento imediato         |
| `impacto_operacional` | Baixo impacto  | Alto impacto no negócio              |
| `esforco`             | Baixo esforço | Alto esforço técnico ou operacional |

### Regras recomendadas

- Validar os valores dentro de uma escala definida, por exemplo entre `1` e `5`.
- Caso exista apenas uma priorização por solicitação, criar uma restrição `UNIQUE (solicitacao_id)`.
- O campo `score_total` da tabela `solicitacao` pode ser calculado usando uma fórmula de pontuação.

Exemplo conceitual:

```text
score_total = risco + urgencia + impacto_operacional - esforco
```

A fórmula definitiva deve ser definida conforme a estratégia de priorização da organização.

---

## 3.5. Tabela `analise_viabilidade`

Armazena o resultado e os detalhes da etapa de viabilidade da solicitação.


| Campo                      | Tipo                 | Descrição                                                                                                     |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `id`                       | `serial`             | Identificador único da análise. Chave primária.                                                              |
| `solicitacao_id`           | `integer`            | Solicitação analisada. Chave estrangeira para`solicitacao.id`.                                                |
| `status_atual`             | `status_solicitacao` | Status da solicitação no contexto da análise de viabilidade.                                                 |
| `agendar_mapeamento_na...` | `timestamp`          | Data e hora prevista para o mapeamento ou reunião de levantamento. O nome completo deve ser validado no banco. |
| `link_reuniao`             | `varchar(500)`       | Link para reunião de análise ou mapeamento.                                                                   |
| `observacoes`              | `text`               | Observações, conclusões e orientações resultantes da análise.                                             |
| `criado_em`                | `timestamp`          | Data e hora de criação da análise.                                                                           |
| `atualizado_em`            | `timestamp`          | Data e hora da última atualização da análise.                                                               |

### Regras de negócio sugeridas

- Uma solicitação deveria possuir apenas uma análise de viabilidade ativa.
- Caso este seja o comportamento esperado, recomenda-se `UNIQUE (solicitacao_id)`.
- O campo de agendamento deve ser preenchido quando a análise demandar reunião de mapeamento.
- O `status_atual` deve estar sincronizado com o status principal da tabela `solicitacao`, caso ambos representem o mesmo estado do processo.

---

## 3.6. Tabela `anexo`

Armazena informações sobre arquivos vinculados a solicitações.


| Campo            | Tipo           | Descrição                                                                              |
| ---------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `id`             | `serial`       | Identificador único do anexo. Chave primária.                                          |
| `solicitacao_id` | `integer`      | Solicitação à qual o arquivo está vinculado. Chave estrangeira para`solicitacao.id`. |
| `nome_arquivo`   | `varchar(255)` | Nome original do arquivo enviado.                                                        |
| `caminho`        | `varchar(500)` | Caminho, URL ou identificador do local em que o arquivo foi armazenado.                  |
| `tipo`           | `varchar(100)` | Tipo ou extensão do arquivo, por exemplo`application/pdf` ou `.xlsx`.                   |
| `tamanho_bytes`  | `bigint`       | Tamanho do arquivo em bytes.                                                             |
| `uploaded_em`    | `timestamp`    | Data e hora do envio do arquivo.                                                         |

### Regras sugeridas

- Validar tipos de arquivo permitidos.
- Definir limite máximo para `tamanho_bytes`.
- O arquivo físico não deve necessariamente ser armazenado no banco; o campo `caminho` permite apontar para armazenamento externo, como S3, Azure Blob, Google Cloud Storage ou servidor interno.
- Ao excluir uma solicitação, os anexos associados devem ser tratados conforme a política de retenção da organização.

---

## 3.7. Tabela `historico_log`

Registra eventos e movimentações ocorridas durante o ciclo de vida da solicitação.


| Campo            | Tipo           | Descrição                                                                                                                 |
| ---------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `bigserial`    | Identificador único do log. Chave primária.                                                                               |
| `solicitacao_id` | `integer`      | Solicitação relacionada ao evento. Chave estrangeira para`solicitacao.id`.                                                |
| `acao`           | `varchar(255)` | Tipo de ação registrada, como criação, alteração de status, atribuição de responsável ou inclusão de comentário. |
| `responsavel_id` | `integer`      | Usuário responsável pela ação registrada. Chave estrangeira para`solicitante.id`.                                       |
| `descricao`      | `text`         | Descrição detalhada da movimentação.                                                                                    |
| `criado_em`      | `timestamp`    | Data e hora de ocorrência do evento.                                                                                       |

### Exemplos de ações para o campo `acao`

- `SOLICITACAO_CRIADA`
- `STATUS_ALTERADO`
- `RESPONSAVEL_ATRIBUIDO`
- `ANEXO_ADICIONADO`
- `ANALISE_INICIADA`
- `MAPEAMENTO_AGENDADO`
- `PRIORIZACAO_REALIZADA`
- `SOLICITACAO_APROVADA`
- `SOLICITACAO_REJEITADA`
- `SOLICITACAO_CONCLUIDA`

### Observações

- O histórico deve ser tratado como uma tabela de auditoria.
- Registros de log normalmente não devem ser alterados ou excluídos.
- O uso de `bigserial` é adequado, pois tabelas de histórico tendem a crescer significativamente ao longo do tempo.

---

# 4. Relacionamentos

## 4.1. Relacionamentos principais


| Origem        | Cardinalidade | Destino               | Descrição                                                                                             |
| ------------- | ------------: | --------------------- | ------------------------------------------------------------------------------------------------------- |
| `solicitante` |           1:N | `solicitacao`         | Um solicitante pode abrir várias solicitações.                                                       |
| `categoria`   |           1:N | `solicitacao`         | Uma categoria pode estar associada a várias solicitações.                                            |
| `solicitante` |           1:N | `solicitacao`         | Um responsável pode acompanhar várias solicitações.                                                 |
| `solicitacao` |           1:N | `anexo`               | Uma solicitação pode conter vários anexos.                                                           |
| `solicitacao` |           1:N | `historico_log`       | Uma solicitação pode possuir vários eventos no histórico.                                           |
| `solicitante` |           1:N | `historico_log`       | Um usuário pode registrar várias ações no histórico.                                               |
| `solicitacao` |    1:1 ou 1:N | `priorizacao`         | Uma solicitação pode possuir uma ou mais avaliações de priorização, conforme a regra do negócio. |
| `solicitacao` |    1:1 ou 1:N | `analise_viabilidade` | Uma solicitação pode possuir uma análise ativa ou várias análises ao longo do tempo.               |

---

## 4.2. Chaves estrangeiras esperadas

```sql
ALTER TABLE solicitacao
    ADD CONSTRAINT fk_solicitacao_solicitante
    FOREIGN KEY (solicitante_id)
    REFERENCES solicitante(id);

ALTER TABLE solicitacao
    ADD CONSTRAINT fk_solicitacao_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categoria(id);

ALTER TABLE solicitacao
    ADD CONSTRAINT fk_solicitacao_responsavel
    FOREIGN KEY (responsavel_id)
    REFERENCES solicitante(id);

ALTER TABLE priorizacao
    ADD CONSTRAINT fk_priorizacao_solicitacao
    FOREIGN KEY (solicitacao_id)
    REFERENCES solicitacao(id);

ALTER TABLE analise_viabilidade
    ADD CONSTRAINT fk_analise_viabilidade_solicitacao
    FOREIGN KEY (solicitacao_id)
    REFERENCES solicitacao(id);

ALTER TABLE anexo
    ADD CONSTRAINT fk_anexo_solicitacao
    FOREIGN KEY (solicitacao_id)
    REFERENCES solicitacao(id);

ALTER TABLE historico_log
    ADD CONSTRAINT fk_historico_solicitacao
    FOREIGN KEY (solicitacao_id)
    REFERENCES solicitacao(id);

ALTER TABLE historico_log
    ADD CONSTRAINT fk_historico_responsavel
    FOREIGN KEY (responsavel_id)
    REFERENCES solicitante(id);
```

---

# 5. Fluxo de Status Sugerido

O campo `status`, presente em `solicitacao`, utiliza o tipo `status_solicitacao`. Uma possível definição de fluxo seria:

```text
RASCUNHO
    ↓
ABERTA
    ↓
EM_TRIAGEM
    ↓
EM_ANALISE_DE_VIABILIDADE
    ↓
AGUARDANDO_MAPEAMENTO
    ↓
EM_PRIORIZACAO
    ↓
APROVADA
    ↓
EM_DESENVOLVIMENTO
    ↓
CONCLUIDA
```

Status alternativos:

```text
CANCELADA
REJEITADA
AGUARDANDO_INFORMACOES
SUSPENSA
```

---

# 6. Fluxo Operacional da Solicitação

## Etapa 1 — Abertura

O solicitante registra os dados básicos da demanda:

- Processo atual;
- Título;
- Descrição da necessidade;
- Justificativa;
- Volume mensal;
- Tempo médio atual;
- Impacto operacional;
- Prazo desejado;
- Categoria;
- Prioridade inicial;
- Anexos.

Nesta etapa, a solicitação recebe um protocolo e entra com status `ABERTA`.

---

## Etapa 2 — Triagem

Um responsável avalia se a solicitação possui informações suficientes.

Possíveis ações:

- Atribuir responsável;
- Solicitar complementação de dados;
- Corrigir categoria;
- Atualizar prioridade;
- Incluir comentários no histórico.

---

## Etapa 3 — Análise de Viabilidade

A equipe responsável avalia:

- Viabilidade técnica;
- Impacto no processo;
- Dependências;
- Sistemas envolvidos;
- Necessidade de reunião de mapeamento;
- Estimativa inicial de esforço.

Os resultados são registrados em `analise_viabilidade`.

---

## Etapa 4 — Priorização

A solicitação recebe pontuações para critérios como:

- Risco;
- Urgência;
- Impacto operacional;
- Esforço;
- Critério adicional definido pela área.

O resultado consolidado pode ser salvo no campo `solicitacao.score_total`.

---

## Etapa 5 — Execução ou Encerramento

Após análise e priorização, a solicitação pode seguir para:

- Aprovação;
- Desenvolvimento;
- Implementação;
- Conclusão;
- Rejeição;
- Cancelamento.

Todas as alterações devem ser registradas em `historico_log`.

---

# 7. Recomendações Técnicas

## 7.1. Índices recomendados

```sql
CREATE UNIQUE INDEX uq_solicitacao_protocolo
    ON solicitacao(protocolo);

CREATE UNIQUE INDEX uq_solicitante_email
    ON solicitante(email_corporativo);

CREATE INDEX idx_solicitacao_status
    ON solicitacao(status);

CREATE INDEX idx_solicitacao_categoria
    ON solicitacao(categoria_id);

CREATE INDEX idx_solicitacao_solicitante
    ON solicitacao(solicitante_id);

CREATE INDEX idx_solicitacao_responsavel
    ON solicitacao(responsavel_id);

CREATE INDEX idx_historico_solicitacao
    ON historico_log(solicitacao_id);

CREATE INDEX idx_anexo_solicitacao
    ON anexo(solicitacao_id);

CREATE INDEX idx_priorizacao_solicitacao
    ON priorizacao(solicitacao_id);

CREATE INDEX idx_viabilidade_solicitacao
    ON analise_viabilidade(solicitacao_id);
```

---

## 7.2. Regras de exclusão recomendadas


| Relacionamento                         | Estratégia sugerida                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `solicitacao` → `anexo`               | `ON DELETE CASCADE` ou exclusão lógica, conforme política de arquivos.         |
| `solicitacao` → `historico_log`       | Preferencialmente`ON DELETE RESTRICT`, para preservar auditoria.                  |
| `solicitacao` → `priorizacao`         | `ON DELETE CASCADE`, caso a priorização não faça sentido sem a solicitação. |
| `solicitacao` → `analise_viabilidade` | `ON DELETE CASCADE` ou `RESTRICT`, conforme necessidade de auditoria.             |
| `solicitante` → `solicitacao`         | `ON DELETE RESTRICT`, evitando apagar usuários vinculados a solicitações.      |
| `categoria` → `solicitacao`           | `ON DELETE RESTRICT`, evitando remoção de categorias em uso.                    |

---

## 7.3. Melhorias possíveis no modelo

1. **Separar usuário de solicitante**
   Caso existam autenticação, permissões e diferentes perfis de acesso, pode ser útil renomear `solicitante` para `usuario` ou criar uma tabela específica de usuários.
2. **Normalizar gestores e departamentos**
   Os campos `nome_gestor`, `area_solicitante` e `departamento` podem futuramente ser normalizados em tabelas próprias.
3. **Criar tabela de comentários**
   Se houver necessidade de conversas entre solicitante e analistas, uma tabela `comentario_solicitacao` pode ser mais apropriada do que concentrar todas as interações no histórico.
4. **Adicionar campos de auditoria completos**Em tabelas críticas, pode ser útil incluir:

   - `criado_por`;
   - `atualizado_por`;
   - `excluido_em`;
   - `excluido_por`.
5. **Aplicar exclusão lógica**
   Para preservar histórico, pode ser interessante utilizar campos como:

   ```sql
   ativo boolean
   ```

   ou:

   ```sql
   excluido_em timestamp
   ```
6. **Definir claramente os tipos enumerados**
   Os tipos `perfil_usuario`, `prioridade_solicitacao` e `status_solicitacao` precisam ter valores documentados e controlados.

---

# 8. Resumo do Modelo

A estrutura está organizada em torno da tabela `solicitacao`, que concentra a demanda principal e se relaciona com:

- quem solicitou;
- qual categoria foi selecionada;
- quem é responsável;
- como a solicitação foi priorizada;
- qual foi a análise de viabilidade;
- quais arquivos foram anexados;
- quais ações ocorreram durante o processo.

Esse modelo permite rastreabilidade completa da solicitação desde a abertura até seu encerramento, oferecendo suporte para análise operacional, priorização de demandas e auditoria de movimentações.
