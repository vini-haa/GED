**FADEX**

Fundação Cultural e de Fomento à Pesquisa, Ensino,

Extensão e Inovação

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

**GED FADEX v4.0**

Gestão Eletrônica de Documentos

**PLANO DE DIVISÃO DE TRABALHO**

  ---------------------------- ------------------------------------------
  **Versão:**                  4.0 Final

  **Data:**                    Fevereiro/2025

  **Equipe:**                  1 Dev Júnior + 1 Estagiário

  **Duração:**                 11 semanas

  **Status:**                  Aprovado para Desenvolvimento
  ---------------------------- ------------------------------------------

**1. Visão Geral da Divisão**

A divisão segue um princípio claro: o Dev Júnior assume a complexidade
técnica (backend Go, integrações, banco de dados, segurança) e o
Estagiário assume a construção visual (interface, componentes,
interações) com tarefas bem definidas e feedback visual imediato no
navegador.

  -----------------------------------------------------------------------
  O Estagiário desenvolve o frontend com dados mockados enquanto o Júnior
  implementa a API real. Quando os dois lados ficam prontos, a integração
  é plug-and-play. Isso minimiza bloqueios e maximiza produtividade.

  -----------------------------------------------------------------------

**1.1 Responsabilidades Macro**

  ----------------------------- -------------------- --------------------
  **Área**                      **Dev Júnior**       **Estagiário**

  API Go (Gin, endpoints,       ✅ Responsável       ---
  middlewares)                                       

  Conexão SQL Server (SAGI)     ✅ Responsável       ---

  Conexão PostgreSQL            ✅ Responsável       ---
  (migrations, queries)                              

  Google Drive                  ✅ Responsável       ---
  (upload/download)                                  

  Autenticação JWT / RBAC       ✅ Responsável       ---

  Docker Compose /              ✅ Responsável       ---
  Infraestrutura                                     

  Geração de arquivos (PDF,     ✅ Responsável       ---
  Excel, ZIP)                                        

  Next.js (páginas, rotas,      ---                  ✅ Responsável
  layout)                                            

  Componentes React (UI)        ---                  ✅ Responsável

  TanStack Query (hooks, cache) ---                  ✅ Responsável

  Gráficos (Recharts)           ---                  ✅ Responsável

  Temas light/dark              ---                  ✅ Responsável

  Tipos TypeScript              🤝 Conjunto          🤝 Conjunto
  compartilhados                                     

  Integração frontend ↔ backend 🤝 Conjunto          🤝 Conjunto

  Testes integrados             🤝 Conjunto          🤝 Conjunto
  ----------------------------- -------------------- --------------------

**2. Pré-Requisitos (Antes da Semana 1)**

**2.1 Tarefas do Dev Júnior**

-   Verificar tipo JWT do NextAuth (HS256 vs JWE) --- analisar código em
    packages/auth

-   Validar credenciais de leitura do SAGI (testar conexão e queries)

-   Confirmar campo EMAIL na tabela USUARIO do SAGI

-   Instalar Go, configurar ambiente de desenvolvimento

-   Estudar: Gin framework, sqlx, sqlc, golang-migrate

**2.2 Tarefas do Estagiário**

-   Estudar estrutura do monorepo FADEX (apps/, packages/)

-   Entender como os pacotes \@fadex/ui, \@fadex/auth, \@fadex/hooks
    funcionam

-   Estudar: Next.js 14 App Router, TanStack Query, Recharts

-   Revisar componentes existentes em \@fadex/ui (Sidebar, Card, Table,
    Dialog)

**2.3 Tarefas Conjuntas**

-   Configurar Google Cloud Service Account

-   Criar pasta root no Google Drive e compartilhar com Service Account

-   Definir email do Super Admin (GED_SUPER_ADMIN_EMAIL)

-   Configurar board de acompanhamento (Trello, GitHub Projects ou
    Notion)

**3. Cronograma Semanal Detalhado**

**Semana 1 --- Setup e Fundação**

**Objetivo:** Ambos os projetos rodando localmente, contrato de API
definido.

**Dev Júnior --- Backend Go**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  Criar projeto Go com        apps/ged-api/ com cmd/,        4h
  estrutura de pastas         internal/, db/, sqlc/          

  Configurar Gin com rotas    Servidor rodando na porta 4017 2h
  básicas                                                    

  Configurar conexão          Banco ged_fadex criado,        4h
  PostgreSQL + migrate        migration executando           

  Configurar conexão SQL      Query de teste retornando      4h
  Server (SAGI)               dados                          

  Configurar Docker Compose   PostgreSQL + backup em         4h
                              container                      

  Endpoint GET /health        Status de PostgreSQL, SAGI e   2h
                              Drive                          

  Configurar sqlc             sqlc.yaml + queries gerando    4h
                              código Go                      
  --------------------------- ------------------------------ ------------

**Total estimado: \~24h (3 dias)**

**Estagiário --- Frontend Next.js**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  Criar projeto Next.js no    apps/ged/ com \@fadex/ui e     4h
  monorepo                    \@fadex/auth                   

  Layout principal com        Sidebar com itens: Protocolos, 4h
  Sidebar                     Dashboard, Admin               

  Configurar TanStack Query   Provider configurado, query de 2h
                              exemplo                        

  Criar lib/api-client.ts     Client HTTP com interceptor    4h
                              JWT                            

  Busca global no header      GlobalSearchBar.tsx com        6h
                              dropdown (dados mock)          

  Tela de acesso restrito     Página de sem permissão com    2h
                              botão voltar                   

  Tela de fallback SAGI       Componente SAGI indisponível   2h
  --------------------------- ------------------------------ ------------

**Total estimado: \~24h (3 dias)**

  -----------------------------------------------------------------------
  🤝 Atividade Conjunta (Dia 1 ou 2): Sessão de \~4h para definir tipos
  TypeScript compartilhados --- interfaces de request/response de cada
  endpoint. Esses tipos funcionam como contrato entre frontend e backend.

  -----------------------------------------------------------------------

**Semana 2 --- Autenticação, Permissões e Tipos de Documento**

**Objetivo:** Autenticação ponta a ponta, CRUD de tipos de documento.

**Dev Júnior --- Backend Go**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  Middleware autenticação JWT Validar token NextAuth,        6h
                              extrair email/nome/role        

  Middleware permissões RBAC  Verificar GED role (Super      4h
                              Admin, Admin, Operador,        
                              Viewer)                        

  Endpoint GET /api/user/me   Dados do usuário + setor (via  4h
                              SAGI) + role GED               

  Cache email → setor         service/sector_cache.go com    3h
  (in-memory)                 TTL 1h                         

  Middleware de CORS          Permitir apenas frontend na    1h
                              porta 4016                     

  CRUD Tipos de Documento     GET, POST, PATCH, DELETE       6h
                              /api/tipos-documento           

  Middleware de logging       Request logging estruturado    2h
                              (zap/slog)                     
  --------------------------- ------------------------------ ------------

**Total estimado: \~26h (3.5 dias)**

**Estagiário --- Frontend Next.js**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  Hook usePermissions.ts      Hook com role GED e funções de 3h
                              verificação                    

  Hook useUserSector.ts       Hook que retorna setor do      2h
                              usuário logado                 

  Componente Pagination.tsx   Paginação reutilizável         4h

  Página /admin com           Estrutura com 3 abas (Tipos,   4h
  sub-navegação               Admins, Logs)                  

  TiposDocumentoTab.tsx       Tabela + modal criar/editar +  8h
                              desativar/reativar             

  Proteger rotas por          Layout que verifica role antes 3h
  permissão                   de renderizar                  
  --------------------------- ------------------------------ ------------

**Total estimado: \~24h (3 dias)**

**Semana 3 --- Listagem de Protocolos**

**Objetivo:** Página principal do GED funcionando com dados reais do
SAGI.

**Dev Júnior --- Backend Go**

  ---------------------------- ------------------------------ ------------
  **Task**                     **Entregável**                 **Horas**

  Endpoint GET /api/protocolos Lista paginada com filtro de   8h
                               setor, busca, status           

  Endpoint GET                 Cards resumo (total, sem docs, 4h
  /api/protocolos/contadores   docs anexados)                 

  Endpoint GET /api/search     Busca global (SAGI + internos) 6h
                               com escopo                     

  Endpoint GET                 Lista protocolos recentes do   3h
  /api/user/recentes           usuário                        

  Otimização de queries SAGI   Índices, paginação eficiente   3h
                               nos 175k registros             
  ---------------------------- ------------------------------ ------------

**Total estimado: \~24h (3 dias)**

**Estagiário --- Frontend Next.js**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  ProtocoloCounters.tsx       3 cards de resumo              3h

  ProtocoloTabs.tsx           Abas: Meu Setor, Recentes, Sem 4h
                              Docs, Internos, Todos          

  ProtocoloSearchBar.tsx      Busca com escopo (setor vs     5h
                              todos)                         

  ProtocoloFilters.tsx        Filtros: período, status,      4h
                              setor                          

  ProtocoloTable.tsx          Tabela com indicadores visuais 6h

  page.tsx (lista)            Página principal integrando    3h
                              componentes                    

  Hook useProtocolos.ts       TanStack Query com filtros,    3h
                              paginação, abas                
  --------------------------- ------------------------------ ------------

**Total estimado: \~28h (3.5 dias)**

  -----------------------------------------------------------------------
  🤝 Integração (Dia 4 ou 5): Primeiro fluxo ponta a ponta --- frontend
  chamando API Go real para listar protocolos. Trocar mocks por chamadas
  reais, validar paginação, filtros e busca.

  -----------------------------------------------------------------------

**Semana 4 --- Detalhes do Protocolo + Documentos**

**Objetivo:** Página de detalhes com upload/download de documentos via
Google Drive.

**Dev Júnior --- Backend Go**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  Endpoint GET                Detalhes completos do          3h
  /api/protocolos/:id         protocolo SAGI                 

  Integração Google Drive     service/drive.go --- upload    8h
  (upload)                    com estrutura ano/mês/prot     

  Endpoint POST documentos    Upload multipart, salva no     6h
  (upload)                    Drive + PostgreSQL             

  Endpoint GET                Stream do arquivo do Google    4h
  documentos/download         Drive                          

  Endpoint PATCH documentos   Editar metadados (descrição,   2h
                              tipo)                          

  Endpoint DELETE documentos  Soft delete com justificativa  3h
                              obrigatória                    

  UPSERT protocolos recentes  Registrar acesso em            2h
                              user_recent_protocols          
  --------------------------- ------------------------------ ------------

**Total estimado: \~28h (3.5 dias)**

**Estagiário --- Frontend Next.js**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  ProtocoloDetails.tsx        Cabeçalho fixo do protocolo    4h
                              (grid 2x3)                     

  Página                      Layout com abas via query      4h
  protocolo/\[id\]/page.tsx   params                         

  DocumentoList.tsx           Lista com filtros e checkboxes 5h
                              de seleção                     

  DocumentoCard.tsx           Card com menu contextual       3h
                              conforme perfil                

  DocumentoViewer.tsx         Painel lateral para preview    6h
                              inline PDF/imagens             

  DeleteModal.tsx             Modal com campo de             3h
                              justificativa obrigatória      

  Hook useDocumentos.ts       TanStack Query para CRUD       3h
                              documentos                     
  --------------------------- ------------------------------ ------------

**Total estimado: \~28h (3.5 dias)**

  -----------------------------------------------------------------------
  🤝 Integração (Dia 4 ou 5): Upload de documentos ponta a ponta ---
  frontend ↔ Go ↔ Google Drive. Validar upload, download, preview e soft
  delete.

  -----------------------------------------------------------------------

**Semana 5 --- Observações + Tramitação + Recentes**

**Objetivo:** Abas de observações e tramitação funcionando, protocolos
recentes.

**Dev Júnior --- Backend Go**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  GET observações             Lista com setor do autor       3h

  POST observações            Criar observação (registra     3h
                              setor)                         

  PATCH observações           Editar (apenas autor)          2h

  DELETE observações          Soft delete (autor ou admin)   2h

  GET tramitação              Histórico SAGI com cálculo de  4h
                              permanência                    

  Activity logs               Registrar ações (upload,       6h
                              download, delete, obs)         

  GET documentos por          Lista com contadores           3h
  protocolo                                                  
  --------------------------- ------------------------------ ------------

**Total estimado: \~23h (3 dias)**

**Estagiário --- Frontend Next.js**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  ObservacaoForm.tsx          Formulário no topo com         3h
                              contador 0/2000                

  ObservacaoCard.tsx          Card com setor do autor,       4h
                              destaque Importante            

  ObservacaoList.tsx          Lista cronológica reversa,     3h
                              importantes fixas no topo      

  Edição inline de observação Textarea editável ao clicar em 3h
                              Editar                         

  TramitacaoTimeline.tsx      Timeline vertical com setor    6h
                              atual, permanência, resumo     

  Badge na aba Observações    Indicador de observações \<    2h
                              48h                            

  Hook useObservacoes.ts      TanStack Query para CRUD       2h
                              observações                    

  Integrar aba Recentes       Conectar com endpoint          2h
                              /api/user/recentes             
  --------------------------- ------------------------------ ------------

**Total estimado: \~25h (3 dias)**

**Semana 6 --- Protocolos Internos + Upload Zone**

**Objetivo:** Criar e tramitar protocolos internos, upload avançado com
drag & drop.

**Dev Júnior --- Backend Go**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  Geração GED-AAAA-NNNN       service/protocol_number.go com 3h
                              sequence por ano               

  POST protocolos-internos    Criar protocolo (Admin+,       4h
                              campos obrigatórios)           

  PATCH protocolos-internos   Editar dados (Admin+)          3h

  PATCH status                Alterar status com regras de   4h
                              transição                      

  POST tramitar               Tramitar com despacho          4h
                              obrigatório                    

  GET tramitação interna      Histórico com despachos        3h

  DELETE protocolos-internos  Cancelar/excluir com           2h
                              justificativa                  

  Rate limiting middleware    Token bucket in-memory por     4h
                              usuário                        
  --------------------------- ------------------------------ ------------

**Total estimado: \~27h (3.5 dias)**

**Estagiário --- Frontend Next.js**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  DocumentoUploadZone.tsx     Drag & drop embutido na página 6h

  Upload múltiplo com tipo    Dropdown por arquivo +         4h
  independente                sugestão aplicar para todos    

  Barra de progresso          Progresso por arquivo com      4h
  individual                  cancelar individual            

  CriarProtocoloForm.tsx      Formulário completo (todos     5h
                              campos obrigatórios)           

  Página                      Página de criação com          2h
  protocolo-interno/novo      formulário                     

  TramitarModal.tsx           Modal com dropdown setores +   4h
                              despacho obrigatório           

  StatusDropdown.tsx          Dropdown de status com regras  3h
                              visuais                        
  --------------------------- ------------------------------ ------------

**Total estimado: \~28h (3.5 dias)**

  -----------------------------------------------------------------------
  🤝 Integração (Dia 4 ou 5): Protocolos internos ponta a ponta ---
  criar, tramitar, alterar status, aparecer na listagem com badge. Upload
  múltiplo funcionando com progresso.

  -----------------------------------------------------------------------

**Semana 7 --- Dashboard (Backend) + Protocolo Interno (Frontend)**

**Objetivo:** Endpoints do dashboard prontos, telas de protocolo interno
completas.

**Dev Júnior --- Backend Go**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  GET /api/dashboard/kpis     KPIs com cálculo de variação   5h
                              vs período anterior            

  GET uploads-periodo         Dados para gráfico de linha    4h

  GET docs-por-tipo           Dados para gráfico de pizza    3h

  GET tramitacao-por-setor    Tempo médio com indicação      5h
                              acima/abaixo média             

  GET ranking-uploads         Top usuários por uploads com   3h
                              filtro de setor                

  GET sem-documentos          Lista paginada com cálculo de  4h
                              dias sem                       
  --------------------------- ------------------------------ ------------

**Total estimado: \~24h (3 dias)**

**Estagiário --- Frontend Next.js**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  Página                      Detalhes com botões Tramitar,  4h
  protocolo-interno/\[id\]    Editar, Status                 

  EditarProtocoloModal.tsx    Modal para editar campos do    4h
                              protocolo interno              

  Timeline tramitação interna Reutilizar TramitacaoTimeline  3h
                              com despachos                  

  Hook                        TanStack Query completo (CRUD, 4h
  useProtocolosInternos.ts    tramitar, status)              

  Integrar aba Internos na    Conectar com endpoint de       3h
  listagem                    protocolos internos            

  Busca global integrada      Conectar GlobalSearchBar com   3h
                              /api/search                    

  Ajustes de permissão visual Esconder/mostrar botões        3h
                              conforme role                  
  --------------------------- ------------------------------ ------------

**Total estimado: \~24h (3 dias)**

**Semana 8 --- Dashboard (Frontend) + Dossiê + ZIP**

**Objetivo:** Dashboard visual completo, exportações funcionando.

**Dev Júnior --- Backend Go**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  Download em lote ZIP        Gera ZIP com goroutines        6h
                              paralelas                      

  Geração dossiê              ZIP com PDF resumo +           8h
                              documentos organizados por     
                              tipo                           

  Exportação Dashboard PDF    PDF com métricas e dados       5h
                              tabulares                      

  Exportação Dashboard Excel  Planilha com dados brutos      4h
  --------------------------- ------------------------------ ------------

**Total estimado: \~23h (3 dias)**

**Estagiário --- Frontend Next.js**

  ---------------------------- ------------------------------ ------------
  **Task**                     **Entregável**                 **Horas**

  Página dashboard/page.tsx    Layout com filtros globais     3h
                               (período, setor, projeto)      

  KpiCards.tsx                 4 cards com valores e variação 4h
                               percentual                     

  ChartUploadsPeriodo.tsx      Gráfico de linha (Recharts)    5h
                               com duas linhas                

  ChartDocsPorTipo.tsx         Gráfico de pizza clicável      4h

  ChartTramitacaoSetor.tsx     Bar chart horizontal com cores 5h

  RankingUploads.tsx           Lista com medalhas e           3h
                               contadores                     

  ListaProtocolosSemDocs.tsx   Tabela paginada com cores na   4h
                               coluna Dias sem                

  Hook useDashboard.ts         TanStack Query hooks para      3h
                               dashboard                      
  ---------------------------- ------------------------------ ------------

**Total estimado: \~31h (4 dias)**

**Semana 9 --- Área Administrativa + Ajustes**

**Objetivo:** Admin completo, últimas funcionalidades.

**Dev Júnior --- Backend Go**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  GET /api/admin/admins       Lista admins GED ativos        2h

  POST /api/admin/admins      Adicionar admin (Super Admin   3h
                              only)                          

  DELETE                      Remover admin (Super Admin     2h
  /api/admin/admins/:id       only)                          

  GET /api/admin/logs         Logs com filtros, paginado,    5h
                              detalhes                       

  Lógica de fallback SAGI     Detectar indisponibilidade,    4h
                              funcionar com PostgreSQL       

  Revisão rate limiting       Ajustar limites baseado em     2h
                              testes                         

  Revisão de segurança        SQL injection, validações,     4h
                              permissões                     
  --------------------------- ------------------------------ ------------

**Total estimado: \~22h (3 dias)**

**Estagiário --- Frontend Next.js**

  --------------------------- ------------------------------ ------------
  **Task**                    **Entregável**                 **Horas**

  AdminsTab.tsx               Card Super Admin + tabela +    6h
                              modal + confirmação            

  LogsTab.tsx                 Tabela com filtros + detalhes  6h
                              expansíveis                    

  DossieExportButton.tsx      Botão + indicador de progresso 3h

  Botões exportação Dashboard Conectar com endpoints         2h
                              PDF/Excel                      

  Botão download ZIP          Integrar com endpoint download 2h
                              em lote                        

  Tema light/dark             Todos componentes respeitam    4h
                              tema do sistema                

  Ajustes responsividade      Funcionar em 1366px a 1920px+  3h
  desktop                                                    
  --------------------------- ------------------------------ ------------

**Total estimado: \~26h (3.5 dias)**

**Semana 10 --- Testes e Ajustes**

**Objetivo:** Sistema estável, bugs corrigidos, performance validada.

**Dev Júnior**

  --------------------------------------------------------- -------------
  **Task**                                                  **Horas**

  Testes de carga (múltiplos usuários simultâneos)          4h

  Otimização de queries (análise, índices)                  4h

  Testes de upload/download (arquivos grandes, formatos     3h
  variados)                                                 

  Revisão de logs de auditoria                              3h

  Correção de bugs do backend                               8h

  Validação de permissões (cada endpoint com cada role)     4h
  --------------------------------------------------------- -------------

**Estagiário**

  --------------------------------------------------------- -------------
  **Task**                                                  **Horas**

  Testes de fluxo completo (jornadas de usuário)            4h

  Testes de permissão visual (botões por role)              3h

  Ajustes de UX (loading, empty, error states)              6h

  Correção de bugs do frontend                              8h

  Validação cross-browser (Chrome, Firefox, Edge)           3h

  Validação do fallback SAGI                                2h
  --------------------------------------------------------- -------------

  -----------------------------------------------------------------------
  🤝 Testes Conjuntos: Fluxo completo login → lista → detalhe → upload →
  download → observação → tramitação. Protocolo interno end-to-end.
  Dashboard com dados reais. Admin e logs. Exclusão com justificativa.

  -----------------------------------------------------------------------

**Semana 11 --- Documentação e Deploy**

**Objetivo:** Sistema em produção, documentação completa.

**Dev Júnior**

  --------------------------------------------------------- -------------
  **Task**                                                  **Horas**

  Documentação API (Swagger/OpenAPI)                        6h

  README do projeto (backend)                               3h

  Guia de instalação (passo a passo)                        4h

  Deploy em produção (Docker Compose no servidor)           6h

  Configurar backup automático                              2h

  Smoke test em produção                                    3h
  --------------------------------------------------------- -------------

**Estagiário**

  --------------------------------------------------------- -------------
  **Task**                                                  **Horas**

  Manual do usuário (guia visual com prints)                8h

  README do projeto (frontend)                              3h

  Ajustes finais de UI pós-deploy                           4h

  Documentação de componentes                               4h
  --------------------------------------------------------- -------------

  -----------------------------------------------------------------------
  🤝 Deploy Conjunto: Deploy fora do expediente (após 17:30). Registrar
  módulo GED no hub. Testar em produção com Super Admin. Validar Google
  Drive e conexão SAGI.

  -----------------------------------------------------------------------

**4. Pontos de Integração Críticos**

Momentos onde os dois devs precisam trabalhar juntos. Reservar no mínimo
2h para cada integração.

  ------------ -------------------------- -----------------------------------
  **Semana**   **Integração**             **O que testar**

  1            Tipos TypeScript           Ambos concordam com as interfaces

  3            Listagem de protocolos     Frontend → API Go → SAGI

  4            Upload de documentos       Frontend → API Go → Google Drive

  5            Observações + Tramitação   CRUD completo ponta a ponta

  6            Protocolos internos        Criar, tramitar, alterar status

  8            Dashboard                  Gráficos com dados reais

  9            Admin + Logs               CRUD admins, logs expandindo

  10           Testes integrados          Todos os fluxos

  11           Deploy                     Produção
  ------------ -------------------------- -----------------------------------

**5. Regras de Trabalho**

**5.1 Comunicação**

-   Daily standup de 15 min no início do dia (presencial ou mensagem)

-   Formato: O que fiz ontem → O que vou fazer hoje → Algum bloqueio?

-   **Bloqueios devem ser comunicados imediatamente, não esperar o
    daily**

**5.2 Git**

-   Branch principal: main

-   Branches de feature: feat/nome-da-feature

-   Commits em português, descritivos

-   Pull Request obrigatório para merge em main

-   Code review mútuo antes de aprovar

**5.3 Board de Acompanhamento**

  ---------------------- ------------------------------------------------
  **Coluna**             **Regra**

  Backlog                Tasks planejadas para a semana

  Fazendo                Máximo 2 tasks simultâneas por pessoa

  **Aguardando           **Task pronta mas depende do outro dev (coluna
  Integração**           mais importante!)**

  Testando               Integração feita, em teste

  Concluído              Testado e aprovado
  ---------------------- ------------------------------------------------

**5.4 Resolução de Bloqueios**

  --------------------------- -------------------------------------------
  **Situação**                **Ação**

  Estagiário precisa de       Usar dados mockados, mover para Aguardando
  endpoint que não existe     Integração

  Dev Júnior precisa saber    Consultar tipos TypeScript definidos na
  formato de request          semana 1

  Bug na integração           Ambos param e resolvem juntos (prioridade
                              máxima)

  Dúvida técnica              Pesquisar 30 min, se não resolver, pedir
                              ajuda
  --------------------------- -------------------------------------------

**6. Critérios de Aceite**

O que cada tipo de entrega precisa ter para ser considerada concluída:

**6.1 Endpoint Go (Dev Júnior)**

-   Retorna dados no formato dos tipos TypeScript acordados

-   Validações de input funcionando (campos obrigatórios, limites)

-   Permissões verificadas (retorna 403 para roles sem acesso)

-   Erro retorna JSON estruturado { error: mensagem }

-   Log de atividade registrado (quando aplicável)

-   Testado manualmente via Postman ou curl

**6.2 Componente React (Estagiário)**

-   Renderiza corretamente com dados mockados E dados reais

-   Estados de loading, empty e error tratados

-   Responsivo entre 1366px e 1920px

-   Funciona no tema light e dark

-   Sem erros no console do navegador

-   Permissões visuais aplicadas (botões ocultos conforme role)

**6.3 Integração (Ambos)**

-   Frontend chama API Go sem erros

-   Dados ida e volta consistentes com tipos TypeScript

-   Fluxo completo funciona do clique do usuário até o resultado final

**7. Timeline Visual do Projeto**

  ------------ ---------------------- ----------------------- -----------------
  **Semana**   **Dev Júnior (Go)**    **Estagiário            **Marco**
                                      (Next.js)**             

  1            Setup Go + Docker      Setup Next.js + Layout  🤝 Tipos TS

  2            Auth JWT + RBAC        Permissões + Admin      ---
                                      (tipos)                 

  3            Endpoints protocolos   Lista protocolos (UI)   🤝 Listagem

  4            Google Drive + Docs    Detalhes + aba Docs     🤝 Upload

  5            Observações + Tramit.  Aba Obs. + Tramitação   ---

  6            Protocolos internos    Upload zone + Prot.     🤝 Prot. Int.
                                      int.                    

  7            Endpoints Dashboard    Telas prot. int. +      ---
                                      busca                   

  8            ZIP + Dossiê + Export  Dashboard (gráficos)    ---

  9            Admin endpoints + Seg  Admin UI + Tema         ---

  **10**       **Testes integrados +  **Testes integrados +   🤝 Testes
               Bugs**                 Bugs**                  

  **11**       **Documentação +       **Documentação +        🤝 Deploy
               Deploy**               Deploy**                
  ------------ ---------------------- ----------------------- -----------------

+-----------------------------------------------------------------------+
| *GED FADEX v4.0 --- Plano de Divisão de Trabalho*                     |
|                                                                       |
| *Fevereiro/2025 --- FADEX / Gerência de TI*                           |
+-----------------------------------------------------------------------+
