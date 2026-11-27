# Projeção pública para detecção de duplicidade

**Status:** aceito — 24/11/2026

O RF16 mostra solicitações existentes para solicitantes, inclusive anônimos, e a
RN04 proíbe expor dados de triagem, notas internas e PII de terceiros. Buscar na
tabela `requests` e filtrar na consulta é frágil: qualquer erro de `WHERE`,
contagem ou cache vira oráculo. Decidimos criar `request_public_projections`,
uma projeção curada com `public_id` aleatório, campos públicos e allowlist por
audiência; a API de duplicidade lê **somente** essa projeção.

## Contexto

- O formulário é público por padrão e o acompanhamento aceita identidade sem
  sessão; o alerta precisa funcionar para os dois públicos.
- A tabela `requests` tem PII, texto livre, notas internas, triagem, prioridade e
  responsável; reutilizar o DTO de tracking ou o detalhe interno vaza dados.
- `statuses.is_public` significa "visível ao solicitante", não "publicável";
  `categories.status` significa "ativa", não "publicável".
- Premissa: o sistema é interno (intranet); a RN04 continua valendo entre
  funcionários. Se o portal for exposto ao público, a política de texto precisa
  ser revista.

## Decisão

- `request_public_projections` guarda `public_id` (UUID aleatório), título,
  resumo, categoria, status, período, `publication_status`, `is_publicly_listable`
  e `version`; a busca nunca lê `requests`.
- Solicitações abertas entram só com template (categoria/status/período);
  concluídas nos últimos 3 meses (configurável) entram com texto tarjado por
  regex e fallback para template.
- Restritas, canceladas, duplicadas e fora da janela ficam suprimidas.
- Categorias e status têm allowlist explícita (`is_publicly_listable`,
  `is_duplicate_corpus_eligible`); o padrão é desligado para novos.
- O DTO é um construtor explícito por audiência, sem protocolo, score, total ou
  contagem; o `public_id` não é derivado do protocolo.
- A flag nasce desligada; o canário de RN04 e a categoria/status allowlist
  precisam passar antes de ligar.

## Alternativas consideradas

- **Buscar `requests` com `SELECT` explícito**: mais simples, mas o endpoint vira
  oráculo e a RN04 depende de cada consulta estar correta.
- **View materializada sobre `requests`**: ainda lê a base interna e não resolve
  o problema na origem.
- **Só concluídas no índice público**: mais seguro, mas o alerta não pega
  duplicatas de solicitações ativas; foi rejeitado porque o corpus precisa
  incluir abertas.

## Consequências

- A publicação vira responsabilidade de engenharia: template, tarjamento por
  regex, `redaction_version`, supressão e reconstrução do índice.
- Sem revisão humana, o regex é a única barreira para o texto das concluídas;
  nomes sem contexto podem passar. O canário de RN04 e a flag desligada por
  padrão são obrigatórios.
- O alerta para solicitações abertas é grosseiro (categoria/status/período); a
  duplicata real de uma demanda ativa pode não ser detectada.
- Se o portal for exposto ao público, a política de texto para anônimo precisa ser
  revista.
