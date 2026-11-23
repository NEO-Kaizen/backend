# Contrato de API — Perfil do Usuário Autenticado (Meus Dados)

Contrato de comunicação Frontend ↔ Backend para a tela "Meus dados" e para
a edição administrativa: consulta (`GET /users/me`) e atualização
(`PUT /users/me`) do próprio usuário, além de `GET /users/:id` e
`PUT /users/:id` exclusivos de quem gerencia contas (`user:manage`), dentro da
matriz de contas (RBAC § 4.2).

- Fonte de verdade: `docs/issues/125-user-profile-self-service.md`
- Épico: nenhum (issue isolada — Issue #125)
- Referências: `docs/issues/108-automatic-requester-all-users.md`
- Referências técnicas: `docs/users-api-metrics-0_1.md` (outro contrato de usuário), `docs/portal-config-api-0_4.md` (referência de multipart)
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`

---

## Tipos compartilhados

```ts
// Resposta de GET /users/me — perfil completo do próprio usuário.
export interface UserProfileResponseDTO {
  id: string; // user_id como string
  fullName: string; // nome completo do usuário (autoeditável)
  email: string; // e-mail corporativo (imutável)
  role: string; // nome real do Perfil em `profiles.name`
  avatarUrl: string | null; // URL da foto em /uploads/avatars/<arquivo> ou null
  requester: RequesterProfileBlock | null; // bloco de solicitante (nullable)
  professional: ProfessionalProfileBlock | null; // presente para Perfil ativo com flag de Atribuibilidade
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

// Bloco da Extensão de profissional, somente leitura no "Meus dados".
export interface ProfessionalProfileBlock {
  jobTitle: string | null; // máx. 100 caracteres
  specialties: string[]; // array de especialidades (máx. 100 caracteres cada)
  attendedCategoryIds: number[]; // IDs das categorias atendidas
  notes: string | null; // máx. 500 caracteres
}

// Parte `payload` de PUT /users/me — campo texto cujo valor é JSON.stringify:
export interface UpdateProfilePayload {
  fullName?: string; // máx. 150
  requester?: {
    // Somente no self-service de quem tem `user:manage`:
    area?: string; // máx. 100
    department?: string | null; // máx. 100; null limpa
    manager?: string; // máx. 150
    additionalContact?: string | null; // máx. 100
  };
  removeAvatar?: boolean; // true → remove foto atual
}

// Campos não declarados são recusados. E-mail, Perfil e Extensão de profissional
// são administrados fora do self-service. Área, departamento e gestor só são
// aceitos quando o próprio usuário autenticado tem a permissão `user:manage`.

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

| Endpoint        | `PUBLIC`                    | `AUTHENTICATED`                                         |
| --------------- | --------------------------- | ------------------------------------------------------- |
| `GET /users/me` | sem acesso (401 sem sessão) | exige sessão JWT válida                                 |
| `PUT /users/me` | sem acesso (401 sem sessão) | exige sessão JWT válida + self-service (actor == owner) |

- Sem sessão válida em `AUTHENTICATED`: `401` no envelope padrão.
- Em `PUBLIC`, os endpoints apenas retornam `401` (não há conceito de "próprio usuário" sem autenticação).

---

## 1. GET /users/me — Consultar perfil do próprio usuário

Autenticado (qualquer Perfil interno).
Retorna os dados básicos do usuário + bloco de solicitante (se existir) + bloco profissional (se existir e o Perfil for atribuível) + URL do avatar (se houver).

Sem query params. Endpoint sem paginação.

**Response 200** — `UserProfileResponseDTO`:

```ts
export interface UserProfileResponseDTO {
  id: string;
  fullName: string;
  email: string;
  role: string;
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

**Exemplo real** — usuário de Perfil atribuível sem conteúdo na Extensão de profissional (legado, sem linha em `details_professional`):

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

| Status | Quando                                                                         |
| ------ | ------------------------------------------------------------------------------ |
| 401    | Sem sessão JWT válida ou token expirado                                        |
| 404    | Usuário não encontrado no banco (raro — token válido mas registro inexistente) |

---

## 2. PUT /users/me — Atualizar perfil do próprio usuário

Autenticado (qualquer perfil interno). Self-service exclusivo: o actor deve ser o dono da conta (`req.user.id` == `userId`). Qualquer tentativa de editar outro usuário → `403`.

**Content-Type:** `multipart/form-data`

**Partes esperadas:**

| Campo     | Tipo    | Obrigatório | Descrição                                                       |
| --------- | ------- | ----------- | --------------------------------------------------------------- |
| `payload` | texto   | Sim         | JSON.stringify de `UpdateProfilePayload` (veja seção Tipos)     |
| `avatar`  | binário | Não         | Arquivo JPEG/PNG até 2 MB. URL persistida em `users.avatar_url` |

> **Nota de implementação (Express/multer):**
>
> - `upload.single("avatar")` com `multer.memoryStorage()` — o buffer chega em `req.file`;
> - `req.body.payload` chega como string → `JSON.parse` no controller;
> - Campos do JSON `payload`: `fullName?`, `requester?`, `removeAvatar?`.
>   Em `requester`, todos podem alterar `additionalContact`; somente quem tem
>   `user:manage` pode alterar também `area`, `department` e `manager`.
> - `removeAvatar: true` no JSON + ausência de `avatar` → remove a foto atual;
> - `removeAvatar: true` no JSON + `avatar` presente → erro `400`; o cliente deve escolher uma operação;
> - Erros do multer são mapeados para o envelope de erros:
>   - `LIMIT_FILE_SIZE` → `413` (arquivo excede 2 MB)
>   - `LIMIT_UNEXPECTED_FILE` → `415` (campo inesperado no multipart)
>   - `LIMIT_FILE_COUNT` → `400` (mais de 1 arquivo no campo `avatar`)
>   - `LIMIT_FIELD_SIZE` → `400` (campo payload muito grande)
> - FileFilter (MIME/extensão): aceita apenas `image/jpeg`, `image/png` (extensões `.jpg`, `.jpeg`, `.png`) → fora disso → `415`.

**Response 200** — `UserProfileResponseDTO` atualizado (mesma shape do GET).

**Exemplo real** — atualizar nome e contato adicional:

```http
PUT /users/me HTTP/1.1
Cookie: session_id=<token_jwt>
Content-Type: multipart/form-data; boundary=----MEBoundary

------MEBoundary
Content-Disposition: form-data; name="payload"
Content-Type: application/json

{
  "fullName": "Maria Oliveira Santos",
  "requester": {
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
  "fullName": "Maria Oliveira Santos",
  "email": "maria.oliveira@neo.com.br",
  "role": "Solicitante",
  "avatarUrl": null,
  "requester": {
    "area": "Recursos Humanos",
    "department": "Folha de Pagamento",
    "manager": "João Santos",
    "additionalContact": "ramal 5678"
  },
  "professional": null
}
```

**Exemplo real** — trocar avatar:

```http
PUT /users/me HTTP/1.1
Cookie: session_id=<token_jwt>
Content-Type: multipart/form-data; boundary=----MEBoundary

------MEBoundary
Content-Disposition: form-data; name="payload"
Content-Type: application/json

{}
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
    "jobTitle": "Especialista DevOps",
    "specialties": ["Docker", "Kubernetes", "CI/CD"],
    "attendedCategoryIds": [1, 3, 7],
    "notes": "Atua há 5 anos na área."
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

**Exemplo de erro** — campo administrativo enviado no self-service por quem não
tem `user:manage`:

```json
HTTP/1.1 403 Forbidden

{
  "status": "error",
  "statusCode": 403,
  "code": "user_manage_required",
  "message": "Área, departamento e gestor só podem ser alterados por quem tem a permissão user:manage. Use PUT /users/:id."
}
```

**Exemplo de erro** — campo não permitido no payload:

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Campos inválidos: professional — Unrecognized key: \"professional\""
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

| Status | Quando                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------- |
| 400    | Parte `payload` ausente ou com JSON inválido                                                    |
| 400    | Validação Zod falha (limites de caracteres ou campos fora do contrato)                          |
| 401    | Sem sessão JWT válida ou token expirado                                                         |
| 403    | Sem `user:manage` e envia área, departamento ou gestor no self-service (`user_manage_required`) |
| 404    | Usuário não encontrado no banco                                                                 |
| 413    | Arquivo `avatar` > 2 MB                                                                         |
| 415    | Arquivo `avatar` com extensão/MIME fora de JPEG/PNG                                             |
| 415    | Parte de arquivo inesperada no multipart (campo diferente de `avatar`)                          |

---

## 3. GET /users/:id — Consultar perfil para edição administrativa

Exclusivo para quem tem `user:read`. Retorna o mesmo `UserProfileResponseDTO`
de `GET /users/me`, incluindo os blocos `requester` e `professional`. A rota é
usada para preencher o modal "Alterar dados" sem ampliar a resposta paginada de
`GET /users`.

**Response 200:** `UserProfileResponseDTO`.

**Erros:** `401` sem sessão, `403` sem `user:read` e `404` quando
o usuário não existe ou o identificador é inválido.

---

## 4. PUT /users/:id — Atualizar dados administrativos

Exclusivo para quem tem `user:manage`, dentro da matriz de contas (RBAC § 4.2):
o Perfil-alvo precisa estar **estritamente abaixo** do ator; o Perfil Admin Root
é fora de rota; a própria conta é recusada; e Perfil inativo não recebe conta
nova nem designação. O corpo é JSON e funciona como merge: campos ausentes
preservam o valor atual. O modal desta versão envia somente os dados
administrados pelo portal:

```ts
interface UpdateUserRequest {
  requester?: {
    area?: string;
    department?: string | null; // null remove o departamento
    manager?: string;
  };
  professional?: {
    jobTitle: string;
    specialties: string[];
    attendedCategoryIds: number[];
    notes?: string;
  }; // opcional; permitido para Perfis atribuíveis
}
```

O modal também expõe `fullName`. O endpoint mantém compatibilidade com os
demais campos administrativos já existentes (`email` e `role`), que não são
expostos pelo modal desta versão. `professional` pode ser atualizado sem
reenviar `role`; o service valida as flags do Perfil atual no banco.

**Response 200:** `UserProfileResponseDTO` atualizado.

**Erros:** `400` para payload inválido, `401` sem sessão, `403` sem
`user:manage`, fora da matriz de contas (`account_out_of_authority`), conta
Admin Root (`root_account_protected`) ou própria conta
(`self_management_forbidden`), `409` para Perfil inativo (`profile_inactive`) e
`404` para usuário inexistente.

---

## Observações do contrato

- `fullName`, `requester.additionalContact` e avatar são autoeditáveis por qualquer perfil. Quem tem `user:manage` também pode editar `requester.area`, `requester.department` e `requester.manager`; para os demais perfis, esses campos continuam exclusivos do fluxo administrativo em `PUT /users/:id`.
- O campo `role` na resposta é o nome real do Perfil em `profiles.name`; Perfis customizados aparecem pelo nome configurado.
- `avatarUrl` é `null` quando o usuário não tem foto. A URL é relativa ao host: `/uploads/avatars/<storageKey>`. O servidor serve `/uploads/*` via `express.static` (conforme `app.ts`).
- A Extensão de profissional (`details_professional`) nasce na mesma transação da conta quando o Perfil está ativo e tem uma flag de Atribuibilidade; recebe backfill transacional ao ligar uma flag em Perfil com usuários ativos ou ao mover uma conta para Perfil ativo com flag. Seu conteúdo é opcional. Para uma conta legada sem linha, `GET /users/me` devolve o bloco `professional` com defaults (`jobTitle: null`, `specialties: []`, `attendedCategoryIds: []`, `notes: null`) sem inserir a extensão; essa conta permanece fora do diretório até o backfill.
- A atualização do bloco `requester` faz UPSERT na extensão por `user_id` (1:1): se o usuário não tem linha, uma é criada; se tem, é atualizada. Isto garante que usuários legados sem extensão de requester recebem a linha ao primeiro `PUT`.
- `removeAvatar: true` no JSON remove a foto do disco (`fs.unlink`) e define `users.avatar_url = null` na mesma transação da auditoria. Se o arquivo já não existe, a operação não falha (best-effort de remoção).
- Atualização de nome, dados permitidos de requester, referência do avatar e auditoria ocorre na **mesma transação** de banco.
- Auditoria: toda atualização gera evento `user.update_profile` no catálogo de auditoria (`src/shared/audit/auditCatalog.ts`), com `previousValue` (snapshot anterior em JSON) e `newValue` (JSON resumido dos campos alterados + `avatarChanged`).
- Valores de `role` são nomes de Perfil retornados diretamente do banco. Limites de caracteres (Especificação 3.0 §4 / validação Zod) são espelhados entre UI e backend.
- A rota `PUT /users/me` está posicionada **antes** dos gates de chave no router — é acessível a qualquer perfil interno autenticado (self-service); a exceção de área/departamento/gestor é decidida pela chave `user:manage`.
- `POST /requests` e `GET /requests` continuam inalterados por esta issue; o `corporate_email` do bloco requester de `PUT /users/me` não afeta a lógica de criação de solicitações (que usa `resolveRequesterId` por e-mail independentemente).
- Foto de perfil é pública via `GET /uploads/*` (decisão MVP). Restrição de visibilidade pode ser adicionada em issue futura.
- O parser de `req.body.payload` como string depende da ordem do multer; o controller valida explicitamente (400 se ausente ou não-string) antes do `JSON.parse`.
