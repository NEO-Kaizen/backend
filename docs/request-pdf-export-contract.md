# Contrato de Exportação em PDF — Issue #149

O endpoint disponibiliza a exportação de solicitações em formato PDF, com dois perfis de acesso distintos: interno (Gestor/Administrador) e solicitante. A triagem **não** é incluída nos PDFs (decisão de produto).

---

## 1. Rota — PDF Interno (Gestor/Administrador)

### Requisição

```http
GET /reports/request/internal/:protocol/pdf
Cookie: session_id=<jwt>  (perfil Interno)
```

### Autorização

- `authMiddleware` + `requireRole("Gestor", "Administrador")`
- Perfis internos acessam dados completos incluindo anexos e observações.

### Resposta de Sucesso

| Código                | Tipo                                                          | Descrição                           |
| --------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `200`                 | `application/pdf`                                             | Arquivo gerado                      |
| `Content-Disposition` | `attachment; filename="relatorio-solicitacao-{protocol}.pdf"` | Sugestão de nome para download      |
| Corpo                 | `Buffer` (≈6811 bytes)                                        | PDF de 2 páginas com todos os dados |

### Seções do PDF (internas)

1. **Identificação** — protocolo, status, prioridade, score/classificação, categoria, tipo, datas, prazo, reunião.
2. **Solicitante** — nome, e-mail, área, departamento, gestor, contato adicional.
3. **Demanda** — título, processo, descrição, problema/oportunidade, resultado esperado, justificativa.
4. **Operação** — descrição, etapas, sistemas, frequência, volumetria, pessoas, tempo médio, esforço mensal, controles manuais, riscos, impactos, criticidade.
5. **Complementar** — documentação, solução semelhante, dependências, informações restritas, observações.
6. **Responsáveis** — triagem e mapeamento.
7. **Anexos** — nomes dos arquivos vinculados à solicitação.

### Respostas de Erro

| Código | Mensagem                                              | Quando                        |
| ------ | ----------------------------------------------------- | ----------------------------- |
| `400`  | `Campos inválidos: protocol — Protocolo inválido.`    | Formato de protocolo inválido |
| `401`  | `Token não fornecido` ou `Token inválido ou expirado` | Sem cookie/sessão expirada    |
| `403`  | `Acesso restrito ao perfil Gestor ou Administrador.`  | Usuário não é Gestor/Admin    |
| `404`  | `Solicitação não encontrada`                          | Protocolo inexistente         |

---

## 2. Rota — PDF do Solicitante

### Requisição

```http
GET /requests/:protocol/pdf
# Ou via header público:
X-Requester-Identity: {"name":"...","email":"..."}
```

### Autorização

Two flow:

| Fluxo                   | Credencial                               | Modo            | Conteúdo                                                                                                       |
| ----------------------- | ---------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| **Solicitante dono**    | `Cookie: session_id=<jwt>`               | `authenticated` | Identificação + solicitante + demanda + impactos **+** operação, complementar, anexos, preferências de horário |
| **Público / sem login** | `X-Requester-Identity: {"name","email"}` | `public`        | Apenas identificação, solicitante, demanda e impactos (sem operação, sem anexos)                               |

O `requesterDualAuth` middleware resolve qual fluxo usar.

### Resposta de Sucesso

| Cenário                            | Status | Tamanho     | Conteúdo                                                                           |
| ---------------------------------- | ------ | ----------- | ---------------------------------------------------------------------------------- |
| Solicitante dono (autenticado)     | `200`  | ≈6268 bytes | PDF 2 páginas, recorte completo para o dono                                        |
| Público (header identidade válida) | `200`  | ≈3992 bytes | PDF 1 página, recorte restrito                                                     |
| 401                                | `401`  | —           | "Valide seus dados para acompanhar esta solicitação." (nome ou e-mail divergentes) |
| 404                                | `404`  | —           | "Protocolo não encontrado" (para não-dono, anti-enumeração)                        |

### Conteúdo por modo

| Modo            | Inclui                                                                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public`        | Protocolo, status público, datas, última mensagem técnica, reunião, solicitante, demanda (título, tipo, categoria, processo, descrição, problema, resultado esperado, justificativa), impactos (risco, cliente, operacional, criticidade, prazo).                                                                  |
| `authenticated` | Tudo do `public` **+** operação (descrição, etapas, sistemas, frequência, volumetria, pessoas, tempo médio, esforço mensal, controles manuais, riscos, impactos, criticidade), complementar (documentação, solução semelhante, dependências, informações restritas, observações), anexos, preferências de horário. |

### Respostas de Erro

| Código | Mensagem                                                  | Quando                                                                          |
| ------ | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `400`  | `Protocolo é obrigatório`                                 | `protocol` vazio ou inválido                                                    |
| `401`  | `Valide seus dados para acompanhar esta solicitação.`     | Sem cookie nem header, ou nome/e-mail divergentes do solicitante                |
| `403`  | `Perfis internos devem acompanhar pela consulta interna.` | Gestor/Administrador logado usando a rota do solicitante                        |
| `404`  | `Protocolo não encontrado`                                | Protocolo inexistente ou de terceiro (mesma resposta para não vazar existência) |

---

## 3. Contrato de Dados — Payloads

### Request (parâmetros da URL/headers)

```http
GET /requests/MAAT-8K3P-9X2M/pdf
X-Requester-Identity: {"name":"Fabio Solicitante","email":"fabio.solicitante@email.com"}
```

| Parâmetro              | Tipo     | Obrigatório      | Descrição                                       |
| ---------------------- | -------- | ---------------- | ----------------------------------------------- |
| `protocol`             | `string` | Sim              | Protocolo da solicitação (ex: `MAAT-8K3P-9X2M`) |
| `X-Requester-Identity` | `object` | Não (use cookie) | `{"name": "string", "email": "string"}`         |

### Resposta de Erro Padrão

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Campos inválidos: protocol — Protocolo inválido."
}
```

Ou para o fluxo do solicitante:

```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Valide seus dados para acompanhar esta solicitação."
}
```

---

## 4. Exemplos de Uso no Frontend

### 4.1. Solicitante com login (cookie)

```ts
// O frontend deve enviar o cookie session_id automaticamente (credentials: "include")
// ou usar o token gerado via login

const res = await fetch("/requests/MAAT-8K3P-9X2M/pdf", {
  credentials: "include", // ou "include" no fetch
});

if (res.ok) {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `solicitacao-MAAT-8K3P-9X2M.pdf`;
  a.click();
}
```

### 4.2. Solicitante sem login (apenas header)

```ts
const name = "Fabio Solicitante"; // obter da tela do usuário
const email = "fabio.solicitante@email.com";

const res = await fetch("/requests/MAAT-8K3P-9X2M/pdf", {
  headers: {
    "X-Requester-Identity": JSON.stringify({ name, email }),
  },
  // sem credentials: "include"
});

if (res.ok) {
  const blob = await res.blob();
  // trigger download...
}
```

### 4.3. Tratamento de erros

```ts
try {
  const res = await fetch("/requests/MAAT-8K3P-9X2M/pdf", {
    credentials: "include",
  });

  if (res.status === 401) {
    // Usuário não autorizado - mostrar mensagem
    alert("É necessário estar logado para exportar o PDF.");
  } else if (res.status === 404) {
    // Protocolo não encontrado ou não é deste usuário
    alert("Solicitação não disponível.");
  } else if (!res.ok) {
    alert("Erro ao gerar PDF: " + res.statusText);
  }
} catch (e) {
  alert("Erro de rede.");
}
```

---

## 5. Mudanças Recentemente Implementadas

| Arquivo                                            | O que mudou                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/modules/reports/reports.service.ts`           | Implementado `getGenerateRequestPDF` (resumo interno) e `getRequesterRequestPDF` (recorte por perfil via `getTracking`) |
| `src/modules/DTOs/reports/RequestPdfExport.dto.ts` | Adicionado `RequestPdfSource`                                                                                                        |
| `src/modules/reports/reports.router.ts`            | Duas rotas: `/request/internal/:protocol/pdf` (interno) e `/request/protocol/:protocol/pdf` (solicitante)                            |
| `src/modules/reports/reports.controller.ts`        | Controller do PDF interno + novo controller do solicitante                                                                           |

---

## 6. Próximos Passos (Frontend)

1. Implementar o `fetch` com `credentials: "include"` para o fluxo com login.
2. Implementar o header `X-Requester-Identity` para o fluxo público.
3. Tratar as diferentes respostas (200 para download, 401/404 para mensagens de erro).
4. Validar que o header `X-Requester-Identity` tem o `name` e `email` corretos (bater com a solicitação).
5. Considerar o modo `AUTHENTICATED` do portal: se mudar de `PUBLIC` para `AUTHENTICATED`, o solicitante sem login passa a receber `403 "Verificação indisponível no modo atual"`.

---
