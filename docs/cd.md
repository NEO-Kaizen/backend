# CD do backend

Workflow de entrega contínua do `NEO-Kaizen/backend` (issue #137). O CI que o
dispara está no `ci.yml` e foi entregue pela issue #143.

O CD publica o backend na VM de produção sem Docker e sem build na VM: o runner do
GitHub monta o artefato, conecta na VPN, envia o pacote por SSH e o `deploy.sh` o
aplica no diretório da aplicação. O processo roda como serviço de usuário
(`systemd --user`), sem `sudo` **na VM**. O runner usa `sudo` para instalar o
OpenVPN, abrir o túnel e encerrá-lo.

Este documento é público: use placeholders para hosts, IPs e portas internas. Os
valores reais ficam nas variables/secrets do repositório e em um runbook privado.

## Escopo

Entra neste workflow:

- empacotamento (`dist`, `node_modules` de produção, `assets`, `package.json`,
  `package-lock.json`, `knexfile.js`, `migrations`) no runner;
- aplicação do pacote no diretório da aplicação, com migrations, restart e smoke
  test direto e através do Nginx;
- rollback automático em qualquer falha depois do snapshot e rollback manual sem
  rebuild.

Não entra (issues futuras):

- endpoint de health e encerramento gracioso;
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
navegador ── HTTPS ──► proxy externo ──► Nginx <deploy-host>:<nginx-port>
                                            ├── /api/ → 127.0.0.1:<app-port>
                                            └── /     → 127.0.0.1:<frontend-port>
                                                          │
                                                banco PostgreSQL externo
```

O vhost `default_server` na porta 80 encaminha para outros backends e não
pertence a este projeto. O CD não altera configuração de Nginx.

## Estrutura no host

O deploy é feito no lugar, em `~/NEO/backend`. Nada de releases paralelas ou
symlinks: o artefato é extraído em `.deploy-staging/`, trocado pelos arquivos da
aplicação e o release anterior fica em `.deploy-previous/`. `.env` e `uploads/`
nunca são tocados.

```text
~/NEO/backend/
├── dist/                 # substituído a cada deploy
├── node_modules/         # substituído a cada deploy
├── assets/
├── knexfile.js
├── migrations/
├── package.json
├── package-lock.json
├── .env                  # segredos e configuração, preservado
├── uploads/              # arquivos enviados em runtime, preservados
├── .deployed-sha         # commit ativo
├── .deploy-previous/     # release anterior completo, usado no rollback
├── .deploy-staging/      # temporário durante o deploy
└── .deploy-lock          # flock que serializa deploys
```

O snapshot inclui **todos** os arquivos que o pacote sobrescreve (`dist`,
`node_modules`, `assets`, `package.json`, `package-lock.json`, `knexfile.js` e
`migrations`), além do `.deployed-sha`. Por isso o rollback devolve o release
anterior inteiro, e não apenas `dist`/`node_modules`.

O `deploy.sh` não fica armazenado na VM: o workflow o envia por SSH a cada
execução, então sempre roda a versão do commit que está sendo publicado. O unit do
systemd também não fica no diretório da aplicação: ele é instalado em
`~/.config/systemd/user/neo-backend.service` no setup inicial, a partir do
`deploy/neo-backend.service` do repositório.

Como o deploy sobrescreve arquivos versionados, o diretório deixa de ser um
checkout limpo. Não use `git pull` ali depois do primeiro deploy: o CD é a única
fonte do código. Se quiser evitar confusão, remova o `.git` do diretório após a
primeira publicação.

## Fluxo

| Job       | O que faz                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify`  | só em PR que mexe em `deploy/**` ou nos workflows: `actionlint`, `shellcheck` e os testes de argumentos do `deploy.sh`. Não recebe segredos.                     |
| `gate`    | resolve o SHA, exige que ele seja ancestral do topo da `main`, que a CI de `push` tenha passado e que ele ainda seja o topo; para `rollback`, só valida o ref.   |
| `package` | checkout do SHA, `npm ci`, `npm run check`, `npm run build`, `npm prune --omit=dev`, `tar` do artefato e upload como artifact. Não recebe segredos.              |
| `deploy`  | baixa o artifact, instala e conecta o OpenVPN, configura SSH, envia `release.tgz`, executa `deploy.sh` na VM e publica o resumo. Usa os segredos do repositório. |

O job `deploy` só roda se o `gate` e o `package` passaram, ou em rollback manual.
O `gate` também impede deploys fora de ordem: quando um `workflow_run` antigo
termina depois de um commit mais novo na `main`, o SHA não é mais o topo e o
deploy é pulado. O `deploy` repete essa checagem com a API do GitHub
imediatamente antes de publicar. O `concurrency` fica só no job `deploy`, então
os PRs que rodam o `verify` não entram na fila de produção.

## Pré-requisitos (uma única vez, no host)

O caminho recomendado é uma conta dedicada `deploy`, dona da aplicação e do
serviço de usuário. Se a aplicação ainda está em `<old-user>`, faça a migração uma
vez e depois siga esta seção.

```bash
# no host, como um usuário com sudo (a senha é pedida só no setup)
sudo useradd -m -s /bin/bash deploy
sudo loginctl enable-linger deploy

# Node 24 para a conta nova (o nvm não vem no sistema)
sudo -iu deploy bash -lc 'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash'
sudo -iu deploy bash -lc 'export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm install 24.21.0'

# migrando de <old-user>: mova a aplicação parada (pule este bloco num host novo)
sudo mkdir -p /home/deploy/NEO
sudo mv /home/<old-user>/NEO/backend /home/deploy/NEO/backend
sudo chown -R deploy:deploy /home/deploy/NEO/backend
sudo install -d -o deploy -g deploy /home/deploy/NEO/backend/uploads

# modo produção: habilita o cookie Secure (o preflight falha sem isso)
sudo -iu deploy bash -c '
  env_file="$HOME/NEO/backend/.env"
  if grep -q "^NODE_ENV=" "$env_file"; then
    sed -i "s/^NODE_ENV=.*/NODE_ENV=production/" "$env_file"
  else
    printf "NODE_ENV=production\n" >> "$env_file"
  fi
'

# a aplicação precisa existir aqui, com o .env de produção. Num host novo,
# copie o diretório (sem dist/node_modules, que vêm no artefato) ou clone o
# repositório uma vez antes do primeiro deploy.

# autorize a chave do CI (e a sua) na conta deploy antes de conectar como ela
ssh <old-user>@<deploy-host> 'sudo -u deploy bash -lc "umask 077; mkdir -p ~/.ssh; chmod 700 ~/.ssh"'
{ printf 'no-agent-forwarding,no-port-forwarding,no-X11-forwarding,no-pty '; cat ~/.ssh/neo_backend_cd.pub; } |
  ssh <old-user>@<deploy-host> 'sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys >/dev/null'
ssh <old-user>@<deploy-host> 'sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys'

# instala e habilita o serviço (a partir do repositório local; o primeiro deploy o inicia)
ssh deploy@<deploy-host> 'mkdir -p ~/.config/systemd/user'
scp deploy/neo-backend.service deploy@<deploy-host>:.config/systemd/user/neo-backend.service
ssh deploy@<deploy-host> 'systemctl --user daemon-reload && systemctl --user enable neo-backend'

# confirmações
loginctl show-user deploy -p Linger       # Linger=yes
sudo -iu deploy bash -lc 'node -v'        # v24.21.0
sudo -iu deploy bash -lc 'systemctl --user is-system-running'  # running
```

Antes da primeira publicação, confirme no `.env` da VM:

- `NODE_ENV=production`;
- `PORT` igual à variable `APP_PORT` (o preflight compara os dois);
- `DB_PORT` do pooler de runtime (normalmente `6543`);
- as credenciais de banco, JWT e FPE que a aplicação já usa.

O unit é estático e usa `%h` (home do usuário), então o mesmo arquivo serve para
`deploy` ou para outra conta: `WorkingDirectory` é `%h/NEO/backend` e `ExecStart` é
o Node 24 do nvm daquele usuário. Se o caminho do Node mudar (upgrade do nvm),
atualize o `ExecStart`, repita o `scp` do setup e rode `systemctl --user
daemon-reload`. O preflight falha com mensagem clara se o `WorkingDirectory`
divergir de `DEPLOY_PATH`, se o binário do `ExecStart` não existir ou se o linger
estiver desligado.

O ideal é um **forced command** na `authorized_keys` que aceite apenas o wrapper
de deploy. O custo é perder `scp` (o artefato teria de ir por stdin) e manter a
lógica de deploy em um script fixo no host, fora do versionamento por commit. Só
vale se a política de segurança exigir.

## Segredos e variáveis

Secrets e variables **do repositório** (Settings → Secrets and variables → Actions).
O time não tem acesso a Environments: o job não declara `environment:` e os
segredos não têm escopo por branch.

| Tipo   | Nome                | Conteúdo                                                                  |
| ------ | ------------------- | ------------------------------------------------------------------------- |
| secret | `OVPN_CONFIG`       | perfil de cliente OpenVPN do CI, com `route-nopull` e rota fixa para a VM |
| secret | `SSH_PRIVATE_KEY`   | chave dedicada do deploy                                                  |
| secret | `SSH_KNOWN_HOSTS`   | saída de `ssh-keyscan <deploy-host>`, conferida manualmente               |
| var    | `DEPLOY_HOST`       | IP ou nome da VM na VPN                                                   |
| var    | `DEPLOY_PORT`       | `22`                                                                      |
| var    | `DEPLOY_USER`       | `deploy`                                                                  |
| var    | `DEPLOY_PATH`       | `/home/deploy/NEO/backend`                                                |
| var    | `APP_PORT`          | porta do backend (igual a `PORT` no `.env`)                               |
| var    | `PUBLIC_PATH`       | URL de smoke pelo Nginx, no endereço em que o Nginx escuta (opcional)     |
| var    | `MIGRATION_DB_PORT` | porta usada só pelas migrations (opcional; default `5432`)                |

`PUBLIC_PATH` deve usar o endereço real do Nginx (por exemplo
`http://<deploy-host>:<nginx-port>/api/portal-config`), não `127.0.0.1`, a menos
que o Nginx esteja de fato escutando em loopback. Sem `PUBLIC_PATH`, o smoke
público é pulado e só o smoke direto roda.

O perfil da VPN deve conter `route-nopull` e uma rota explícita para o IP da VM,
para que o tráfego do runner para o GitHub não passe pelo túnel. Prefira o IP ao
nome DNS para não depender do resolvedor entregue pela VPN.

```ini
# trechos obrigatórios no perfil do CI
route-nopull
route <deploy-ip> 255.255.255.255
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

- o job `package` e o `verify` não recebem segredos;
- o `deploy` só roda para `push` na `main` (`workflow_run.event == 'push'`) ou
  `workflow_dispatch`;
- no disparo manual, o `gate` sempre avalia o topo da `main`: o ref escolhido na
  UI/API é aceito apenas se o SHA for ancestral e igual ao topo;
- o `gate` exige que o SHA seja ancestral do topo da `main`, que seja o próprio
  topo e que exista uma execução verde da CI de `push` para ele;
- não existe input de `sha`: o deploy manual publica o topo da `main`, então não
  há como executar código de branch não mergeada na VM;
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

- a conta `deploy` não tem sudo;
- a chave do CI é dedicada e restrita a
  `no-agent-forwarding,no-port-forwarding,no-X11-forwarding,no-pty`;
- o gateway da VPN deveria limitar essa conta a `<deploy-host>` tcp/22. Isso é
  configuração do servidor, fora do alcance deste repositório.

## Operação

- **Automático:** merge na `main` → CI verde → CD. O `workflow_run` só existe
  depois que o `ci.yml` estiver na `main`; até lá, use o disparo manual.
- **Manual:** `workflow_dispatch` a partir da `main`, sem input de SHA. O `gate`
  aceita apenas o topo da `main` e exige CI de `push` verde.
- **Sem migrations:** `workflow_dispatch` com `skip_migrations`.
- **Rollback:** `workflow_dispatch` com `rollback` (não faz build; restaura
  `.deploy-previous` inteiro).

## O que o `deploy.sh` verifica e faz

Preflight (aborta antes de tocar em qualquer coisa):

1. `~/NEO/backend/.env` existe e contém `NODE_ENV=production`;
2. `APP_PORT` é igual ao `PORT` do `.env`;
3. o `ExecStart` do unit aponta para um Node 24 `x64` existente;
4. o linger está ligado para o usuário e o `systemd --user` responde;
5. o unit existe e `WorkingDirectory` é igual a `DEPLOY_PATH`.

Depois:

1. copia o release atual completo para `.deploy-previous/`, incluindo o SHA ativo;
2. extrai o artefato em `.deploy-staging/` e confere que todos os caminhos
   esperados estão presentes;
3. troca os arquivos da aplicação pelos do staging (sem tocar em `.env` e
   `uploads/`);
4. aplica as migrations pendentes com `--env production` e porta de sessão;
5. reinicia o serviço;
6. faz smoke test em `http://127.0.0.1:<app-port>/portal-config` e, quando
   `PUBLIC_PATH` está definido, nesse endereço;
7. em **qualquer** falha a partir do snapshot, restaura `.deploy-previous`
   inteiro, reinicia e falha o job;
8. em sucesso, grava o SHA ativo em `.deployed-sha`.

Sobrescrever `dist/` com o processo em execução é seguro: o Node já carregou os
módulos em memória e o restart só acontece depois que a troca e as migrations
terminam. Se a troca ou uma migration falhar, o processo antigo continua servindo
até o restart, e o snapshot é restaurado.

O rollback automático usa um `trap ERR` (com `set -E`) e `restore_snapshot()`
confere cada comando explicitamente, sem depender do `set -e` dentro da função
(ShellCheck SC2310). Antes de escrever, o script adquire `.deploy-lock` com
`flock`; uma execução manual concorrente com o pipeline falha com mensagem clara.

## Migrations e Supabase

O banco é externo (Supabase). O `.env` aponta para o pooler na porta `6543`
(transaction mode) para o runtime. O `knexfile.js` tem um bloco `production`, e o
`deploy.sh` roda migrations com `--env production`. A porta default das migrations
é `5432` (session mode), porque transaction mode não preserva estado de sessão e
não é o modo recomendado para migrations. `MIGRATION_DB_PORT` (variable do
repositório ou `.env`) pode substituir esse default.

O workflow repassa a variable `MIGRATION_DB_PORT` ao shell remoto e o `deploy.sh`
a define para o comando de migrations. O `.env` tem precedência por causa do
`override: true`; o serviço de runtime não usa essa variável.

Se o pooler do projeto não aceitar session mode na `5432`, use a conexão direta do
Supabase no `.env` ou ajuste `MIGRATION_DB_PORT` (variable do repositório ou `.env`
da VM) para a porta correta antes de rodar o workflow. O smoke test cobre a conexão
de runtime, porque `GET /portal-config` lê do PostgreSQL.

Migrations destrutivas continuam sendo operação de risco (issue #142).

## Rollback

| Nível             | Gatilho                            | Efeito                                                      |
| ----------------- | ---------------------------------- | ----------------------------------------------------------- |
| automático        | qualquer falha após o snapshot     | restaura `.deploy-previous` inteiro, reinicia e falha o job |
| manual, sem build | `workflow_dispatch` `rollback`     | restaura `.deploy-previous` e reinicia                      |
| manual, com build | `workflow_dispatch` (topo da main) | deploy completo do commit atual da `main`                   |
| banco             | manual                             | restore no Supabase — migrations não são revertidas         |

Na primeira execução não existe snapshot completo em `.deploy-previous`, então não
há rollback
disponível. O snapshot é consumido pelo rollback; um segundo rollback exige um
novo deploy.

O rollback da aplicação **não** desfaz migrations. Trate migrations destrutivas
como operação de risco (issue #142).

## Verificação pós-deploy

```bash
systemctl --user status neo-backend --no-pager
journalctl --user -u neo-backend -n 80 --no-pager
cat ~/NEO/backend/.deployed-sha
curl -fsS "http://127.0.0.1:<app-port>/portal-config" > /dev/null && echo "direto ok"
curl -fsS "http://<deploy-host>:<nginx-port>/api/portal-config" > /dev/null && echo "nginx ok"
```

O smoke test cobre a conexão com o banco, porque `GET /portal-config` lê do
PostgreSQL.

## Testes do deploy

O workflow `CD` roda em PRs que alteram `deploy/**` ou os workflows:

- `actionlint` nos dois workflows (`.github/workflows/deploy.yml` e `ci.yml`);
- `shellcheck` no `deploy.sh` e no `deploy.test.sh`;
- `bash deploy/deploy.test.sh`, que exercita o parsing de argumentos nos formatos
  suportados (`<sha>`, `<sha> ""`, `<sha> --skip-migrations`, `--rollback`) e nos
  casos de erro.

Localmente:

```bash
bash -n deploy/deploy.sh
bash deploy/deploy.test.sh
shellcheck deploy/deploy.sh deploy/deploy.test.sh
```

## Limitações conhecidas

- sem `/health`: o smoke usa `GET /portal-config`; não há readiness/liveness;
- sem encerramento gracioso: o restart pode derrubar requisições em andamento;
- a troca de arquivos e o restart não são atômicos: há uma janela curta de
  indisponibilidade e de arquivos novos com processo antigo;
- `server.listen(PORT)` publica o backend em `0.0.0.0:<app-port>` na rede do
  laboratório, embora o Nginx só use `127.0.0.1`;
- sem backup no pipeline: responsabilidade do Supabase;
- o rollback não reverte migrations;
- o disparo automático depende do `ci.yml` na `main`.

## Primeira execução

1. Cadastrar os secrets e variables do repositório (veja "Segredos e variáveis").
2. Aplicar o setup único no host (conta `deploy`, linger, Node 24, `.env` e unit).
3. Rodar o workflow via `workflow_dispatch`, sem `skip_migrations`.
4. Conferir a seção de verificação pós-deploy.
5. Validar o rollback com um `workflow_dispatch` com `rollback` (depois de um
   segundo deploy, para existir `.deploy-previous`).
6. Só então habilitar o disparo automático (merge do `ci.yml` na `main`).

## Referências

- issue #137 — CI/CD do backend;
- issue #143 — workflow de CI;
- issue #142 — rollback da migration de auditoria de mapping;
- `docs/ci.md` — checks executados pela CI.
