# Identidade pública do solicitante sem sessão

**Status:** aceito — 21/11/2026

O solicitante sem conta comprova identidade para acompanhar uma solicitação e
responder pendências com **protocolo + nome + e-mail**, sem emissão de JWT ou
cookie. A verificação é um `POST /requests/:protocol/public/verify` que devolve
booleano; o cliente guarda a identidade apenas em `sessionStorage`, com vida
útil da página.

## Contexto

O fluxo público precisa permitir acompanhamento e resposta de pendências sem
criar conta. Emitir um JWT `requester_access` exigiria assinatura, expiração,
revogação e um novo tipo de sessão para um usuário que pode nem existir no
cadastro. Cookie de sessão para solicitante anônimo tem o mesmo custo e amplia a
superfície de CSRF.

## Decisão

- `POST /requests/:protocol/public/verify` valida `{ name, email, protocol }`
  contra o cadastro da solicitação e responde `{ protocol, canAccess: true }`
  sem `Set-Cookie` e sem token.
- O cliente reenvia a identidade em `X-Requester-Identity` a cada chamada; o
  backend revalida (nome sem acentos/minúsculas, e-mail minúsculo, protocolo
  idêntico à URL).
- A identidade vive em `sessionStorage` com vida útil da página; novo acesso
  exige novo `verify`.
- Rate-limit: 10 tentativas / 10 minutos por IP + protocolo, contando inclusive
  as inválidas.
- A resposta de falha é sempre o mesmo `401` genérico, sem revelar qual campo
  divergiu nem se o protocolo existe.
- O protocolo é gerado por FPE (Feistel) sobre o id interno, não sequencial.

## Alternativas consideradas

- **JWT `requester_access`:** permitiria chamadas stateless por mais tempo, mas
  cria um segundo regime de sessão, revogação e rotação para um usuário
  efêmero.
- **Conta obrigatória:** contraria o requisito de formulário público.
- **Somente protocolo:** enumerável e insuficiente como prova de identidade.

## Consequências

- A TTL real é do cliente (referência de 30 min); o backend não confia nela e
  revalida a cada chamada.
- O fluxo depende de `sessionStorage` e de limpar a identidade ao sair da
  página; a forma de detectar a saída é decisão de implementação do frontend.
- Rotas internas continuam aceitando apenas cookie de sessão.
- Solicitações sem `requester_user_id` não geram notificação in-app na v1.
- Qualquer novo endpoint público do domínio precisa reaplicar a mesma
  normalização e o mesmo `401` genérico.
