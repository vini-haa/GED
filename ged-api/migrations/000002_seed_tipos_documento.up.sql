-- 000002_seed_tipos_documento.up.sql

INSERT INTO tipos_documento (nome, descricao) VALUES
    ('Ofício', 'Documentos oficiais e correspondências'),
    ('Relatório de Execução do Objeto', 'Relatórios técnicos de execução do projeto'),
    ('Relatório de Execução Financeira', 'Relatórios financeiros e prestação de contas'),
    ('Notas Fiscais', 'Notas fiscais de serviços e produtos'),
    ('Extratos Bancários', 'Extratos de contas bancárias do projeto'),
    ('Conciliação Bancária', 'Documentos de conciliação bancária'),
    ('Fotos/Registros Fotográficos', 'Registros fotográficos de atividades e eventos');
