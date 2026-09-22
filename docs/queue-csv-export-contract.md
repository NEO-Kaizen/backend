# Contrato de API — Exportação CSV da Fila Centralizada

Issue backend #115. A exportação é um relatório de solicitações e permanece
separada da paginação de `GET /queue`.

## GET `/reports/requests.csv`

- Autenticação obrigatória por cookie de sessão.
- Perfis autorizados: `Gestor` e `Administrador`.
- `Analista` e `Solicitante`: `403`.
- Exporta todas as solicitações correspondentes aos filtros; `page` e
  `pageSize` não fazem parte do contrato.

### Query

Os filtros têm a mesma semântica da fila:

| Campo        | Tipo                                          | Descrição                                    |
| ------------ | --------------------------------------------- | -------------------------------------------- |
| `search`     | string, máximo 254                            | Protocolo, nome ou e-mail do solicitante     |
| `status`     | status válido                                 | Nome exato do status                         |
| `priority`   | `Baixa`, `Média`, `Alta`, `Crítica`, `nenhum` | `nenhum` seleciona prioridade nula           |
| `assigneeId` | UUID, `user_id` numérico ou `unassigned`      | Responsável exibido na fila (triagem)        |
| `unassigned` | `true`, `false`, `1`, `0`                     | Compatibilidade com o filtro sem responsável |

`unassigned=true` não pode ser combinado com um `assigneeId` diferente de
`unassigned`.

### Resposta

```http
200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="solicitacoes-AAAA-MM-DD.csv"
Cache-Control: no-store
```

O conteúdo usa UTF-8 com BOM, `;` como delimitador, CRLF e campos entre aspas.
Valores iniciados por `=`, `+`, `-` ou `@` são neutralizados para evitar CSV
injection ao abrir o arquivo em uma planilha.

Colunas:

1. Protocolo
2. Data de Abertura
3. Área
4. Processo
5. Categoria
6. Status
7. Prioridade
8. Responsável
9. Data de Mapeamento
10. Data da Última Atualização
11. Resultado da Triagem
12. Data de Conclusão

Datas são apresentadas em `America/Sao_Paulo`. A data de conclusão é a última
transição auditada para o status terminal atual (`closes_request = true`). Se o
registro não possui evento histórico confiável, a célula fica vazia.

### Erros

- `400`: filtro inválido.
- `401`: sessão ausente ou inválida.
- `403`: perfil sem permissão.
- `500`: falha inesperada ao gerar o arquivo.
