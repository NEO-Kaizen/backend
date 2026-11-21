# Usuários, perfis e autoatendimento

## Extensões 1:1

- Todo usuário criado pela API nasce com a extensão de **solicitante**.
- Apenas o perfil `analista` nasce com a extensão **profissional**; os demais não
  podem recebê-la.
- Capacidade e rotação do profissional são persistidas, mas não fazem parte do
  bloco exposto ao usuário.

## Perfis

Os únicos nomes de Perfil aceitos hoje são `solicitante`, `analista`, `gestor` e
`administrador`. Um nome existente no banco fora dessa lista é uma falha de
configuração, não um perfil novo.

## Criação

- Exige os dados básicos, o bloco de solicitante e, para analista, o bloco
  profissional; nos demais perfis o bloco profissional é proibido.
- Não é permitido criar conta de Administrador pela API.
- A senha temporária é aleatória, exibida uma única vez e marca troca
  obrigatória.
- Usuário, extensões e auditoria são gravados na mesma transação.
- E-mail duplicado é recusado.

## Edição administrativa

- `requester` faz merge campo a campo.
- `professional` é **substituição integral**, não merge.
- Trocar para analista exige o bloco profissional; usá-lo em perfil não-analista
  é inválido.
- Rebaixar um analista remove a linha profissional.
- Contas de Administrador só podem ter o bloco de solicitante alterado.
- Promover qualquer usuário a Administrador é bloqueado.
- O próprio ator não pode editar a própria conta por esta rota.

## Autoatendimento

- O usuário pode alterar o próprio nome, o contato adicional e o avatar.
- Área, departamento e gestor só podem ser alterados pelo próprio Administrador.
- E-mail, Perfil e bloco profissional são imutáveis por esta rota.
- O bloco de solicitante sofre **UPSERT**: se a linha não existir, é criada.
- O nome é sincronizado com o cadastro de solicitante.
- Enviar avatar e pedir remoção na mesma chamada é inválido.
- Cadastros legados podem ter bloco de solicitante nulo; analista legado sem
  linha profissional recebe um bloco sintético vazio.

> O escopo mais amplo de autoatendimento descrito na issue #125 é uma decisão
> pendente; ver [`README.md`](README.md).

## Status da conta

- Alterar a própria conta é recusado, assim como gerenciar uma conta de
  Administrador.
- Conta com troca de senha pendente fica bloqueada até concluir a troca.
- Redefinir senha gera nova senha temporária e marca a troca como obrigatória.
- Desativar não apaga dados; solicitações e auditoria permanecem.

## Métricas

- `total` — todos os usuários.
- `active` — contas ativas.
- `pending` — troca de senha pendente, **independente** de a conta estar ativa.
- `admins` — perfil exatamente `administrador`, comparação case-sensitive.

## Listagens

- A listagem administrativa é restrita a Administrador.
- A lista de analistas para atribuição hoje exige apenas sessão — qualquer perfil
  autenticado consegue lê-la, e a resposta inclui notas internas. Restringir o
  acesso ou remover as notas é dívida de segurança.
