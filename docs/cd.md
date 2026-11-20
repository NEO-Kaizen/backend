# CD do backend

Workflow de entrega contínua do `NEO-Kaizen/backend` (issue #137). O CI que o
dispara está no `ci.yml` e foi entregue pela issue #143.

O CD publica o backend na VM `desafio03` sem Docker e sem build na VM: o runner do
GitHub monta o artefato, conecta na VPN, envia o pacote por SSH e o `deploy.sh` o
aplica no diretório da aplicação. O processo roda como serviço de usuário
(`systemd --user`), sem `sudo` em nenhuma etapa do pipeline.

## Escopo

Entra neste workflow:

- empacotamento (`dist`, `node_modules` de produção, `assets`, `knexfile.js`,
  `migrations`) no runner;
- aplicação do pacote no diretório da aplicação, com migrations, restart e smoke
  test direto e através do Nginx;
- rollback automático em falha e rollback manual sem rebuild.

Não entra (issues futuras):

- endpoint de health e encerramento gracioso;
- bloco `production` no `knexfile.js`;
- backups do banco;
- zero-downtime;
- restrição do bind do backend a `127.0.0.1`.

## Topologia

```text
GitHub main ── CI (quality + database) ──► CD
                                            │
                       ┌────────────────────┴────────────────────┐
                       │ package: npm ci, check, build, tar       │
                       │ deploy: OpenVPN + SSH + deploy.sh        │
                       └────────────────────┬────────────────────┘
                                            │
navegador ── HTTPS ──► proxy externo ──► Nginx 10.10.0.203:4189
                                            ├── /api/ → 127.0.0.1:3000 (backend)
                                            └── /     → 127.0.0.1:4190 (frontend)
                                                          │
                                                Supabase pooler :6543
```

O vhost `default_server` na porta 80 encaminha para `maat_backend`/`maat_frontend`
e não pertence a este backend. O CD não altera configuração de Nginx.

## Estrutura no host

O deploy é feito no lugar, em `~/NEO/backend`. Nada de releases paralelas ou
symlinks: o artefato sobrescreve `dist/` e `node_modules/`, enquanto `.env` e
`uploads/` nunca são tocados.

```text
~/NEO/backend/
├── dist/                 # substituído a cada deploy
├── node_modules/         # substituído a cada deploy
├── assets/
├── knexfile.js
├── migrations/
├── .env                  # segredos e configuração, preservado
├── uploads/              # arquivos enviados em runtime, preservados
├── .deployed-sha         # commit ativo
├── .previous-sha         # commit do build anterior
├── dist.prev/            # build anterior, usado no rollback
└── node_modules.prev/
```

O `deploy.sh` não fica armazenado na VM: o workflow o envia por SSH a cada
execução, então sempre roda a versão do commit que está sendo publicado. O unit do
systemd também não fica no diretório da aplicação: ele é instalado em
`~/.config/systemd/user/neo-backend.service` no setup inicial, a partir do
`deploy/neo-backend.service` do repositório.

Como o deploy sobrescreve arquivos versionados (`package.json`, `package-lock.json`,
`knexfile.js`, `migrations/`, `assets/`, `dist/`), o diretório deixa de ser um
checkout limpo. Não use `git pull` ali depois do primeiro deploy: o CD é a única
fonte do código. Se quiser evitar confusão, remova o `.git` do diretório após a
primeira publicação.

## Fluxo

| Job       | O que faz                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package` | checkout do SHA, `npm ci`, `npm run check`, `npm run build`, `npm prune --omit=dev`, `tar` do artefato e upload como artifact. Não recebe segredos.              |
| `deploy`  | baixa o artifact, instala e conecta o OpenVPN, configura SSH, envia `release.tgz`, executa `deploy.sh` na VM e publica o resumo. Usa os segredos do repositório. |

O job `deploy` só roda se o `package` passou (ou em rollback manual). O portão de
qualidade é reexecutado no `package` porque um `workflow_dispatch` pode não ter
passado pelo CI.

## Pré-requisitos (uma única vez, no host)

```bash
# 1. serviço de usuário sobrevive ao logout e inicia no boot (única etapa com root)
sudo loginctl enable-linger desafio03

# 2. modo produção: habilita o cookie Secure (o preflight do deploy falha sem isso)
sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' ~/NEO/backend/.env

# 3. instala e habilita o serviço (a partir do repositório local; o primeiro deploy o inicia)
ssh desafio03@desafio03.alphaedtech 'mkdir -p ~/.config/systemd/user'
scp deploy/neo-backend.service desafio03@desafio03.alphaedtech:.config/systemd/user/neo-backend.service
ssh desafio03@desafio03.alphaedtech 'systemctl --user daemon-reload && systemctl --user enable neo-backend'

# 4. confirmações
loginctl show-user desafio03 | grep Linger          # Linger=yes
node -v                                             # v24.x
systemctl --user is-system-running                  # running
```

O unit é estático e usa `%h` (home do usuário), então o mesmo arquivo serve para
`desafio03` ou para uma conta dedicada: `WorkingDirectory` é `%h/NEO/backend` e
`ExecStart` é o Node 24 do nvm daquele usuário. Se o caminho do Node mudar (upgrade
do nvm), atualize o `ExecStart`, repita o `scp` do setup inicial e rode
`systemctl --user daemon-reload`. O preflight do `deploy.sh` falha com mensagem
clara se o `WorkingDirectory` do unit divergir de `DEPLOY_PATH` ou se o binário do
`ExecStart` não existir.

## Segredos e variáveis

Secrets e variables **do repositório** (Settings → Secrets and variables → Actions).
O time não tem acesso a Environments: o job não declara `environment:` e os
segredos não têm escopo por branch.

| Tipo   | Nome              | Conteúdo                                                                  |
| ------ | ----------------- | ------------------------------------------------------------------------- |
| secret | `OVPN_CONFIG`     | perfil de cliente OpenVPN do CI, com `route-nopull` e rota fixa para a VM |
| secret | `SSH_PRIVATE_KEY` | chave dedicada do deploy                                                  |
| secret | `SSH_KNOWN_HOSTS` | saída de `ssh-keyscan 10.10.0.203`, conferida manualmente                 |
| var    | `DEPLOY_HOST`     | `10.10.0.203`                                                             |
| var    | `DEPLOY_PORT`     | `22`                                                                      |
| var    | `DEPLOY_USER`     | `deploy`                                                                  |
| var    | `DEPLOY_PATH`     | `/home/deploy/NEO/backend`                                                |
| var    | `APP_PORT`        | `3000`                                                                    |
| var    | `PUBLIC_PATH`     | `http://10.10.0.203:4189/api/portal-config` (opcional)                    |

O perfil da VPN deve conter `route-nopull` e uma rota explícita para o IP da VM,
para que o tráfego do runner para o GitHub não passe pelo túnel. `DEPLOY_HOST` usa
o IP, e não o nome DNS, para não depender do resolvedor entregue pela VPN.

```ini
# trechos obrigatórios no perfil do CI
route-nopull
route 10.10.0.203 255.255.255.255
auth-nocache
```

`route-nopull` descarta as rotas empurradas pelo servidor; a rota `/32` garante
que apenas a VM de destino entre no túnel. Sem isso, o runner pode perder o acesso
ao GitHub durante o job.

Credenciais do banco nunca entram no GitHub: as migrations leem o `.env` da VM.

## Restrições de segurança

`OVPN_CONFIG` é um perfil **pessoal** de VPN: quem o obtém ganha a identidade de
rede da pessoa, não apenas acesso a esta VM. As proteções abaixo assumem isso.

### No workflow

- o job `package` não recebe segredos;
- o `deploy` só roda para `push` na `main` (`workflow_run.event == 'push'`) ou
  `workflow_dispatch` disparado a partir da `main`;
- o perfil da VPN e a chave SSH são apagados do runner no passo final
  (`if: always()`);
- actions fixadas por SHA de commit.

O filtro `event == 'push'` importa: sem ele, um fork com uma branch chamada `main`
poderia acionar o `workflow_run`.

### Segredos no nível do repositório

Sem Environments, os três segredos ficam no repositório e qualquer workflow do
repositório consegue lê-los — inclusive um `pull_request` adicionado numa branch
não mergeada por alguém com permissão de escrita. O controle passa a ser o acesso
de escrita: trate quem pode dar push como quem tem a VPN.

Se um admin criar o environment `production` com deployment branch `main` e mover
os segredos para lá, basta reintroduzir `environment: production` no job `deploy`
e o escopo por branch volta a valer.

### Proteção dos arquivos que leem o segredo

Quem consegue alterar `.github/workflows/deploy.yml` ou `deploy/deploy.sh` consegue
imprimir `OVPN_CONFIG`. O `.github/CODEOWNERS` marca esses caminhos; para valer, o
ruleset da `main` precisa exigir revisão de code owner. Ajuste os handles no
arquivo.

### No host

Duas opções, em ordem de isolamento:

1. **Conta dedicada `deploy`** (recomendado): sem sudo, dona do diretório da
   aplicação e do serviço. Requer mover a aplicação e instalar Node 24 para a conta
   nova; veja "Conta dedicada" abaixo.
2. **Conta atual `desafio03`**: a chave é restrita a
   `no-agent-forwarding,no-port-forwarding,no-X11-forwarding,no-pty`, e o `sudo` da
   conta exige senha, então o pipeline não escala privilégio.

O gateway da VPN deveria limitar essa conta a `10.10.0.203` tcp/22. Isso é
configuração do servidor, fora do alcance deste repositório — quando existir, um
segredo vazado deixa de dar acesso ao resto da rede.

### Conta dedicada

```bash
# no host, como desafio03 (a senha de sudo é pedida aqui)
sudo useradd -m -s /bin/bash deploy
sudo loginctl enable-linger deploy

# Node 24 para a conta nova (o nvm não vem no sistema)
sudo -iu deploy bash -lc 'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash'
sudo -iu deploy bash -lc 'export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm install 24'

# move a aplicação (está parada, é o momento seguro)
sudo mkdir -p /home/deploy/NEO
sudo mv /home/desafio03/NEO/backend /home/deploy/NEO/backend
sudo chown -R deploy:deploy /home/deploy/NEO/backend
sudo install -d -o deploy -g deploy /home/deploy/NEO/backend/uploads

# autoriza a chave do CI para o novo usuário (a partir do laptop)
# ssh desafio03@desafio03.alphaedtech 'sudo -u deploy bash -lc "umask 077; mkdir -p ~/.ssh; chmod 700 ~/.ssh"'
# { printf 'no-agent-forwarding,no-port-forwarding,no-X11-forwarding,no-pty '; cat ~/.ssh/neo_backend_cd.pub; } \
#   | ssh desafio03@desafio03.alphaedtech 'sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys >/dev/null'
# ssh desafio03@desafio03.alphaedtech 'sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys'
# ssh desafio03@desafio03.alphaedtech "sed -i '/neo-backend-cd/d' ~/.ssh/authorized_keys"

# instala o unit como deploy (a partir do repositório local)
# ssh deploy@10.10.0.203 'mkdir -p ~/.config/systemd/user'
# scp deploy/neo-backend.service deploy@10.10.0.203:.config/systemd/user/neo-backend.service
# ssh deploy@10.10.0.203 'systemctl --user daemon-reload && systemctl --user enable neo-backend'
```

Depois, nas variables do repositório, ajuste `DEPLOY_USER=deploy` e
`DEPLOY_PATH=/home/deploy/NEO/backend` (o `SSH_KNOWN_HOSTS` continua o mesmo). O
unit usa `%h`, então não muda entre as duas contas.

A opção mais restritiva é um **forced command** na `authorized_keys`
(`command="…"`), que impede qualquer comando além do wrapper de deploy. O custo é
perder `scp` (o artefato teria de ir por stdin) e manter a lógica de deploy em um
script fixo no host, fora do versionamento por commit. Só vale se a política de
segurança exigir.

## Operação

- **Automático:** merge na `main` → CI verde → CD. O `workflow_run` só existe
  depois que o `ci.yml` estiver na `main` (issue #143); até lá, use o disparo
  manual.
- **Manual com commit específico:** `workflow_dispatch` com `sha`.
- **Sem migrations:** `workflow_dispatch` com `skip_migrations`.
- **Rollback:** `workflow_dispatch` com `rollback` (não faz build; restaura
  `dist.prev` e `node_modules.prev`).

## O que o `deploy.sh` verifica e faz

Preflight (aborta antes de tocar em qualquer coisa):

1. `~/NEO/backend/.env` existe e contém `NODE_ENV=production`;
2. arquitetura `x64` e Node 24, compatíveis com o artefato;
3. `systemd --user` acessível (linger habilitado);
4. unit instalado, com `WorkingDirectory` igual a `DEPLOY_PATH` e um `ExecStart`
   válido.

Depois:

1. guarda o build atual em `dist.prev`/`node_modules.prev` e o SHA atual em
   `.previous-sha`;
2. extrai o artefato sobre `dist/` e `node_modules/` (sem tocar em `.env` e
   `uploads/`);
3. aplica as migrations pendentes;
4. reinicia o serviço;
5. faz smoke test em `http://127.0.0.1:3000/portal-config` e, quando
   `PUBLIC_PATH` está definido, nesse endereço (a porta que o nginx escuta, não
   `127.0.0.1`);
6. em falha, restaura os diretórios `.prev`, reinicia e falha o job;
7. grava o SHA ativo em `.deployed-sha`.

Sobrescrever `dist/` com o processo em execução é seguro: o Node já carregou os
módulos em memória e o restart só acontece depois que a cópia e as migrations
terminam. Se a cópia falhar, o processo antigo continua servindo.

## Migrations e Supabase

O banco é externo (Supabase) e o `.env` aponta para o pooler na porta `6543`
(transaction mode). Consultas em runtime funcionam. Migrations usam a mesma porta,
mas o modo transação não preserva estado de sessão; se a primeira execução pelo CD
falhar, rode a migration com a porta `5432` (session mode) a partir de um diretório
**sem `.env`** — o `knexfile.js` carrega o arquivo com `dotenv` e `override: true`,
então exportar `DB_PORT` no shell não basta enquanto o `.env` estiver no diretório
de trabalho.

O `deploy.sh` usa `--env development` porque o `knexfile.js` não tem bloco
`production`. Corrigir isso é uma issue separada.

## Rollback

| Nível             | Gatilho                        | Efeito                                              |
| ----------------- | ------------------------------ | --------------------------------------------------- |
| automático        | smoke falha após o restart     | restaura `*.prev`, reinicia e falha o job           |
| manual, sem build | `workflow_dispatch` `rollback` | restaura `*.prev` e reinicia                        |
| manual, com build | `workflow_dispatch` `sha`      | deploy completo daquele commit                      |
| banco             | manual                         | restore no Supabase — migrations não são revertidas |

Na primeira execução não existe snapshot: o rollback fica disponível a partir do
segundo deploy. O snapshot é consumido pelo rollback; um segundo rollback exige um
novo deploy.

O rollback da aplicação **não** desfaz migrations. Trate migrations destrutivas
como operação de risco (issue #142).

## Verificação pós-deploy

```bash
systemctl --user status neo-backend --no-pager
journalctl --user -u neo-backend -n 80 --no-pager
cat ~/NEO/backend/.deployed-sha
curl -fsS http://127.0.0.1:3000/portal-config > /dev/null && echo "direto ok"
curl -fsS http://127.0.0.1:4189/api/portal-config > /dev/null && echo "nginx ok"
```

O smoke test cobre a conexão com o banco, porque `GET /portal-config` lê do
PostgreSQL.

## Limitações conhecidas

- sem `/health`: o smoke usa `GET /portal-config`; não há readiness/liveness;
- sem encerramento gracioso: o restart pode derrubar requisições em andamento;
- `server.listen(PORT)` publica o backend em `0.0.0.0:3000` na rede de laboratório,
  embora o Nginx só use `127.0.0.1`;
- `knexfile.js` sem bloco `production` (workaround `--env development`);
- sem backup no pipeline: responsabilidade do Supabase;
- sem zero-downtime: há uma janela curta de indisponibilidade no restart;
- o artefato não remove arquivos antigos de `dist/` e `node_modules/` que não
  existem mais no build novo (inofensivo, acumula poucos kilobytes);
- o disparo automático depende do `ci.yml` na `main`.

## Primeira execução

1. Cadastrar os secrets e variables do repositório (veja "Segredos e variáveis").
2. Aplicar os pré-requisitos no host (linger e `NODE_ENV=production`) e instalar o unit.
3. Rodar o workflow via `workflow_dispatch`, sem `skip_migrations`.
4. Conferir a seção de verificação pós-deploy.
5. Só então habilitar o disparo automático (merge do `ci.yml` na `main`).

## Referências

- issue #137 — CI/CD do backend;
- issue #143 — workflow de CI;
- issue #142 — rollback da migration de auditoria de mapping;
- `issues/audit-2026-11/03-migrations-destructive.md` — ACH-03-21 e ACH-03-22;
- `issues/audit-2026-11/07-runtime-resilience.md` — ACH-07-04.
