# Configuração do portal

A leitura é pública. A edição é por seção, restrita a Administrador e atômica —
cada seção é salva ou descartada por inteiro.

## Acesso

O modo `PUBLIC`/`AUTHENTICATED` vale imediatamente para as rotas do fluxo do
solicitante, sem cache ou restart.

## Aparência e identidade

- A Aparência é sempre o objeto completo (`light` + `dark`), sem merge parcial.
- Valores nulos na Aparência caem para o default da leitura.
- A identidade da plataforma é nome + máscara de protocolo.

## Assets

- Binário vence o JSON para a mesma chave; chaves ausentes mantêm o valor atual.
- A flag de cor do logo é apresentação, não URL.
- URLs aceitam caminho relativo ou `http(s)`; esquemas executáveis são
  rejeitados.
- O upload pode conter apenas binários, sem a parte JSON.

## Categorias

- Nomes são únicos ignorando maiúsculas/minúsculas.
- Ao menos uma categoria precisa ficar ativa.
- `id` é estável; a ordem do array é a ordem de exibição.
- Categoria inativa permanece registrada e não entra em novos fluxos.

## Status

- Status core (`1, 3, 4, 6, 7, 16, 17`) não podem faltar, ser removidos,
  renomeados, rebaixados, desativados nem ter flags/modos alterados.
- Status restrito exige ambos os modos como `none`.
- Ao menos um Status precisa ficar ativo.
- A leitura inclui Status inativos; eles permanecem registrados e não entram em
  novos fluxos.
- A ordem do array é a ordem de exibição.

As regras de transição estão em
[`requests-lifecycle.md`](requests-lifecycle.md).

## Pesos de priorização

O objeto é completo: todos os critérios ativos precisam de peso. O peso é
inteiro e alimenta diretamente o cálculo de priorização.

## Persistência

Ver
[`docs/database/system-settings-persistence.md`](../database/system-settings-persistence.md).
