# Notificações como projeção por destinatário criada na emissão

**Status**: aceito

As notificações in-app (RF20) são gravadas como projeções por destinatário **dentro da mesma transação** que gera o evento de negócio — uma seam única `emitNotification(trx, evento)` que resolve destinatários pela matriz de audiência, aplica a allowlist do payload e insere as linhas com chave de deduplicação e estado de leitura. A trilha de auditoria (`audit_history`) **não** é usada como fonte de eventos: ela registra a alteração de forma interna (com scores, notas, justificativas e IPs), não tem destinatário, allowlist, deduplicação nem estado de leitura, e derivar notificações dela exigiria reconstruir tudo isso na leitura, sobre formatos não uniformes.

## Alternativas consideradas

- **Derivar da trilha de auditoria**: descartada pelos motivos acima.
- **Outbox durável desde já**: adiada; entra quando o canal de e-mail (RF31) exigir garantia de entrega. O EventEmitter (`node:events`, tipado) transporta apenas o aviso pós-commit (`notifications:committed` com ids) — o banco é a fonte de verdade.

## Consequências

- O formato do evento (`NotificationEvent` + união discriminada de payloads, validado com Zod) vira o contrato que o RF31 consome ao adicionar o canal de e-mail via `NotificationChannel`, sem tocar nos fluxos de negócio.
- A composição segue o padrão do repositório — módulos explícitos, sem container de injeção de dependência; a interface de canal permanece para receber o e-mail do RF31.
- A notificação é um ponteiro: o payload persistido carrega o mínimo e o detalhe (com RBAC) carrega o restante.
