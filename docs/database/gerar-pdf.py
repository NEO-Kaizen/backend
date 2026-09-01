from fpdf import FPDF

class DataModelPDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 16)
        self.cell(0, 10, 'Modelo de Dados - Sistema NEO', align='C', new_x='LMARGIN', new_y='NEXT')
        self.set_font('Helvetica', 'I', 10)
        self.cell(0, 6, 'Diagrama entidade-relacionamento do sistema de solicitacoes', align='C', new_x='LMARGIN', new_y='NEXT')
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Pagina {self.page_no()}/{{nb}}', align='C')

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.set_fill_color(230, 240, 255)
        self.cell(0, 8, title, new_x='LMARGIN', new_y='NEXT', fill=True)
        self.ln(3)

    def render_table(self, name, columns, extra=''):
        self.set_font('Helvetica', 'B', 11)
        self.cell(0, 7, f'Tabela: {name}', new_x='LMARGIN', new_y='NEXT')
        if extra:
            self.set_font('Helvetica', 'I', 9)
            self.multi_cell(0, 5, extra)
            self.ln(1)
        self.set_font('Helvetica', 'B', 9)
        col_w = [40, 50, 30, 50]
        headers = ['Coluna', 'Tipo', 'Restricao', 'Descricao']
        for i, h in enumerate(headers):
            self.cell(col_w[i], 6, h, border=1, fill=True)
        self.ln()
        self.set_font('Courier', '', 8)
        for row in columns:
            for i, val in enumerate(row):
                self.cell(col_w[i], 5, val, border=1)
            self.ln()
        self.ln(5)


pdf = DataModelPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# ------------------------------------------------
# ENUMS
# ------------------------------------------------
pdf.section_title('1. Dominios (ENUMs)')

enums = [
    ['perfil_usuario', 'solicitante, analista, admin, gestor', 'Perfis de acesso ao sistema'],
    ['prioridade_solicitacao', 'Critica, Alta, Media, Baixa', 'Niveis de prioridade'],
    ['status_solicitacao', 'Aguardando triagem, Em triagem, ... (17 estados)', 'Workflow completo'],
]
pdf.set_font('Courier', 'B', 9)
col_w = [50, 100, 30]
for i, h in enumerate(['Nome', 'Valores', 'Descricao']):
    pdf.cell(col_w[i], 6, h, border=1, fill=True)
pdf.ln()
pdf.set_font('Courier', '', 8)
for row in enums:
    for i, val in enumerate(row):
        pdf.cell(col_w[i], 5, val, border=1)
    pdf.ln()
pdf.ln(8)

# ------------------------------------------------
# 2.1 solicitante
# ------------------------------------------------
pdf.section_title('2. Tabelas')

pdf.render_table('solicitante', [
    ['id', 'SERIAL', 'PK', 'Chave primaria'],
    ['nome_completo', 'VARCHAR(255)', 'NOT NULL', 'Nome do usuario'],
    ['email_corporativo', 'VARCHAR(255)', 'UNIQUE NOT NULL', 'Email corporativo'],
    ['area_solicitante', 'VARCHAR(100)', '', 'Area/departamento'],
    ['departamento', 'VARCHAR(100)', '', 'Departamento'],
    ['nome_gestor', 'VARCHAR(255)', '', 'Nome do gestor'],
    ['contato_adicional', 'VARCHAR(255)', '', 'Contato adicional'],
    ['perfil', 'perfil_usuario', 'NOT NULL DEFAULT solicitante', 'Perfil de acesso'],
    ['criado_em', 'TIMESTAMP', 'DEFAULT NOW()', 'Data de criacao'],
    ['atualizado_em', 'TIMESTAMP', 'DEFAULT NOW()', 'Ultima atualizacao'],
], 'Usuarios do sistema com seus perfis de acesso.')

# ------------------------------------------------
# 2.2 categoria
# ------------------------------------------------
pdf.render_table('categoria', [
    ['id', 'SERIAL', 'PK', 'Chave primaria'],
    ['nome', 'VARCHAR(100)', 'UNIQUE NOT NULL', 'Nome da categoria'],
    ['ativo', 'BOOLEAN', 'DEFAULT TRUE', 'Categoria ativa?'],
], 'Catalogo de categorias para classificar solicitacoes.')

# ------------------------------------------------
# 2.3 solicitacao
# ------------------------------------------------
pdf.render_table('solicitacao', [
    ['id', 'SERIAL', 'PK', 'Chave primaria'],
    ['protocolo', 'VARCHAR(20)', 'UNIQUE NOT NULL', 'NEO-YYYY-NNNNNN (gerado auto)'],
    ['solicitante_id', 'INTEGER', 'FK -> solicitante(id)', 'Quem criou'],
    ['categoria_id', 'INTEGER', 'FK -> categoria(id)', 'Categoria'],
    ['nome_processo_atual', 'VARCHAR(255)', '', 'Nome do processo'],
    ['titulo_resumido', 'VARCHAR(255)', '', 'Titulo resumido'],
    ['descricao_necessidade', 'TEXT', '', 'Descricao detalhada'],
    ['justificativa_resultado', 'TEXT', '', 'Justificativa'],
    ['volumetria_aproximada_mensal', 'VARCHAR(100)', '', 'Volumetria mensal'],
    ['tempo_medio_execucao_item', 'VARCHAR(100)', '', 'Tempo medio execucao'],
    ['impacto_operacional_percebido', 'TEXT', '', 'Impacto operacional'],
    ['prazo_desejado', 'DATE', '', 'Prazo desejado'],
    ['preferencia_horarios_mapeamento', 'TEXT', '', 'Preferencia de horarios'],
    ['prioridade', 'prioridade_solicitacao', '', 'Prioridade'],
    ['status', 'status_solicitacao', 'NOT NULL DEFAULT ...', 'Status atual'],
    ['responsavel_id', 'INTEGER', 'FK -> solicitante(id)', 'Analista responsavel'],
    ['score_total', 'INTEGER', 'CHECK 0-25', 'Score de priorizacao'],
    ['data_abertura', 'TIMESTAMP', 'DEFAULT NOW()', 'Data de abertura'],
    ['ultima_atualizacao', 'TIMESTAMP', 'DEFAULT NOW()', 'Ultima atualizacao'],
], 'Entidade principal: solicitacoes registradas no sistema.')

# ------------------------------------------------
# 2.4 analise_viabilidade
# ------------------------------------------------
pdf.render_table('analise_viabilidade', [
    ['id', 'SERIAL', 'PK', 'Chave primaria'],
    ['solicitacao_id', 'INTEGER', 'FK UNIQUE -> solicitacao(id)', 'Solicitacao (1:1)'],
    ['status_atual', 'status_solicitacao', '', 'Status na analise'],
    ['agendar_mapeamento_manual', 'TIMESTAMP', '', 'Agendamento'],
    ['link_reuniao', 'VARCHAR(500)', '', 'Link da reuniao'],
    ['observacoes_internas', 'TEXT', '', 'Observacoes restritas'],
    ['criado_em', 'TIMESTAMP', 'DEFAULT NOW()', 'Data de criacao'],
    ['atualizado_em', 'TIMESTAMP', 'DEFAULT NOW()', 'Ultima atualizacao'],
], 'Analise de viabilidade (1:1 com solicitacao).')

# ------------------------------------------------
# 2.5 priorizacao
# ------------------------------------------------
pdf.render_table('priorizacao', [
    ['id', 'SERIAL', 'PK', 'Chave primaria'],
    ['solicitacao_id', 'INTEGER', 'FK UNIQUE -> solicitacao(id)', 'Solicitacao (1:1)'],
    ['risco', 'INTEGER', 'CHECK 1-5', 'Fator risco'],
    ['urgencia', 'INTEGER', 'CHECK 1-5', 'Fator urgencia'],
    ['volumetria', 'INTEGER', 'CHECK 1-5', 'Fator volumetria'],
    ['impacto_operacional', 'INTEGER', 'CHECK 1-5', 'Fator impacto'],
    ['esforco', 'INTEGER', 'CHECK 1-5', 'Fator esforco'],
], 'Calculo de priorizacao (1:1 com solicitacao). Score total = soma dos 5 fatores (max 25).')

# ------------------------------------------------
# 2.6 historico_log
# ------------------------------------------------
pdf.render_table('historico_log', [
    ['id', 'BIGSERIAL', 'PK', 'Chave primaria'],
    ['solicitacao_id', 'INTEGER', 'FK -> solicitacao(id)', 'Solicitacao'],
    ['acao', 'VARCHAR(255)', 'NOT NULL', 'Acao realizada'],
    ['responsavel_id', 'INTEGER', 'FK -> solicitante(id)', 'Quem executou'],
    ['descricao', 'TEXT', '', 'Descricao detalhada'],
    ['criado_em', 'TIMESTAMP', 'DEFAULT NOW()', 'Data do evento'],
], 'Auditoria de todas as acoes sobre as solicitacoes.')

# ------------------------------------------------
# 2.7 anexo
# ------------------------------------------------
pdf.render_table('anexo', [
    ['id', 'SERIAL', 'PK', 'Chave primaria'],
    ['solicitacao_id', 'INTEGER', 'FK -> solicitacao(id)', 'Solicitacao'],
    ['nome_arquivo', 'VARCHAR(255)', 'NOT NULL', 'Nome do arquivo'],
    ['caminho', 'VARCHAR(500)', 'NOT NULL', 'Caminho do arquivo'],
    ['tipo', 'VARCHAR(100)', '', 'Tipo MIME'],
    ['tamanho_bytes', 'BIGINT', '', 'Tamanho em bytes'],
    ['upload_em', 'TIMESTAMP', 'DEFAULT NOW()', 'Data do upload'],
], 'Arquivos anexados as solicitacoes.')

# ------------------------------------------------
# RELACIONAMENTOS
# ------------------------------------------------
pdf.add_page()
pdf.section_title('3. Relacionamentos')

rels = [
    ('solicitante', 'solicitacao', '1:N', 'Um solicitante cria varias solicitacoes'),
    ('solicitante (resp)', 'solicitacao', '1:N', 'Analista responsavel por N solicitacoes'),
    ('solicitacao', 'analise_viabilidade', '1:1', 'Cada solicitacao tem uma analise'),
    ('solicitacao', 'priorizacao', '1:1', 'Cada solicitacao tem um score'),
    ('solicitacao', 'historico_log', '1:N', 'Cada solicitacao gera N logs'),
    ('solicitacao', 'anexo', '1:N', 'Cada solicitacao tem N anexos'),
    ('solicitacao', 'categoria', 'N:1', 'Cada solicitacao tem uma categoria'),
]
pdf.set_font('Helvetica', 'B', 9)
col_w = [50, 50, 20, 60]
for i, h in enumerate(['Origem', 'Destino', 'Card.', 'Descricao']):
    pdf.cell(col_w[i], 6, h, border=1, fill=True)
pdf.ln()
pdf.set_font('Courier', '', 9)
for row in rels:
    for i, val in enumerate(row):
        pdf.cell(col_w[i], 6, val, border=1)
    pdf.ln()
pdf.ln(8)

# ------------------------------------------------
# DIAGRAMA ASCII
# ------------------------------------------------
pdf.section_title('4. Diagrama Esquematico')
pdf.set_font('Courier', '', 7)
diagram = r"""
 solicitante (1) ---< solicitacao (N)
                        |
                        +-- (1:1) analise_viabilidade
                        +-- (1:1) priorizacao
                        +-- (1:N) historico_log
                        +-- (1:N) anexo
                   (N)---+ (1) categoria
"""
pdf.multi_cell(0, 4, diagram)
pdf.ln(5)

# ------------------------------------------------
# INSTRUCOES
# ------------------------------------------------
pdf.section_title('5. Como executar')
pdf.set_font('Helvetica', '', 10)
pdf.multi_cell(0, 6, (
    '1. Crie o banco de dados:\n\n'
    '     CREATE DATABASE "Sistema NEO";\n\n'
    '2. Execute o script:\n\n'
    '     psql -d "Sistema NEO" -f database/ddl.sql\n\n'
    'Ou dentro do psql:\n\n'
    '     \\c "Sistema NEO"\n'
    '     \\i database/ddl.sql'
))

# ------------------------------------------------
# SALVAR
# ------------------------------------------------
pdf.output('/home/fcochagas/meu-projeto/database/modelagem-dados-neo.pdf')
print('PDF gerado com sucesso!')
