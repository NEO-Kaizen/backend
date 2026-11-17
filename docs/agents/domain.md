# Documentação de domínio

Como as skills de engenharia devem consumir a documentação de domínio deste
repositório ao explorar o código.

## Antes de explorar, leia

- **`GLOSSARY.md`** na raiz do repositório, ou
- **`GLOSSARY-MAP.md`** na raiz do repositório, se existir: ele aponta para um `GLOSSARY.md` por contexto. Leia cada um que for relevante para o tópico.
- **`docs/adr/`**: leia os ADRs que tocam a área em que você vai trabalhar. Em repositórios multi-contexto, verifique também `src/<context>/docs/adr/` para decisões específicas do contexto.

Se algum desses arquivos não existir, **prossiga em silêncio**. Não sinalize a
ausência; não sugira criá-los de antemão. A skill `/domain-modeling` (acessada
via `/grill-with-docs` e `/improve-codebase-architecture`) os cria sob demanda
quando termos ou decisões forem realmente resolvidos.

## Estrutura de arquivos

Repositório de contexto único (a maioria dos repositórios):

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Repositório multi-contexto (presença de `GLOSSARY-MAP.md` na raiz):

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← decisões do sistema como um todo
└── src/
    ├── ordering/
    │   ├── GLOSSARY.md
    │   └── docs/adr/                  ← decisões específicas do contexto
    └── billing/
        ├── GLOSSARY.md
        └── docs/adr/
```

## Use o vocabulário do glossário

Quando sua saída nomear um conceito de domínio (em um título de issue, uma
proposta de refatoração, uma hipótese, um nome de teste), use o termo como
definido em `GLOSSARY.md`. Não derive para sinônimos que o glossário evita
explicitamente.

Se o conceito de que você precisa ainda não estiver no glossário, isso é um
sinal: ou você está inventando linguagem que o projeto não usa (reconsidere), ou
há uma lacuna real (anote para `/domain-modeling`).

## Sinalize conflitos com ADRs

Se sua saída contradisser um ADR existente, exponha isso explicitamente em vez
de sobrescrevê-lo em silêncio:

> _Contradiz o ADR-0007 (pedidos com event sourcing), mas vale reabrir porque…_
