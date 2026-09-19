# Contrato de API — Observações Internas

Contrato Frontend ↔ Backend das observações privadas vinculadas a uma solicitação
(issue #98).

- Acesso exclusivo aos perfis `Analista`, `Gestor` e `Administrador`.
- O perfil `Solicitante` não consulta, publica nem marca observações como visualizadas.
- As observações são imutáveis no MVP: não há edição nem exclusão.
- `requests.internal_notes` é legado e não participa deste contrato.
- Erros usam o envelope
  `{ "status": "error", "statusCode": number, "message": string }`.

---

## Persistência

### `request_internal_notes`

Cada registro pertence a uma solicitação e a um usuário autor. O campo
`author_role_at_creation` preserva o perfil que o autor possuía no momento da
publicação, mesmo que seu perfil seja alterado posteriormente.

O nome exibido vem de `users.full_name`. Usuários e solicitações referenciados
não podem ser excluídos enquanto possuírem observações.

### `request_internal_note_read_states`

Mantém um checkpoint por `(request_id, user_id)`. `last_read_note_id` indica a
última observação efetivamente carregada e visualizada por aquele usuário na
solicitação.

O checkpoint só avança. Requisições concorrentes ou atrasadas com um ID menor
nunca fazem o estado de leitura regredir.

---

## 1. GET `/requests/:protocol/internal-notes`

Lista todas as observações em ordem cronológica crescente. Em empates de data,
o ID da observação define a ordem.

### Resposta `200`

```json
{
  "items": [
    {
      "id": "12",
      "content": "Precisamos confirmar a alçada de aprovação.",
      "createdAt": "2026-09-19T14:30:00.000Z",
      "author": {
        "id": "7",
        "name": "Rogério da Silva",
        "role": "Analista"
      }
    }
  ],
  "unseenCount": 1
}
```

`unseenCount` considera as observações:

1. posteriores ao checkpoint do usuário;
2. escritas por outro usuário;
3. pertencentes à solicitação consultada.

Sem um checkpoint, todas as observações de outros autores são consideradas
ainda não visualizadas. Publicações do próprio usuário nunca aumentam sua
contagem.

Uma lista vazia retorna:

```json
{ "items": [], "unseenCount": 0 }
```

---

## 2. POST `/requests/:protocol/internal-notes`

Publica uma observação. O autor e seu perfil são obtidos exclusivamente da
sessão autenticada; o cliente não envia dados de autoria.

### Body

```json
{
  "content": "Precisamos confirmar a alçada de aprovação."
}
```

`content` é aparado nas extremidades, deve possuir ao menos um caractere e no
máximo 4.000 caracteres.

### Resposta `201`

```json
{
  "id": "12",
  "content": "Precisamos confirmar a alçada de aprovação.",
  "createdAt": "2026-09-19T14:30:00.000Z",
  "author": {
    "id": "7",
    "name": "Rogério da Silva",
    "role": "Analista"
  }
}
```

Criar uma observação não altera automaticamente o checkpoint do autor. Como a
publicação própria não entra em `unseenCount`, ela também não gera badge para
quem a criou.

---

## 3. PUT `/requests/:protocol/internal-notes/read`

Marca como visualizadas todas as observações até a última que o frontend
realmente carregou na aba.

### Body

```json
{
  "lastReadNoteId": "12"
}
```

O ID é enviado como string para preservar identificadores `BIGINT` sem perda de
precisão no JavaScript. A observação informada precisa pertencer à solicitação
da URL.

### Resposta `204`

Sem corpo.

O frontend não deve chamar esta rota quando a lista estiver vazia. Buscar a
lista, por si só, não marca nenhuma observação como visualizada; a marcação
ocorre quando o usuário abre efetivamente a aba.

---

## Erros

| Código | Situação                                          |
| ------ | ------------------------------------------------- |
| `400`  | Protocolo, conteúdo ou ID de observação inválido  |
| `400`  | A observação informada não pertence à solicitação |
| `401`  | Cookie ausente, sessão inválida ou expirada       |
| `403`  | Perfil `Solicitante`                              |
| `404`  | Solicitação não encontrada                        |

---

## Fora do escopo do MVP

- edição ou exclusão de observações;
- anexos e menções;
- notificações em tempo real;
- eventos automáticos de auditoria;
- mensagens trocadas com o solicitante;
- migração ou remoção de `requests.internal_notes`.
