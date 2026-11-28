# Acesso público e acompanhamento do solicitante

## Modo de acesso

- **`PUBLIC`** — o formulário e o acompanhamento aceitam solicitante sem conta.
- **`AUTHENTICATED`** — o fluxo público é fechado: listagem, detalhe público e
  criação de solicitação exigem sessão.

O acompanhamento aplica a própria checagem de modo; a verificação de identidade
responde indisponível em `AUTHENTICATED`. A exceção é o detalhe público antigo,
que em `PUBLIC` aceita apenas o protocolo por compatibilidade.

> **Dívida:** as rotas de pendências não consultam o modo. Em `AUTHENTICATED`,
> uma identidade pública previamente validada ainda consegue listar, responder e
> anexar pendências. Ver [`README.md`](README.md).

## Identidade pública

O solicitante comprova identidade com **protocolo + nome + e-mail**, sem criar
sessão e sem receber JWT ou cookie novo.

- A comparação normaliza o nome (trim, minúsculas, sem acentos) e o e-mail
  (trim, minúsculas); o protocolo precisa ser idêntico ao da URL.
- Divergência, ausência ou solicitação inexistente respondem o mesmo erro
  genérico, sem revelar qual campo divergiu nem se o protocolo existe.
- A verificação tem rate-limit; todas as tentativas contam.
- O backend revalida a identidade a cada chamada e não confia na validade
  guardada pelo cliente. A TTL é responsabilidade do frontend.

## Dual-auth e Posse

- **Acompanhamento:** a Posse é o vínculo `requests.requester_user_id`; em
  solicitações legadas sem vínculo, compara o e-mail normalizado. Sessão de
  perfil interno é recusada. Em `AUTHENTICATED`, sem sessão do Solicitante
  também é recusado.
- **Pendências:** sessão de `Solicitante` compara nome e e-mail da conta;
  sessão interna passa sem checagem de custódia; sem cookie, exige identidade
  pública validada.

## Recorte do acompanhamento

O acompanhamento nunca inclui triagem, priorização, notas internas ou dados de
outros solicitantes. O recorte público mostra apenas o estado externo; o recorte
autenticado do Solicitante acrescenta os blocos do formulário e anexos.

A exceção é a seção "Solicitações com características em comum" (issue #211):
ela mostra itens públicos de outras Solicitações, sem Protocolo nem dados
internos, conforme
[`duplicate-detection.md`](duplicate-detection.md).

## Anti-enumeração

- Identidade inválida não distingue “protocolo inexistente” de “dados
  divergentes”.
- A listagem por e-mail só devolve as solicitações do e-mail informado ou da
  sessão.
- O protocolo é gerado por FPE sobre o id interno; não é sequencial nem
  enumerável.
