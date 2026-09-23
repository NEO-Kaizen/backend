# Endpoints de Configuração do Portal (`/portal-config`)

Contrato completo: `portal-config-api-0_4.md` (issue #90).

## Resumo dos endpoints

| Método | Rota                                    | Auth    | Descrição                              |
| ------ | --------------------------------------- | ------- | -------------------------------------- |
| GET    | `/portal-config`                        | Público | Config consolidada do portal           |
| PATCH  | `/portal-config/access`                 | Admin   | Modo de acesso (PUBLIC/AUTHENTICATED)  |
| PATCH  | `/portal-config/identity`               | Admin   | Nome da plataforma + máscara protocolo |
| PATCH  | `/portal-config/theme`                  | Admin   | Tema visual (light + dark completos)   |
| PATCH  | `/portal-config/assets`                 | Admin   | Assets (multipart/form-data)           |
| PATCH  | `/portal-config/categories`             | Admin   | Categorias da demanda                  |
| PATCH  | `/portal-config/statuses`               | Admin   | Ciclo de vida (status)                 |
| PATCH  | `/portal-config/prioritization-weights` | Admin   | Pesos dos critérios de priorização     |

## Decisões de produto (divergentes do contrato)

- **Pesos**: API `1–10` inteiros (contrato 0_4, alinhado ao `criteria.weight`).
  `criteria.weight` INT com CHECK `0..10` (migration `20260916170010`) — o 0
  existe só na coluna (decisão issue-59 §8.3); o `PATCH` rejeita `< 1`.
  Seed oficial = `10` (`002_criteria.js` / `prioritization-api.md`).
- **Reset**: descartado — defaults restaurados por `PATCH` explícito por seção.
- **Tema ausente (NULL)**: `GET` retorna defaults documentados no contrato §1.
  `backgroundLocked` com coluna `NULL` → `false` (contrato §Observações).
  Gradiente dark = light (`#002068 → #003399`).
- **Status protegidos**: 8 nomes hardcoded (`Solicitação enviada`, `Em triagem`,
  etc.) não podem ser renomeados ou removidos no `PATCH statuses` (risco §6.1)
  → `409`.
- **Statuses seed**: 1–17 matriz Anexo A + `18 Fora do escopo` / `19 Duplicada`
  (triage); legados `20–22` inativados por `20260924000000`.
- **Storage de assets**: binários em `uploads/portal/`, URLs relativas
  `/uploads/portal/{variant}-{uuid}.{ext}` (ex: `logo-light`, `avatar-dark`).
- **`solicitation_mode` efetivo**: o valor definido em `PATCH access` é lido a
  cada request pelo guard `requireAccessMode()` e incide sobre `POST /requests`,
  `GET /requests` e `GET /requests/:protocol` (ver
  [`solicitations-api-requests-0_4.md`](solicitations-api-requests-0_4.md),
  seção 0). Em `AUTHENTICATED` as rotas exigem sessão e escopam o acesso à
  identidade do usuário logado.

## Scripts de teste (curl)

### GET — config pública

```bash
curl -s http://localhost:3000/portal-config | jq .
```

### PATCH access

```bash
curl -s -X PATCH http://localhost:3000/portal-config/access \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{"solicitationMode": "AUTHENTICATED"}' | jq .
```

### PATCH identity

```bash
curl -s -X PATCH http://localhost:3000/portal-config/identity \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{"platformName": "NEO"}' | jq .
```

### PATCH theme

```bash
curl -s -X PATCH http://localhost:3000/portal-config/theme \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{
    "theme": {
      "light": {
        "background": "#f0f4f8",
        "surface": "#fafafa",
        "border": "#e5e7eb",
        "textPrimary": "#3c3e47",
        "textSecondary": "#757682",
        "heading": "#00236f",
        "richBlack": "#0f1a2a",
        "primary": "#00236f",
        "secondary": "#0058be",
        "tint": "#d6e7fb",
        "onPrimary": "#ffffff",
        "onDark": "#ffffff",
        "onGradient": "#ffffff",
        "gradient": {"from": "#002068", "to": "#003399", "angle": 143},
        "statuses": {
          "error":   {"color": "#ef4444", "background": "#ef444410", "backgroundLocked": true},
          "success": {"color": "#10b981", "background": "#10b98110", "backgroundLocked": true},
          "info":    {"color": "#0058be", "background": "#0058be10", "backgroundLocked": true},
          "warning": {"color": "#956006", "background": "#f59e0b10", "backgroundLocked": true},
          "neutral": {"color": "#4b5563", "background": "#e5e7eb",   "backgroundLocked": true}
        }
      },
      "dark": {
        "background": "#0b0f1a",
        "surface": "#141b2e",
        "border": "#2a3346",
        "textPrimary": "#e5e7eb",
        "textSecondary": "#9aa3b2",
        "heading": "#4c7dff",
        "richBlack": "#0f1a2a",
        "primary": "#4c7dff",
        "secondary": "#5b9bff",
        "tint": "#1b2942",
        "onPrimary": "#0b0f1a",
        "onDark": "#ffffff",
        "onGradient": "#ffffff",
        "gradient": {"from": "#002068", "to": "#003399", "angle": 143},
        "statuses": {
          "error":   {"color": "#f87171", "background": "#4c0f0a", "backgroundLocked": true},
          "success": {"color": "#4ade80", "background": "#0f2e1d", "backgroundLocked": true},
          "info":    {"color": "#5b9bff", "background": "#1b2942", "backgroundLocked": true},
          "warning": {"color": "#fbbf24", "background": "#4a2e0f", "backgroundLocked": true},
          "neutral": {"color": "#9aa3b2", "background": "#2a3346", "backgroundLocked": true}
        }
      }
    }
  }' | jq .
```

### PATCH categories

```bash
curl -s -X PATCH http://localhost:3000/portal-config/categories \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{
    "categories": [
      {"id": 1, "name": "Automação",               "description": "Automação de atividades manuais",  "isActive": true},
      {"id": 2, "name": "Melhoria de processo",     "description": "Revisão e padronização de fluxo",  "isActive": true},
      {"id": 3, "name": "Indicador",                "description": "Criação de métrica operacional",  "isActive": true},
      {"id": 4, "name": "Dashboard ou relatório",   "description": "Visualização gerencial",           "isActive": true},
      {"id": 5, "name": "Análise de dados",         "description": "Cruzamento e exploração de dados", "isActive": true},
      {"id": 6, "name": "Padronização",             "description": "Definição de modelos",              "isActive": true},
      {"id": 7, "name": "Revisão de processo",      "description": "Diagnóstico de processo existente", "isActive": true},
      {"id": 8, "name": "Apoio técnico",            "description": "Suporte dentro do escopo NEO",     "isActive": true},
      {"id": 9, "name": "Estudo de viabilidade",    "description": "Análise preliminar",                "isActive": true},
      {"id": 10,"name": "Outros",                   "description": "Solicitação genérica",              "isActive": true}
    ]
  }' | jq .
```

### PATCH statuses

```bash
curl -s -X PATCH http://localhost:3000/portal-config/statuses \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{
    "statuses": [
      {"id": 1,  "name": "Solicitação enviada",       "visibility": "PUBLIC",    "closesRequest": false, "tone": "info",    "isActive": true},
      {"id": 2,  "name": "Aguardando triagem",        "visibility": "PUBLIC",    "closesRequest": false, "tone": "info",    "isActive": true},
      {"id": 3,  "name": "Em triagem",                "visibility": "INTERNAL",  "closesRequest": false, "tone": "info",    "isActive": true},
      {"id": 16, "name": "Concluído",                 "visibility": "PUBLIC",    "closesRequest": true,  "tone": "success", "isActive": true},
      {"id": 17, "name": "Cancelado",                 "visibility": "PUBLIC",    "closesRequest": true,  "tone": "neutral", "isActive": true}
    ]
  }' | jq .
```

### PATCH prioritization-weights

```bash
curl -s -X PATCH http://localhost:3000/portal-config/prioritization-weights \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{
    "prioritizationWeights": {
      "operationalImpact": 8,
      "operationalRisk": 7,
      "urgency": 9,
      "volumetry": 5,
      "manualEffort": 6,
      "clientImpact": 8,
      "regulatoryDeadline": 10,
      "affectedAreas": 4,
      "strategicAlignment": 7,
      "estimatedComplexity": 5
    }
  }' | jq .
```

### PATCH assets (URL direta + flag)

```bash
curl -s -X PATCH http://localhost:3000/portal-config/assets \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{
    "logoLightUrl": "/uploads/portal/logo-light-default.svg",
    "logoDarkUrl": "/uploads/portal/logo-dark-default.svg",
    "logoUsePrimaryColor": true
  }' | jq .
```

### PATCH assets (multipart — binário + flag via JSON)

```bash
curl -s -X PATCH http://localhost:3000/portal-config/assets \
  -b "session_id=$SESSION_ID" \
  -F 'assets={"logoUsePrimaryColor": true};type=application/json' \
  -F 'logoLightUrl=@./logo-light.png;type=image/png' \
  -F 'logoDarkUrl=@./logo-dark.png;type=image/png' | jq .
```

### Erros esperados

- **400**: payload inválido (zod)
- **401**: sem cookie/session inválido
- **403**: perfil não Administrador
- **409**: tentativa de renomear/remover status protegido
- **413**: arquivo excede tamanho máximo da chave
- **415**: MIME/extensão não permitido para a chave
