# Contrato de API — Perfil do Usuário Autenticado (Meus Dados)

Contrato de comunicação Frontend ↔ Backend para a tela "Meus dados":
consulta (`GET /users/me`) e atualização (`PUT /users/me`) do próprio
usuário autenticado — blocos de solicitante e profissional, além de
avatar via upload.

- Fonte de verdade: `docs/issues/125-user-profile-self-service.md`
- Épico: nenhum (issue isolada — Issue #125)
- Referências: `docs/issues/108-automatic-requester-all-users.md`
- Referências técnicas: `docs/users-api-metrics-0_1.md` (outro contrato de usuário), `docs/portal-config-api-0_4.md` (referência de multipart)
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`

---

## Tipos compartilhados

```ts
// Roles internas do sistema (fonte: src/shared/types/role.ts).
// O valor retornado em `role` é o nome legível (ex.: "Analista"),
// não o slug do perfil do banco.
export type Role = "Administrador" | "Gestor" | "Analista" | "Solicitante";

// Resposta de GET /users/me — perfil completo do próprio usuário.
export interface UserProfileResponseDTO {
  id: string; // user_id como string
  fullName: string; // nome completo do usuário (imutável)
  email: string; // e-mail corporativo (imutável)
  role: Role; // perfil resolvido (nome legível)
  avatarUrl: string | null; // URL da foto em /uploads/avatars/<arquivo> ou null
  requester: RequesterProfileBlock | null; // bloco de solicitante (nullable)
  professional: ProfessionalProfileBlock | null; // bloco profissional (nullable; analista apenas)
}

// Bloco de dados de solicitante editável no "Meus dados".
// fields: area/department são opcionais (podem ser null ou string);
// manager é obrigatório (non-null string no update).
export interface RequesterProfileBlock {
  area: string | null; // máx. 100 caracteres
  department: string | null; // máx. 100 caracteres
  manager: string | null; // máx. 150 caracteres
  additionalContact: string | null; // máx. 100 caracteres (telefone, ramal ou e-mail secundário)
}

// Bloco de dados profissionais editável no "Meus dados" (apenas analista).
export interface ProfessionalProfileBlock {
  jobTitle: string | null; // máx. 100 caracteres
  specialties: string[]; // array de especialidades (máx. 100 caracteres cada)
  attendedCategoryIds: number[]; // IDs das categorias atendidas
  notes: string | null; // máx. 500 caracteres
}

// Parte `payload` de PUT /users/me — campo texto cujo valor é JSON.stringify:
export interface UpdateProfilePayload {
  requester?: {
    area?: string | null; // máx. 100
    department?: string | null; // máx. 100
    manager?: string; // obrigatório no bloco — máx. 150
    additionalContact?: string | null; // máx. 100
  };
  professional?: {
    jobTitle?: string; // máx. 100
    specialties?: string[]; // mínimo 1
    attendedCategoryIds?: number[]; // mínimo 1
    notes?: string | null; // máx. 500
  };
  removeAvatar?: boolean; // true → remove foto atual
}

// Campos ignorados silenciosamente (imutáveis por esta issue):
// fullName, email, role — nunca atualizados por PUT /users/me.

// Meta do arquivo de avatar (derivado no servidor a partir da parte
// `avatar` do multipart): Content-Disposition → fileName, Content-Type
// → mimeType, tamanho da parte → sizeBytes. Nunca declarado no payload.
export interface AvatarFileMeta {
  fileName: string; // nome original do arquivo
  mimeType: string; // image/jpeg ou image/png
  sizeBytes: number; // máximo 2 * 1024 * 1024 (2 MB)
}
```

---

## 0. Modo de abertura do portal (transversal a este contrato)

Os dois endpoints deste contrato respeitam `system_settings.solicitation_mode`
(`PUBLIC` | `AUTHENTICATED`, default `PUBLIC`), alterável em runtime via
`PATCH /portal-config/access`. Em `AUTHENTICATED`, o backend exige sessão JWT
(cookie `session_id`):

| Endpoint        | `PUBLIC`                                  | `AUTHENTICATED`                                   |
| --------------- | ----------------------------------------- | ------------------------------------------------- |
| `GET /users/me` | sem acesso (401 sem sessão)               | exige sessão JWT válida                           |
| `PUT /users/me` | sem acesso (401 sem sessão)               | exige sessão JWT válida + self-service (actor == owner) |

- Sem sessão válida em `AUTHENTICATED`: `401` no envelope padrão.
- Em `PUBLIC`, os endpoints apenas retornam `401` (não há conceito de "próprio usuário" sem autenticação).

---

## 1. GET /users/me — Consultar perfil do próprio usuário

Autenticado (qualquer perfil interno: Solicitante, Gestor, Administrador ou Analista).
Retorna os dados básicos do usuário + bloco de solicitante (se existir) + bloco profissional (se existir e for analista) + URL do avatar (se houver).

Sem query params. Endpoint sem paginação.

**Response 200** — `UserProfileResponseDTO`:

```ts
export interface UserProfileResponseDTO {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  requester: RequesterProfileBlock | null;
  professional: ProfessionalProfileBlock | null;
}
```

**Exemplo real** — analista logado com bloco requester e profissional:

```http
GET /users/me HTTP/1.1
Cookie: session_id=<token_jwt>
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "id": "42",
  "fullName": "Fernando Alves",
  "email": "fernando.alves@neo.com.br",
  "role": "Analista",
  "avatarUrl": "/uploads/avatars/abc123-def456.jpg",
  "requester": {
    "area": "Tecnologia",
    "department": "Infraestrutura",
    "manager": "João Santos",
    "additionalContact": "ramal 1234"
  },
  "professional": {
    "jobTitle": "Especialista DevOps",
    "specialties": ["Docker", "Kubernetes", "CI/CD"],
    "attendedCategoryIds": [1, 3, 7],
    "notes": "Atua há 5 anos na área."
  }
}
```

**Exemplo real** — solicitante logado (sem bloco profissional):

```http
GET /users/me HTTP/1.1
Cookie: session_id=<token_jwt>
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "id": "17",
  "fullName": "Maria Oliveira",
  "email": "maria.oliveira@neo.com.br",
  "role": "Solicitante",
  "avatarUrl": null,
  "requester": {
    "area": "Recursos Humanos",
    "department": "Folha de Pagamento",
    "manager": "João Santos",
    "additionalContact": "(11) 99999-0000"
  },
  "professional": null
}
```

**Exemplo real** — analista sem dados profissionais (legado, sem linha em `details_professional`):

```json
HTTP/1.1 200 OK

{
  "id": "8",
  "fullName": "Ana Costa",
  "email": "ana.costa@neo.com.br",
  "role": "Analista",
  "avatarUrl": null,
  "requester": null,
  "professional": {
    "jobTitle": null,
    "specialties": [],
    "attendedCategoryIds": [],
    "notes": null
  }
}
```

**Exemplo de erro** — sem autenticação:

```json
HTTP/1.1 401 Unauthorized

{
  "status": "error",
  "statusCode": 401,
  "message": "Token inválido ou expirado"
}
```

**Erros:**

| Status | Quando                                                     |
| ------ | ---------------------------------------------------------- |
| 401    | Sem sessão JWT válida ou token expirado                   |
| 404    | Usuário não encontrado no banco (raro — token válido mas registro inexistente) |

---

## 2. PUT /users/me — Atualizar perfil do próprio usuário

Autenticado (qualquer perfil interno). Self-service exclusivo: o actor deve ser o dono da conta (`req.user.id` == `userId`). Qualquer tentativa de editar outro usuário → `403`.

**Content-Type:** `multipart/form-data`

**Partes esperadas:**

| Campo      | Tipo     | Obrigatório | Descrição                                                      |
| ---------- | -------- | ----------- | -------------------------------------------------------------- |
| `payload`  | texto    | Sim         | JSON.stringify de `UpdateProfilePayload` (veja seção Tipos)     |
| `avatar`   | binário  | Não         | Arquivo JPEG/PNG até 2 MB. URL persistida em `users.avatar_url` |

> **Nota de implementação (Express/multer):**
>
> - `upload.single("avatar")` com `multer.memoryStorage()` — o buffer chega em `req.file`;
> - `req.body.payload` chega como string → `JSON.parse` no controller;
> - Campos do JSON `payload`: `requester?`, `professional?`, `removeAvatar?`.
>   Campos `fullName`, `email`, `role` são descartados silenciosamente (imutáveis).
> - `removeAvatar: true` no JSON + ausência de `avatar` → remove a foto atual;
> - `removeAvatar: true` no JSON + `avatar` presente → substitui a foto (remove a antiga, salva a nova);
> - Erros do multer são mapeados para o envelope de erros:
>   - `LIMIT_FILE_SIZE` → `413` (arquivo excede 2 MB)
>   - `LIMIT_UNEXPECTED_FILE` → `415` (campo inesperado no multipart)
>   - `LIMIT_FILE_COUNT` → `400` (mais de 1 arquivo no campo `avatar`)
>   - `LIMIT_FIELD_SIZE` → `400` (campo payload muito grande)
> - FileFilter (MIME/extensão): aceita apenas `image/jpeg`, `image/png` (extensões `.jpg`, `.jpeg`, `.png`) → fora disso → `415`.

**Response 200** — `UserProfileResponseDTO` atualizado (mesma shape do GET).

**Exemplo real** — atualizar bloco requester (solicitante):

```http
PUT /users/me HTTP/1.1
Cookie: session_id=<token_jwt>
Content-Type: multipart/form-data; boundary=----MEBoundary

------MEBoundary
Content-Disposition: form-data; name="payload"
Content-Type: application/json

{
  "requester": {
    "area": "Tecnologia",
    "department": "Infraestrutura",
    "manager": "Carlos Mendes",
    "additionalContact": "ramal 5678"
  }
}
------MEBoundary--
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "id": "17",
  "fullName": "Maria Oliveira",
  "email": "maria.oliveira@neo.com.br",
  "role": "Solicitante",
  "avatarUrl": null,
  "requester": {
    "area": "Tecnologia",
    "department": "Infraestrutura",
    "manager": "Carlos Mendes",
    "additionalContact": "ramal 5678"
  },
  "professional": null
}
```

**Exemplo real** — analista atualizar bloco profissional + trocar avatar:

```http
PUT /users/me HTTP/1.1
Cookie: session_id=<token_jwt>
Content-Type: multipart/form-data; boundary=----MEBoundary

------MEBoundary
Content-Disposition: form-data; name="payload"
Content-Type: application/json

{
  "professional": {
    "jobTitle": "Senior DevOps",
    "specialties": ["Docker", "Kubernetes", "Terraform", "AWS"],
    "attendedCategoryIds": [1, 2, 5],
    "notes": "Mudou de empresa, experiência ampliada."
  },
  "removeAvatar": true
}
------MEBoundary
Content-Disposition: form-data; name="avatar"; filename="foto-nova.jpg"
Content-Type: image/jpeg

<binário — 1.2 MB>
------MEBoundary--
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "id": "42",
  "fullName": "Fernando Alves",
  "email": "fernando.alves@neo.com.br",
  "role": "Analista",
  "avatarUrl": "/uploads/avatars/xyz789-abc123.jpg",
  "requester": {
    "area": "Tecnologia",
    "department": "Infraestrutura",
    "manager": "João Santos",
    "additionalContact": "ramal 1234"
  },
  "professional": {
    "jobTitle": "Senior DevOps",
    "specialties": ["Docker", "Kubernetes", "Terraform", "AWS"],
    "attendedCategoryIds": [1, 2, 5],
    "notes": "Mudou de empresa, experiência ampliada."
  }
}
```

**Exemplo de erro** — não autenticado:

```json
HTTP/1.1 401 Unauthorized

{
  "status": "error",
  "statusCode": 401,
  "message": "Token inválido ou expirado"
}
```

**Exemplo de erro** — partindo avatar de outro usuário (self-service apenas):

```json
HTTP/1.1 403 Forbidden

{
  "status": "error",
  "statusCode": 403,
  "message": "Você não pode editar o perfil de outro usuário"
}
```

**Exemplo de erro** — bloco profissional enviado por não-analista:

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Dados profissionais são exclusivos do perfil Analista"
}
```

**Exemplo de erro** — payload com campo obrigatório ausente no bloco requester:

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "requester.manager: Campo obrigatório."
}
```

**Exemplo de erro** — parte `payload` ausente ou JSON inválido:

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Parte 'payload' ausente no corpo da requisição."
}
```

ou:

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
   "statusCode": 400,
  "message": "A parte 'payload' contém um JSON inválido."
}
```

**Exemplo de erro** — avatar com formato ou tamanho inválido:

```json
HTTP/1.1 415 Unsupported Media Type

{
  "status": "error",
  "statusCode": 415,
  "message": "Extensão \".gif\" não permitida para avatar. Aceitas: .jpg, .jpeg, .png."
}
```

ou:

```json
HTTP/1.1 413 Payload Too Large

{
  "status": "error",
  "statusCode": 413,
  "message": "Arquivo excede o tamanho máximo permitido para esta chave."
}
```

**Erros:**

| Status | Quando                                                            |
| ------ | ----------------------------------------------------------------- |
| 400    | Parte `payload` ausente ou com JSON inválido                      |
| 400    | Validação Zod falha (campos obrigatórios ausentes, limites de caracteres, array vazio em `professional`, etc.) |
| 400    | Bloco `professional` presente mas perfil do actor ≠ Analista      |
| 401    | Sem sessão JWT válida ou token expirado                           |
| 403    | Actor tenta editar perfil de outro usuário (actor ≠ owner)        |
| 404    | Usuário não encontrado no banco                                   |
| 413    | Arquivo `avatar` > 2 MB                                           |
| 415    | Arquivo `avatar` com extensão/MIME fora de JPEG/PNG               |
| 415    | Parte de arquivo inesperada no multipart (campo diferente de `avatar`) |

---

## Observações do contrato

- Campos `fullName`, `email`, `role` são **imutáveis** por esta issue. Se presentes no payload de `PUT`, são descartados silenciosamente sem erro. Alteração de nome/e-mail fica pendente de outra issue.
- O campo `role` na resposta é o **nome legível** do perfil (ex.: "Analista"), resolvido a partir do `profiles.name` do banco — não é o slug interno.
- `avatarUrl` é `null` quando o usuário não tem foto. A URL é relativa ao host: `/uploads/avatars/<storageKey>`. O servidor serve `/uploads/*` via `express.static` (conforme `app.ts`).
- O bloco `professional` só está presente (não `null`) quando o actor tem perfil Analista E a extensão `details_professional` existe. Analistas legados (sem linha) recebem `professional` com defaults (`jobTitle: null`, `specialties: []`, `attendedCategoryIds: []`, `notes: null`).
- A atualização do bloco `requester` faz UPSERT na extensão por `user_id` (1:1): se o usuário não tem linha, uma é criada; se tem, é atualizada. Isto garante que analistas legados sem extensão de requester recebem a linha ao primeiro `PUT`.
- `removeAvatar: true` no JSON remove a foto do disco (`fs.unlink`) e define `users.avatar_url = null` na mesma transação da auditoria. Se o arquivo já não existe, a operação não falha (best-effort de remoção).
- Upload de avatar e atualização de dados (requester/professional) + auditoria ocorrem na **mesma transação**: se qualquer parte falhar, tudo é rollbackado.
- Auditoria: toda atualização gera evento `user.update_profile` no catálogo de auditoria (`src/shared/audit/auditCatalog.ts`), com `previousValue` (snapshot anterior em JSON) e `newValue` (JSON resumido dos campos alterados + `avatarChanged`).
- Valores de `role` são strings PT-BR (nomes legíveis dos perfis). Limites de caracteres (Especificação 3.0 §4 / validação Zod) são espelhados entre UI e backend.
- A rota `PUT /users/me` está posicionada **antes** do `requireRole("Administrador")` no router — é acessível a qualquer perfil interno autenticado (self-service).
- `POST /requests` e `GET /requests` continuam inalterados por esta issue; o `corporate_email` do bloco requester de `PUT /users/me` não afeta a lógica de criação de solicitações (que usa `resolveRequesterId` por e-mail independentemente).
- Foto de perfil é pública via `GET /uploads/*` (decisão MVP). Restrição de visibilidade pode ser adicionada em issue futura.
- O parser de `req.body.payload` como string depende da ordem do multer; o controller valida explicitamente (400 se ausente ou não-string) antes do `JSON.parse`.
