# Seeds de cenários

Esta pasta contém massas opcionais para demonstração e testes manuais. Ela não
é executada pelo `seed:run` usado na preparação normal do ambiente.

## Uso

Execute todas as seeds-base antes dos cenários:

```bash
npm run docker:seed:run
npm run docker:seed:scenarios:run
```

Para executar apenas um cenário:

```bash
npm run docker:seed:scenarios:run -- --specific=001_dashboard_demo.js
```

## Convenções

- use prefixo numérico quando um cenário depender de outro;
- mantenha cada arquivo idempotente;
- identifique os registros pertencentes ao cenário e remova somente esses
  registros antes de recriá-los;
- não trunque tabelas compartilhadas;
- documente no próprio arquivo quais seeds-base são pré-requisitos.

Assim, novos cenários de usuários, solicitações ou casos de borda podem ser
executados isoladamente ou combinados na ordem dos seus prefixos.
