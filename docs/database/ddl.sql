-- ============================================================
-- MODELAGEM DE DADOS — SISTEMA NEO (Solicitações)
-- PostgreSQL 15+
-- ============================================================
--
-- Antes de executar este script, crie o banco:
--   CREATE DATABASE "Sistema NEO";
--   \c "Sistema NEO"
--
-- Depois execute:
--   psql -d "Sistema NEO" -f database/ddl.sql
--
-- ============================================================
-- 1. DOMÍNIOS / ENUMS
-- ============================================================

CREATE TYPE perfil_usuario AS ENUM (
  'solicitante',
  'analista',
  'admin',
  'gestor'
);

CREATE TYPE prioridade_solicitacao AS ENUM (
  'Crítica',
  'Alta',
  'Média',
  'Baixa'
);

CREATE TYPE status_solicitacao AS ENUM (
  'Aguardando triagem',
  'Em triagem',
  'Pendente de informações',
  'Aguardando mapeamento',
  'Mapeamento agendado',
  'Em mapeamento',
  'Em análise de viabilidade',
  'Elegível',
  'Não elegível',
  'Fora do escopo',
  'Priorizado',
  'Backlog',
  'Direcionado para outra área',
  'Em desenvolvimento',
  'Em homologação',
  'Concluído',
  'Cancelado'
);

-- ============================================================
-- 2. TABELAS
-- ============================================================

-- 2.1. SOLICITANTE
-- Armazena usuários do sistema com seus perfis de acesso.
CREATE TABLE solicitante (
  id                SERIAL PRIMARY KEY,
  nome_completo     VARCHAR(255) NOT NULL,
  email_corporativo VARCHAR(255) NOT NULL,
  area_solicitante  VARCHAR(100),
  departamento      VARCHAR(100),
  nome_gestor       VARCHAR(255),
  contato_adicional VARCHAR(255),
  perfil            perfil_usuario NOT NULL DEFAULT 'solicitante',
  criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_solicitante_email ON solicitante (email_corporativo);

-- 2.2. CATEGORIA
-- Catálogo de categorias para classificar solicitações.
CREATE TABLE categoria (
  id      SERIAL PRIMARY KEY,
  nome    VARCHAR(100) NOT NULL,
  ativo   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX idx_categoria_nome ON categoria (nome);

-- 2.3. SOLICITAÇÃO
-- Entidade principal: cada registro representa uma solicitação.
CREATE TABLE solicitacao (
  id                              SERIAL PRIMARY KEY,
  protocolo                       VARCHAR(20) NOT NULL,
  solicitante_id                  INTEGER NOT NULL,
  categoria_id                    INTEGER,
  nome_processo_atual             VARCHAR(255),
  titulo_resumido                 VARCHAR(255),
  descricao_necessidade           TEXT,
  justificativa_resultado         TEXT,
  volumetria_aproximada_mensal    VARCHAR(100),
  tempo_medio_execucao_item       VARCHAR(100),
  impacto_operacional_percebido   TEXT,
  prazo_desejado                  DATE,
  preferencia_horarios_mapeamento TEXT,
  prioridade                      prioridade_solicitacao,
  status                          status_solicitacao NOT NULL DEFAULT 'Aguardando triagem',
  responsavel_id                  INTEGER,
  score_total                     INTEGER CHECK (score_total BETWEEN 0 AND 25),
  data_abertura                   TIMESTAMP NOT NULL DEFAULT NOW(),
  ultima_atualizacao              TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_solicitacao_solicitante
    FOREIGN KEY (solicitante_id) REFERENCES solicitante(id),

  CONSTRAINT fk_solicitacao_categoria
    FOREIGN KEY (categoria_id) REFERENCES categoria(id),

  CONSTRAINT fk_solicitacao_responsavel
    FOREIGN KEY (responsavel_id) REFERENCES solicitante(id)
);

CREATE UNIQUE INDEX idx_solicitacao_protocolo ON solicitacao (protocolo);
CREATE INDEX idx_solicitacao_status ON solicitacao (status);
CREATE INDEX idx_solicitacao_prioridade ON solicitacao (prioridade);
CREATE INDEX idx_solicitacao_solicitante ON solicitacao (solicitante_id);
CREATE INDEX idx_solicitacao_responsavel ON solicitacao (responsavel_id);
CREATE INDEX idx_solicitacao_data_abertura ON solicitacao (data_abertura);

-- 2.4. ANÁLISE DE VIABILIDADE
-- Cada solicitação pode ter uma análise de viabilidade (1:1).
CREATE TABLE analise_viabilidade (
  id                        SERIAL PRIMARY KEY,
  solicitacao_id            INTEGER NOT NULL,
  status_atual              status_solicitacao,
  agendar_mapeamento_manual TIMESTAMP,
  link_reuniao              VARCHAR(500),
  observacoes_internas      TEXT,
  criado_em                 TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em             TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_analise_solicitacao
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id)
);

CREATE UNIQUE INDEX idx_analise_solicitacao ON analise_viabilidade (solicitacao_id);

-- 2.5. PRIORIZAÇÃO
-- Pontuação calculada para cada solicitação (1:1).
CREATE TABLE priorizacao (
  id                        SERIAL PRIMARY KEY,
  solicitacao_id            INTEGER NOT NULL,
  risco                     INTEGER CHECK (risco BETWEEN 1 AND 5),
  urgencia                  INTEGER CHECK (urgencia BETWEEN 1 AND 5),
  volumetria                INTEGER CHECK (volumetria BETWEEN 1 AND 5),
  impacto_operacional       INTEGER CHECK (impacto_operacional BETWEEN 1 AND 5),
  esforco                   INTEGER CHECK (esforco BETWEEN 1 AND 5),

  CONSTRAINT fk_priorizacao_solicitacao
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id)
);

CREATE UNIQUE INDEX idx_priorizacao_solicitacao ON priorizacao (solicitacao_id);

-- 2.6. HISTÓRICO / LOG
-- Auditoria de todas as ações sobre as solicitações.
CREATE TABLE historico_log (
  id              BIGSERIAL PRIMARY KEY,
  solicitacao_id  INTEGER NOT NULL,
  acao            VARCHAR(255) NOT NULL,
  responsavel_id  INTEGER,
  descricao       TEXT,
  criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_log_solicitacao
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id),

  CONSTRAINT fk_log_responsavel
    FOREIGN KEY (responsavel_id) REFERENCES solicitante(id)
);

CREATE INDEX idx_log_solicitacao ON historico_log (solicitacao_id);
CREATE INDEX idx_log_responsavel ON historico_log (responsavel_id);
CREATE INDEX idx_log_criado_em ON historico_log (criado_em);

-- 2.7. ANEXO
-- Documentos anexados às solicitações.
CREATE TABLE anexo (
  id              SERIAL PRIMARY KEY,
  solicitacao_id  INTEGER NOT NULL,
  nome_arquivo    VARCHAR(255) NOT NULL,
  caminho         VARCHAR(500) NOT NULL,
  tipo            VARCHAR(100),
  tamanho_bytes   BIGINT,
  upload_em       TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_anexo_solicitacao
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id)
);

CREATE INDEX idx_anexo_solicitacao ON anexo (solicitacao_id);

-- ============================================================
-- 3. TRIGGER: ATUALIZAR ultima_atualizacao
-- ============================================================

CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_solicitante_atualizado
  BEFORE UPDATE ON solicitante
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TRIGGER trg_solicitacao_atualizado
  BEFORE UPDATE ON solicitacao
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TRIGGER trg_analise_atualizado
  BEFORE UPDATE ON analise_viabilidade
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

-- ============================================================
-- 4. FUNÇÃO: GERAR PROTOCOLO
-- ============================================================

CREATE SEQUENCE seq_protocolo START 1;

CREATE OR REPLACE FUNCTION fn_gerar_protocolo()
RETURNS TRIGGER AS $$
DECLARE
  ano TEXT := TO_CHAR(NOW(), 'YYYY');
  seq TEXT := LPAD(NEXTVAL('seq_protocolo')::TEXT, 6, '0');
BEGIN
  NEW.protocolo := 'NEO-' || ano || '-' || seq;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_solicitacao_protocolo
  BEFORE INSERT ON solicitacao
  FOR EACH ROW EXECUTE FUNCTION fn_gerar_protocolo();

-- ============================================================
-- 5. COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE solicitante IS 'Usuários do sistema (solicitantes, analistas, admins, gestores)';
COMMENT ON TABLE solicitacao IS 'Entidade principal: solicitações registradas no sistema NEO';
COMMENT ON TABLE analise_viabilidade IS 'Análise de viabilidade atrelada a cada solicitação (1:1)';
COMMENT ON TABLE priorizacao IS 'Pontuação de priorização da solicitação (1:1)';
COMMENT ON TABLE historico_log IS 'Registro de auditoria de ações sobre as solicitações';
COMMENT ON TABLE anexo IS 'Arquivos anexados às solicitações';
COMMENT ON TABLE categoria IS 'Catálogo de categorias para classificar solicitações';

COMMENT ON COLUMN solicitacao.protocolo IS 'Formato: NEO-YYYY-NNNNNN';
COMMENT ON COLUMN solicitacao.score_total IS 'Soma dos 5 fatores de priorização (máx. 25)';
COMMENT ON COLUMN analise_viabilidade.link_reuniao IS 'Link para reunião de mapeamento agendada';
