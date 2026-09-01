# Modelo de Dados — Sistema NEO

## Diagrama Entidade-Relacionamento (Mermaid)

```mermaid
erDiagram
    solicitante ||--o{ solicitacao : "cria"
    solicitante ||--o{ solicitacao : "é responsável por"
    solicitacao ||--|| analise_viabilidade : "possui"
    solicitacao ||--|| priorizacao : "tem"
    solicitacao ||--o{ historico_log : "gera"
    solicitacao ||--o{ anexo : "contém"
    solicitacao }o--|| categoria : "classifica-se em"

    solicitante {
        int id PK
        varchar nome_completo "NOT NULL"
        varchar email_corporativo "UNIQUE NOT NULL"
        varchar area_solicitante
        varchar departamento
        varchar nome_gestor
        varchar contato_adicional
        enum perfil "solicitante | analista | admin | gestor"
        timestamp criado_em
        timestamp atualizado_em
    }

    solicitacao {
        int id PK
        varchar protocolo "UNIQUE NOT NULL ~ NEO-YYYY-NNNNNN"
        int solicitante_id FK
        int categoria_id FK
        varchar nome_processo_atual
        varchar titulo_resumido
        text descricao_necessidade
        text justificativa_resultado
        varchar volumetria_aproximada_mensal
        varchar tempo_medio_execucao_item
        text impacto_operacional_percebido
        date prazo_desejado
        text preferencia_horarios_mapeamento
        enum prioridade "Crítica | Alta | Média | Baixa"
        enum status "17 estados do workflow"
        int responsavel_id FK
        int score_total "CHECK 0-25"
        timestamp data_abertura
        timestamp ultima_atualizacao
    }

    analise_viabilidade {
        int id PK
        int solicitacao_id FK "UNIQUE"
        enum status_atual
        timestamp agendar_mapeamento_manual
        varchar link_reuniao
        text observacoes_internas
        timestamp criado_em
        timestamp atualizado_em
    }

    priorizacao {
        int id PK
        int solicitacao_id FK "UNIQUE"
        int risco "CHECK 1-5"
        int urgencia "CHECK 1-5"
        int volumetria "CHECK 1-5"
        int impacto_operacional "CHECK 1-5"
        int esforco "CHECK 1-5"
    }

    historico_log {
        bigint id PK
        int solicitacao_id FK
        varchar acao
        int responsavel_id FK
        text descricao
        timestamp criado_em
    }

    anexo {
        int id PK
        int solicitacao_id FK
        varchar nome_arquivo
        varchar caminho
        varchar tipo
        bigint tamanho_bytes
        timestamp upload_em
    }

    categoria {
        int id PK
        varchar nome "UNIQUE NOT NULL"
        boolean ativo
    }
```

## Esquema Visual Simplificado

```
┌─────────────────────┐       ┌─────────────────────────────┐
│     solicitante     │       │        categoria            │
├─────────────────────┤       ├─────────────────────────────┤
│ PK  id              │──┐    │ PK  id                      │
│     nome_completo   │  │    │     nome              (UNQ) │
│     email_corporativo│  │    │     ativo                   │
│     area_solicitante│  │    └──────────┬──────────────────┘
│     departamento    │  │               │
│     nome_gestor     │  │               │
│     contato_adicional│  │    ┌──────────┘
│     perfil (enum)   │  │    │
│     criado_em       │  │    │
│     atualizado_em   │  │    │
└──────────┬──────────┘  │    │
           │             │    │
           │ FK          │ FK │
           ▼             │    ▼
┌─────────────────────────┴────┴───────────────────────────┐
│                      solicitacao                         │
├──────────────────────────────────────────────────────────┤
│ PK  id                                                   │
│     protocolo                    (UNQ ~ NEO-YYYY-NNNNNN) │
│     solicitante_id        FK                             │
│     categoria_id          FK                             │
│     nome_processo_atual                                   │
│     titulo_resumido                                       │
│     descricao_necessidade                                 │
│     justificativa_resultado                               │
│     volumetria_aproximada_mensal                          │
│     tempo_medio_execucao_item                             │
│     impacto_operacional_percebido                         │
│     prazo_desejado                                        │
│     preferencia_horarios_mapeamento                       │
│     prioridade (enum)                                     │
│     status (enum)                                         │
│     responsavel_id            FK ──> solicitante          │
│     score_total               CHECK 0-25                  │
│     data_abertura                                         │
│     ultima_atualizagem                                    │
└──────┬────────────┬──────────────┬───────────────────────┘
       │            │              │
       │ 1:1        │ 1:1          │ 1:N
       ▼            ▼              ▼
┌──────────────┐ ┌──────────┐ ┌────────────────┐
│ analise_     │ │          │ │ historico_log  │
│ viabilidade  │ │ priorizacao │                │
├──────────────┤ ├──────────┤ ├────────────────┤
│ PK  id       │ │ PK  id   │ │ PK  id (BIG)   │
│ FK  solicit. │ │ FK  solicit│ │ FK  solicit.   │
│     (UNQ)    │ │    (UNQ) │ │     acao       │
│     status   │ │ risco   │ │     responsavel │
│     agenda   │ │ urgencia│ │     descricao   │
│     link     │ │ volumet │ │     criado_em   │
│     obs      │ │ impacto │ └────────────────┘
│     criado_em│ │ esforco │
│     atualiz. │ └──────────┘
└──────────────┘
                   ┌──────────────┐
                   │    anexo     │
                   ├──────────────┤
                   │ PK  id       │
                   │ FK  solicit. │
                   │     nome     │
                   │     caminho  │
                   │     tipo     │
                   │     tamanho  │
                   │     upload   │
                   └──────────────┘
```

## Cardinalidades

| Origem | Destino | Cardinalidade | Motivo |
|--------|---------|---------------|--------|
| `solicitante` | `solicitacao` | 1:N | Um solicitante pode criar várias solicitações |
| `solicitante` | `solicitacao` (responsavel) | 1:N | Um analista/admin pode ser responsável por N solicitações |
| `solicitacao` | `analise_viabilidade` | 1:1 | Cada solicitação tem no máximo uma análise |
| `solicitacao` | `priorizacao` | 1:1 | Cada solicitação tem um único cálculo de priorização |
| `solicitacao` | `historico_log` | 1:N | Cada solicitação gera N logs de auditoria |
| `solicitacao` | `anexo` | 1:N | Cada solicitação pode ter N anexos |
| `solicitacao` | `categoria` | N:1 | Cada solicitação pertence a uma categoria |

## Convenções Adotadas

- **Chaves primárias:** `id SERIAL` em todas as tabelas
- **Chaves estrangeiras:** nome da tabela referenciada + `_id`
- **Índices:** criados para todas as FKs e campos de busca frequente (status, prioridade, data)
- **Enums PostgreSQL:** garantem integridade dos valores de perfil, prioridade e status
- **Trigger de protocolo:** gera automaticamente o formato `NEO-YYYY-NNNNNN` na inserção
- **Trigger de atualização:** mantém `atualizado_em` sincronizado automaticamente
