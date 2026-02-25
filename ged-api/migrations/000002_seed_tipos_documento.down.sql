-- 000002_seed_tipos_documento.down.sql

DELETE FROM tipos_documento WHERE nome IN (
    'Ofício',
    'Relatório de Execução do Objeto',
    'Relatório de Execução Financeira',
    'Notas Fiscais',
    'Extratos Bancários',
    'Conciliação Bancária',
    'Fotos/Registros Fotográficos'
);
