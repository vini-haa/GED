# 📋 ESCOPO FINAL — GED FADEX
## Documento Consolidado v4.0

**Data:** Janeiro/2025 (Atualizado Fevereiro/2025)
**Status:** ✅ Aprovado para Desenvolvimento
**Equipe:** 1 Dev Júnior (Backend Go) + 1 Estagiário (Frontend Next.js)

### Histórico de Versões

| Versão | Data | Alterações |
|--------|------|------------|
| 2.1 | Jan/2025 | Escopo inicial aprovado |
| 3.0 | Fev/2025 | Arquitetura Go + Next.js, filtro por setor, abas, busca inteligente |
| 4.0 | Fev/2025 | Protocolos internos, exclusão com justificativa, dossiê, busca global, divisão de trabalho |

---

## 1. Visão Geral

### 1.1 O que é o GED FADEX?
Sistema de **Gestão Eletrônica de Documentos** integrado ao ecossistema FADEX que permite:
- Visualizar protocolos do sistema SAGI (somente leitura)
- Criar e tramitar protocolos internos (independentes do SAGI)
- Anexar, categorizar e gerenciar documentos por protocolo
- Registrar observações e anotações colaborativas
- Acompanhar histórico de tramitação
- Exportar dossiê completo do protocolo
- Armazenar arquivos no Google Drive (100TB disponíveis)

### 1.2 Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            ECOSSISTEMA FADEX                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│   │   apps/main     │    │   apps/ged      │    │  apps/outros    │             │
│   │   (porta 4000)  │    │   (porta 4016)  │    │  (4001-4015)    │             │
│   │                 │    │   Next.js 14    │    │                 │             │
│   │  Hub principal  │◄──►│   (Frontend)    │    │ Faturas, RH...  │             │
│   │  + Proxy        │    │                 │    │                 │             │
│   └─────────────────┘    └────────┬────────┘    └─────────────────┘             │
│                                   │ HTTP                                         │
│                          ┌────────▼────────┐                                     │
│                          │  ged-api (Go)   │                                     │
│                          │  (porta 4017)   │                                     │
│                          │                 │                                     │
│                          │ • REST API      │                                     │
│                          │ • Auth (JWT)    │                                     │
│                          │ • Upload/Down   │                                     │
│                          │ • Workers BG    │                                     │
│                          └────────┬────────┘                                     │
│                                   │                                              │
│   ┌───────────────────────────────┴───────────────────────────────┐             │
│   │                    packages/ (compartilhados)                  │             │
│   │  @fadex/ui │ @fadex/auth │ @fadex/hooks │ @fadex/database     │             │
│   └───────────────────────────────────────────────────────────────┘             │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            â–¼                       â–¼                       â–¼
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │   SQL Server    │    │   PostgreSQL    │    │  Google Drive   │
   │   (SAGI/fade1)  │    │   (GED - novo)  │    │    (100TB)      │
   ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
   │ • documento     │    │ • documents     │    │                 │
   │ • CONVENIO      │    │ • document_types│    │  GED_FADEX/     │
   │ • scd_moviment. │    │ • observations  │    │  └─ 2025/       │
   │ • SETOR         │    │ • activity_logs │    │     └─ 06/      │
   │ • USUARIO       │    │ • ged_admins    │    │        └─ prot/ │
   │ • PESSOAS       │    │ • internal_prot.│    │                 │
   │ • SituacaoProt. │    │ • int_prot_mov. │    │                 │
   │                 │    │ • user_recent.. │    │                 │
   ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
   │ SOMENTE LEITURA │    │ LEITURA/ESCRITA │    │ UPLOAD/DOWNLOAD │
   │ Credenciais já  │    │ Docker Compose  │    │ Ano/Mês/Prot.   │
   │ existentes      │    │                 │    │ Service Account │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. Stack Tecnológica

### 2.1 Frontend (Next.js — apps/ged)

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 14+ | Framework React (App Router) |
| React | 18+ | Biblioteca UI |
| TypeScript | 5.x | Type safety |
| @fadex/ui | interno | Componentes compartilhados |
| @fadex/hooks | interno | useSessionMonitor, useModules, useApiCall |
| @fadex/auth | interno | NextAuth.js v5 — autenticação (login/sessão) |
| TanStack Query | 5.x | Estado do servidor, cache, refetch |
| Recharts | — | Gráficos do Dashboard |

### 2.2 Backend API (Go — apps/ged-api)

| Tecnologia | Propósito |
|------------|-----------|
| **Gin** | Router HTTP / Framework web |
| **sqlx** | Queries SQL Server (SAGI — leitura) |
| **sqlc** | Queries PostgreSQL (GED) — type-safe gerado |
| **golang-migrate** | Migrations do PostgreSQL |
| **golang-jwt/jwt** | Validação dos tokens JWT do NextAuth |
| **google/api/drive** | Google Drive API (upload/download) |
| **zap** ou **slog** | Logging estruturado |
| **air** | Hot reload em desenvolvimento |

### 2.3 Bancos de Dados

| Banco | Tipo | Acesso | Propósito |
|-------|------|--------|-----------|
| fade1 (SQL Server) | Existente | Somente Leitura (credenciais existentes) | Protocolos, Projetos, Tramitações, Usuários/Setores |
| ged_fadex (PostgreSQL) | **Criar Novo** (Docker) | Leitura/Escrita | Documentos, Observações, Logs, Admins, Protocolos Internos |

### 2.4 Google Drive

| Item | Configuração |
|------|-------------|
| Autenticação | Service Account |
| Estrutura | `GED_FADEX/{ano}/{mês}/{protocolo}/` |
| Capacidade | 100TB disponíveis |
| Quota API | 20.000 requests/100s por projeto |

---

## 3. Autenticação e Autorização

### 3.1 Fluxo de Autenticação (Híbrido Next.js + Go)

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLUXO DE AUTENTICAÇÃO                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuário acessa Hub (apps/main)                               │
│     └─► Login via Google OAuth (@fadex.org.br)                   │
│         └─► NextAuth gera JWT (4h duração, refresh 1h)           │
│                                                                  │
│  2. Usuário acessa GED (apps/ged — Next.js Frontend)             │
│     └─► Sessão herdada via @fadex/auth                           │
│         └─► Frontend envia JWT no header Authorization           │
│                                                                  │
│  3. Go API (ged-api) recebe request                              │
│     └─► Middleware valida JWT com mesma secret do NextAuth        │
│         └─► Extrai email, nome, role                             │
│             └─► Resolve setor via SAGI (USUARIO.EMAIL)           │
│                 └─► Cache in-memory (TTL 1h)                     │
│                     └─► Verifica permissão GED                   │
│                         └─► Processa request                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**⚠️ Verificar antes do desenvolvimento:** O NextAuth v5 usa JWE (encriptado) por padrão. Confirmar se o ecossistema FADEX usa JWT assinado (HS256) ou JWE para configurar o middleware Go corretamente.

### 3.2 Mapeamento Usuário → Setor

A tabela `USUARIO` do SAGI já possui campo `EMAIL` preenchido. A API Go consulta:

```sql
SELECT u.CODIGO, u.NOME, s.CODIGO AS CodSetor, s.DESCR AS NomeSetor
FROM USUARIO u
INNER JOIN SETOR s ON s.CODIGO = u.CodSetor
WHERE u.EMAIL = @email
```

Cache in-memory no Go com TTL de 1 hora.

### 3.3 Dados do Usuário Disponíveis

| Campo | Tipo | Origem | Descrição |
|-------|------|--------|-----------|
| id | string (CUID) | NextAuth JWT | ID único |
| email | string | NextAuth JWT | Email (@fadex.org.br) |
| name | string | NextAuth JWT | Nome completo |
| image | string | NextAuth JWT | URL do avatar |
| role | enum | NextAuth JWT | OWNER, ADMIN, MEMBER, GUEST |
| codSetor | integer | SAGI (cache) | Código do setor no SAGI |
| nomeSetor | string | SAGI (cache) | Nome do setor no SAGI |
| gedRole | enum | PostgreSQL / env | SUPER_ADMIN, ADMIN, OPERATOR, VIEWER |

### 3.4 Controle de Acesso no GED

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFIS DE ACESSO GED                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔵 VISUALIZADOR (padrão)                                       │
│  ├─ Ver protocolos (SAGI e internos) e documentos               │
│  ├─ Ver observações e tramitação                                │
│  └─ Download de documentos                                      │
│                                                                 │
│  🟢 OPERADOR (usuários com acesso ao módulo GED)                │
│  ├─ Tudo do Visualizador +                                      │
│  ├─ Upload de documentos                                        │
│  ├─ Adicionar observações                                       │
│  ├─ Editar/excluir próprias observações                         │
│  ├─ Excluir próprios documentos (com justificativa)             │
│  ├─ Alterar status de protocolos internos (do seu setor)        │
│  └─ Tramitar protocolos internos (do seu setor)                 │
│                                                                 │
│  🟠 ADMIN GED                                                   │
│  ├─ Tudo do Operador +                                          │
│  ├─ Criar protocolos internos                                   │
│  ├─ Editar protocolos internos                                  │
│  ├─ CRUD tipos de documentos                                    │
│  ├─ Excluir qualquer documento (com justificativa)              │
│  ├─ Excluir qualquer observação                                 │
│  ├─ Arquivar/cancelar protocolos internos                       │
│  └─ Acesso ao Dashboard                                         │
│                                                                 │
│  🔴 SUPER ADMIN (único — fixo por env var)                      │
│  ├─ Tudo do Admin +                                             │
│  ├─ Nomear/remover Admins GED                                   │
│  ├─ Ver logs de todos os usuários                               │
│  └─ Não pode ser removido                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Funcionalidades Detalhadas

---

### 4.1 RF-01: Busca Global (Header)

Barra de busca fixa no topo do layout (presente em todas as páginas) que permite buscar protocolos de qualquer lugar do sistema sem precisar navegar até a lista.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📁 GED FADEX    [🔍 Buscar protocolo...                    ]   👤 João Silva ▼│
├─────────────────────────────────────────────────────────────────────────────────┤
```

Ao digitar, dropdown com resultados rápidos (top 5) e link "Ver todos os resultados" que leva à lista filtrada. Busca por número do protocolo, assunto, interessado ou projeto.

---

### 4.2 RF-02: Listagem de Protocolos (Página Inicial)

#### 4.2.1 Comportamento Padrão

Ao acessar o GED, o sistema resolve o setor do usuário logado (via SAGI) e **aplica automaticamente o filtro de setor**, exibindo apenas os protocolos que estão atualmente no setor dele. Protocolos SAGI e internos aparecem juntos na mesma lista.

O filtro é visível e removível: "Visualizando: 📍 Ger. Finanças e Contabilidade [✕ Ver todos]"

#### 4.2.2 Abas de Visualização Rápida

| Aba | Descrição | Fonte |
|-----|-----------|-------|
| 📍 **Meu Setor** (padrão) | Protocolos no setor atual do usuário | SAGI + PostgreSQL |
| ⭐ **Recentes** | Últimos protocolos que o usuário visualizou | PostgreSQL (user_recent_protocols) |
| ⚠️ **Sem Documentos** | Protocolos do setor sem nenhum anexo | SAGI + PostgreSQL (LEFT JOIN) |
| 🏷️ **Internos** | Apenas protocolos criados no GED | PostgreSQL (internal_protocols) |
| 🔍 **Todos** | Busca geral em todos os protocolos | SAGI + PostgreSQL |

Cada aba exibe contador: `📍 Meu Setor (1.247)`

#### 4.2.3 Contadores de Cabeçalho

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 📄 1.247       │ │ ⚠️  89         │ │ 📎 3.456       │
│ Protocolos     │ │ Sem documentos │ │ Docs anexados  │
│ no seu setor   │ │ no seu setor   │ │ no seu setor   │
└────────────────┘ └────────────────┘ └────────────────┘
```

#### 4.2.4 Indicadores Visuais na Tabela

| Indicador | Condição | Visual |
|-----------|----------|--------|
| 🔴 Novo | Protocolo chegou no setor < 24h | Badge vermelho |
| 🟡 Pendente | Protocolo sem documentos anexados | Ícone de clipe amarelo |
| 📝 Atividade | Observações recentes (< 48h) | Badge na coluna |
| 🏷️ Interno | Protocolo criado no GED | Badge "GED" |

#### 4.2.5 Busca Inteligente com Escopo

```
🔍 "nota fiscal"
   └─ 3 resultados no seu setor  │  27 resultados em todos os setores [ver]
```

#### 4.2.6 Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📁 GED FADEX    [🔍 Buscar protocolo...                    ]   👤 João Silva ▼│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                      │
│  │ 📄 1.247       │ │ ⚠️  89         │ │ 📎 3.456       │                      │
│  │ Protocolos     │ │ Sem documentos │ │ Docs anexados  │                      │
│  │ no seu setor   │ │ no seu setor   │ │ no seu setor   │                      │
│  └────────────────┘ └────────────────┘ └────────────────┘                      │
│                                                                                 │
│  [📍 Meu Setor (1.247)] [⭐ Recentes] [⚠️ Sem Docs (89)] [🏷️ Internos] [🔍 Todos]│
│                                                                                 │
│  Visualizando: 📍 Ger. Finanças e Contabilidade            [✕ Ver todos]       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Buscar por número, projeto ou interessado...        [Filtros ▼]      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │    │ Nº Protocolo          │ Projeto         │ Interessado │ Status│ 📎 │  │
│  ├────┼───────────────────────┼─────────────────┼─────────────┼───────┼────┤  │
│  │ 🔴 │ 0153.250614.0003      │ Conv. UFPI/CNPq │ Maria Santos│Análise│  5 │  │
│  │ 🏷️│ GED-2025-0042         │ Demanda interna │ João Lima   │Aberto │  2 │  │
│  │    │ 0153.250613.0012      │ Projeto Alpha   │ Ana Costa   │Tramit.│  3 │  │
│  │ 🟡 │ 0153.250612.0001      │ —               │ Pedro Rocha │Tramit.│  0 │  │
│  │ 📝 │ 0153.250611.0007      │ Conv. IFPI/CAPES│ Carlos Lima │Análise│  2 │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  Mostrando 1-20 de 1.247 no seu setor         [◀ Anterior]  1  2  3  [Próx ▶] │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2.7 Query Principal (SAGI — com filtro de setor)

```sql
SELECT
    d.Codigo AS ID_Protocolo,
    d.Numero AS Numero_Protocolo,
    d.data AS Data_Criacao,
    d.Assunto,
    c.Titulo AS Nome_Projeto,
    c.numero AS Codigo_Convenio,
    COALESCE(p.descricao, d.Interessado, d.remetente) AS Nome_Interessado,
    setor.DESCR AS Nome_Setor_Atual,
    sm.dtMovimentacao AS Data_Chegada_Setor,
    CASE
        WHEN sm.codSituacaoProt = 60 THEN 'Arquivado'
        WHEN sm.codSituacaoProt = 64 THEN 'Cancelado'
        WHEN sm.codSituacaoProt = 57 THEN 'Finalizado'
        WHEN sm.codSituacaoProt = 66 THEN 'Em Análise'
        WHEN setor.DESCR LIKE '%ARQUIVO%' THEN 'Arquivado (inferido)'
        ELSE 'Em Tramitação'
    END AS Status_Protocolo
FROM documento d
LEFT JOIN scd_movimentacao sm ON sm.CodProt = d.Codigo AND sm.RegAtual = 1
LEFT JOIN SETOR setor ON setor.CODIGO = sm.codSetorDestino
LEFT JOIN CONVENIO c ON c.NumConv = d.NumConv
LEFT JOIN PESSOAS p ON p.codigo = d.CodFornec
WHERE (d.deletado IS NULL OR d.deletado = 0)
  AND sm.codSetorDestino = @codSetor
ORDER BY d.data DESC
OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
```

---

### 4.3 RF-03: Detalhes do Protocolo

#### 4.3.1 Cabeçalho Fixo

O cabeçalho com dados do protocolo fica **fixo no topo** enquanto o usuário navega entre as abas. Usa grid 2x3 para otimizar espaço vertical.

O "← Voltar" retorna para a lista **mantendo filtros e posição na tabela**.

**Para protocolos SAGI:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📁 GED FADEX    [🔍 Buscar protocolo...                    ]   👤 João Silva ▼│
├─────────────────────────────────────────────────────────────────────────────────┤
│  ← Voltar                                                    📍 Meu Setor      │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  Protocolo 0153.250614.0003                       Status: 🟢 Em Análise  │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐│  │
│  │  │ Projeto                     │  │ Interessado                         ││  │
│  │  │ Convênio UFPI/CNPq          │  │ Maria Santos                       ││  │
│  │  │ CONV-2024-0052              │  │                                     ││  │
│  │  ├─────────────────────────────┤  ├─────────────────────────────────────┤│  │
│  │  │ Assunto                     │  │ Setor Atual                         ││  │
│  │  │ Aquisição de equipamentos   │  │ 📍 Ger. Finanças e Contabilidade   ││  │
│  │  │ para laboratório            │  │ Recebido há 3 dias (11/06/2025)    ││  │
│  │  ├─────────────────────────────┤  ├─────────────────────────────────────┤│  │
│  │  │ Data de Criação             │  │ Remetente                           ││  │
│  │  │ 14/06/2025                  │  │ Coordenação de Projetos             ││  │
│  │  └─────────────────────────────┘  └─────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [📄 Documentos (5)]   [📝 Observações (3) 🔴]   [🔄 Tramitação (8)]    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                          [📦 Exportar Dossiê]  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Para protocolos internos GED (diferenças):**
```
┌───────────────────────────────────────────────────────────────────────────────┐
│  🏷️ Protocolo Interno GED-2025-0042                Status: 🟢 Aberto        │
│                                                                               │
│  (mesmos campos em grid 2x3)                                                  │
│  Criado por: Admin Silva em 18/06/2025                                        │
│                                                                               │
│  [📤 Tramitar para outro setor]  [✏️ Editar]  [Status: Aberto ▼]            │
└───────────────────────────────────────────────────────────────────────────────┘
```

Navegação entre abas via **query params** na URL (`/protocolo/123?tab=documentos`) para permitir compartilhar link direto e manter a aba ao recarregar.

#### 4.3.2 Registro de Acesso

Ao acessar detalhes, a API faz UPSERT no `user_recent_protocols`:
```sql
INSERT INTO user_recent_protocols (user_email, protocol_id, protocol_number, last_viewed_at, view_count)
VALUES (@email, @protocolId, @protocolNumber, NOW(), 1)
ON CONFLICT (user_email, protocol_id)
DO UPDATE SET last_viewed_at = NOW(), view_count = user_recent_protocols.view_count + 1;
```

#### 4.3.3 Permissões Visuais

O frontend esconde botões conforme o perfil. Validação real acontece no Go API.
- Visualizador: não vê botão de upload, observação, tramitação
- Operador: vê upload, observação, tramitação (se for do seu setor para internos)
- Admin+: vê tudo + editar + excluir qualquer item

---

### 4.4 RF-04: Documentos (Aba Documentos)

#### 4.4.1 Funcionalidades

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| RF-04.1 | Upload | Arrastar ou selecionar (drag & drop embutido na página) | Alta |
| RF-04.2 | Upload Múltiplo | Vários arquivos de uma vez, tipo independente por arquivo | Alta |
| RF-04.3 | Categorização | Selecionar tipo ao fazer upload (sugestão "Aplicar para todos") | Alta |
| RF-04.4 | Visualização Inline | PDF e imagens no navegador (painel lateral/overlay) | Alta |
| RF-04.5 | Download Individual | Baixar arquivo específico | Alta |
| RF-04.6 | Download em Lote | ZIP com múltiplos arquivos | Média |
| RF-04.7 | Editar Metadados | Alterar descrição e tipo (autor ou admin) | Média |
| RF-04.8 | Excluir | Soft delete com justificativa obrigatória | Média |
| RF-04.9 | Filtros na aba | Por tipo, período, ordenação | Média |

#### 4.4.2 Regras

- Limite por arquivo: **50MB**
- Limite por protocolo: **Ilimitado**
- Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, etc.
- Descrição no upload: **Opcional** (nome do arquivo já é informativo)
- Upload paralelo (goroutines no Go), barra de progresso individual
- Exclusão: **Soft delete com justificativa obrigatória**
- Retenção: arquivo permanece armazenado até prestação de contas do projeto
- Quem pode excluir: Autor do upload ou Admin GED

#### 4.4.3 Wireframe — Lista de Documentos

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📄 DOCUMENTOS                                                               │
│                                                                              │
│  ┌─ Filtros ────────────────────────────────────────────────────────────┐    │
│  │ Tipo: [Todos ▼]    Período: [Qualquer ▼]    Ordenar: [Mais recente ▼]│    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ ☐  │ 📄 nota_fiscal_lab.pdf          │ Notas Fiscais  │ 2.3 MB      │   │
│  │    │ Nota fiscal dos equipamentos     │ João Silva     │ 20/06/2025  │   │
│  ├────┼──────────────────────────────────┼────────────────┼─────────────┤   │
│  │ ☐  │ 📄 oficio_021_2025.pdf          │ Ofício         │ 156 KB      │   │
│  │    │ Resposta ao ofício de solicit... │ Maria Lima     │ 18/06/2025  │   │
│  ├────┼──────────────────────────────────┼────────────────┼─────────────┤   │
│  │ ☐  │ 🖼️ foto_equipamento_01.jpg      │ Fotos          │ 4.1 MB      │   │
│  │    │ Foto do equipamento recebido     │ João Silva     │ 17/06/2025  │   │
│  └────┴──────────────────────────────────┴────────────────┴─────────────┘   │
│                                                                              │
│  Selecionados: 0  │ [👁 Visualizar] [⬇ Download] [⬇ ZIP] [🗑 Excluir]     │
│                                                                              │
│  ┌─ Upload ────────────────────────────────────────────────────────────┐    │
│  │       ┌─────────────────────────────────────────────────────┐        │    │
│  │       │   📂 Arraste arquivos aqui ou clique para enviar    │        │    │
│  │       │      PDF, DOC, XLS, JPG, PNG — até 50MB             │        │    │
│  │       └─────────────────────────────────────────────────────┘        │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.4 Upload em Andamento

```
┌─ Upload ────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  📄 relatorio_exec_jul.pdf (3.2 MB)                               │  │
│  │  Tipo: [Rel. Execução Financeira ▼]                                │  │
│  │  Descrição: [Relatório de execução ref. julho/2025        ]       │  │
│  │  ████████████████████░░░░░ 78%                            [✕]     │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  📄 nf_00452.pdf (1.1 MB)                                         │  │
│  │  Tipo: [Notas Fiscais ▼]                                          │  │
│  │  Descrição: [                                             ]       │  │
│  │  ⏳ Aguardando...                                          [✕]     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  [+ Adicionar mais arquivos]                    [Cancelar]  [📤 Enviar] │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.5 Exclusão com Justificativa

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ EXCLUIR DOCUMENTO                                     [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Arquivo: nota_fiscal_lab.pdf                                   │
│  Protocolo: 0153.250614.0003                                    │
│                                                                 │
│  Justificativa: *                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Documento duplicado, versão correta já anexada          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ O arquivo será ocultado mas permanecerá armazenado         │
│     até a prestação de contas do projeto ser concluída.        │
│                                                                 │
│                          [Cancelar]  [🗑 Excluir]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.4.6 Visualizador Inline

Abre como painel lateral/overlay sem navegar para outra página. PDFs e imagens renderizam inline; outros formatos mostram metadados + opção de download.

```
┌─ Visualizador ───────────────────────────────────────────────────────┐
│  📄 nota_fiscal_lab.pdf                    [⬇ Download] [✕ Fechar]   │
│  Notas Fiscais • 2.3 MB • Enviado por João Silva em 20/06/2025       │
│  Descrição: Nota fiscal dos equipamentos do laboratório              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                    ┌─────────────────────────┐                        │
│                    │     PREVIEW DO PDF       │                        │
│                    │     (iframe/embed)       │                        │
│                    └─────────────────────────┘                        │
│                                                                       │
│                        ◀  Página 1 de 3  ▶                           │
└───────────────────────────────────────────────────────────────────────┘
```

#### 4.4.7 Menu Contextual por Documento

```
┌──────────────────────┐
│ 👁 Visualizar         │
│ ⬇ Download           │
│ ✏️ Editar metadados   │  ← só autor ou admin
│ ───────────────────── │
│ 🗑 Excluir            │  ← só autor ou admin, com justificativa
└──────────────────────┘
```

---

### 4.5 RF-05: Tipos de Documentos

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| RF-05.1 | Listar | Exibir tipos ativos e inativos | Alta |
| RF-05.2 | Criar | Novo tipo (apenas Admin+) | Alta |
| RF-05.3 | Editar | Alterar nome/descrição (apenas Admin+) | Média |
| RF-05.4 | Desativar | Inativar tipo — desaparece do dropdown de upload (não exclui) | Média |
| RF-05.5 | Reativar | Tornar tipo ativo novamente | Média |

Desativar um tipo **não afeta documentos existentes** — eles continuam exibindo o nome normalmente.

**Tipos Iniciais:**
1. Ofício
2. Rel. Execução Objeto
3. Rel. Execução Financeira
4. Notas Fiscais
5. Extratos
6. Conciliação
7. Fotos

---

### 4.6 RF-06: Observações (Aba Observações)

#### 4.6.1 Funcionalidades

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| RF-06.1 | Adicionar | Nova observação (formulário no topo) | Alta |
| RF-06.2 | Listar | Ordem cronológica reversa (mais recente primeiro) | Alta |
| RF-06.3 | Setor do autor | Exibir setor de quem escreveu | Alta |
| RF-06.4 | Editar | Inline (textarea editável), só o autor | Média |
| RF-06.5 | Excluir | Soft delete (autor ou admin) | Média |
| RF-06.6 | Marcar Importante | Destaque visual, fixa no topo | Baixa |
| RF-06.7 | Indicador Visual | Badge 🔴 na aba quando há observações < 48h | Alta |

#### 4.6.2 Regras

- Limite de caracteres: **2000** (contador em tempo real)
- Anexos: **Não permitido**
- Visibilidade: **Todos os usuários**
- Edição: **Somente o autor** (inline, sem modal)
- Observações ⭐ Importante: fundo destacado + fixas no topo independente da data

#### 4.6.3 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📝 OBSERVAÇÕES                                                              │
│                                                                              │
│  ┌─ Nova observação ────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────────────────────┐    │   │
│  │  │ Escreva uma observação sobre este protocolo...                │    │   │
│  │  └───────────────────────────────────────────────────────────────┘    │   │
│  │                                               0/2000   [📤 Enviar]   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ⭐ IMPORTANTE                                                      ⋮       │
│  ┌───────────────────────────────────────────────────────────────────┐       │
│  │ Aguardando retorno do coordenador sobre a compra dos             │       │
│  │ equipamentos. Prazo final: 30/07/2025.                           │       │
│  └───────────────────────────────────────────────────────────────────┘       │
│  👤 João Silva • Ger. Finanças • 20/06/2025 às 14:32                        │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────       │
│                                                                        ⋮    │
│  ┌───────────────────────────────────────────────────────────────────┐       │
│  │ Documentação parcial enviada. Falta relatório de execução.       │       │
│  └───────────────────────────────────────────────────────────────────┘       │
│  👤 Maria Lima • Coord. Projetos • 18/06/2025 às 10:15                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 4.6.4 Menu â‹® conforme perfil

```
Autor:                     Admin (não autor):        Outro usuário:
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ ✏️ Editar         │      │ 🗑 Excluir        │      │ (sem ações)      │
│ ⭐ Marcar import. │      └──────────────────┘      └──────────────────┘
│ 🗑 Excluir        │
└──────────────────┘
```

---

### 4.7 RF-07: Tramitação (Aba Tramitação)

#### 4.7.1 Para Protocolos SAGI (somente leitura)

Timeline de cima para baixo, setor atual no topo com destaque visual. Cada ponto mostra permanência (dias no setor).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔄 TRAMITAÇÃO                                        8 movimentações        │
│                                                                              │
│  📍 ● Ger. Finanças e Contabilidade              ← SETOR ATUAL             │
│     │ Recebido em 11/06/2025 às 14:20                                       │
│     │ Situação: Em Análise                                                  │
│     │ Permanência: 3 dias                                                   │
│     │                                                                        │
│     ○ Coordenação de Projetos                                               │
│     │ 08/06/2025 → 11/06/2025                                              │
│     │ Permanência: 3 dias                                                   │
│     │                                                                        │
│     ○ Gerência Jurídica                                                     │
│     │ 02/06/2025 → 08/06/2025                                              │
│     │ Permanência: 6 dias                                                   │
│     │                                                                        │
│     ◎ CRIAÇÃO DO PROTOCOLO                                                  │
│       14/05/2025 às 09:00                                                   │
│                                                                              │
│  ┌─ Resumo ─────────────────────────────────────────────────────────────┐   │
│  │ Tempo total: 31 dias │ Setores: 7 │ Setor mais longo: 8 dias        │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 4.7.2 Para Protocolos Internos GED (leitura + tramitação)

Mesma timeline, porém com **despacho obrigatório** em cada movimentação e nome de quem tramitou:

```
│  📍 ● Ger. Finanças e Contabilidade              ← SETOR ATUAL             │
│     │ Recebido em 20/06/2025 às 09:30                                       │
│     │ Despacho: "Encaminho para análise financeira do contrato"             │
│     │ Enviado por: Admin Silva                                              │
│     │                                                                        │
│     ○ Gerência Jurídica                                                     │
│     │ 18/06 → 20/06 • Permanência: 2 dias                                  │
│     │ Despacho: "Análise jurídica concluída, sem impedimentos"             │
│     │ Enviado por: Maria Lima                                               │
│     │                                                                        │
│     ◎ CRIAÇÃO DO PROTOCOLO                                                  │
│       18/06/2025 • Admin Silva • Ger. Finanças                              │
```

#### 4.7.3 Query SAGI (tramitação)

```sql
SELECT
    sm.Sequencia,
    sm.dtMovimentacao AS Data_Movimentacao,
    setor_origem.DESCR AS Setor_Origem,
    setor_destino.DESCR AS Setor_Destino,
    sm.codSituacaoProt,
    sp.Descricao AS Situacao,
    sm.RegAtual,
    u.NOME AS Usuario_Movimentacao
FROM scd_movimentacao sm
LEFT JOIN SETOR setor_origem ON setor_origem.CODIGO = sm.codSetorOrigem
LEFT JOIN SETOR setor_destino ON setor_destino.CODIGO = sm.codSetorDestino
LEFT JOIN SituacaoProtocolo sp ON sp.Codigo = sm.codSituacaoProt
LEFT JOIN USUARIO u ON u.CODIGO = sm.codUsuario
WHERE sm.CodProt = @protocolId
ORDER BY sm.Sequencia DESC;
```

---

### 4.8 RF-08: Protocolos Internos GED

#### 4.8.1 Conceito

Protocolos criados diretamente no GED, independentes do SAGI. Mesma lógica de campos, documentos, observações e tramitação, porém vivem apenas no PostgreSQL.

#### 4.8.2 Criação (Admin+ only)

| Campo | Obrigatório | Descrição |
|---|---|---|
| Número | Auto | GED-AAAA-NNNN (auto-incremental por ano) |
| Assunto | **Sim** | Descrição do protocolo |
| Interessado | **Sim** | Pessoa/entidade interessada |
| Remetente | **Sim** | Quem originou |
| Projeto/Convênio | **Sim** | Vínculo textual |
| Setor Atual | Auto | Setor de quem criou (inicial) |
| Status | Auto | Aberto (inicial) |
| Data de Criação | Auto | NOW() |
| Criado por | Auto | Usuário logado |

#### 4.8.3 Status

```
Aberto → Em Análise → Finalizado
  │          │              │
  │          │              └──→ Arquivado
  │          └──────────────────→ Arquivado
  └─────────────────────────────→ Cancelado (com justificativa)
```

| Status | Quem pode alterar |
|---|---|
| Aberto | Automático na criação |
| Em Análise | Operador+ do setor atual |
| Finalizado | Operador+ do setor atual |
| Arquivado | Admin+ |
| Cancelado | Admin+ (com justificativa obrigatória) |

#### 4.8.4 Tramitação

Qualquer **Operador+** do setor que detém o protocolo pode tramitá-lo. Despacho obrigatório.

```
┌─────────────────────────────────────────────────────────────────┐
│  📤 TRAMITAR PROTOCOLO                                     [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Protocolo: GED-2025-0042                                       │
│  Setor atual: Ger. Finanças e Contabilidade                     │
│                                                                 │
│  Enviar para: *                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Selecione o setor de destino ▼]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Despacho: *                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Encaminho para análise jurídica do contrato anexado.    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                        [Cancelar]  [📤 Tramitar]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.9 RF-09: Exportação de Dossiê

Botão "📦 Exportar Dossiê" na página de detalhes do protocolo. Gera um **ZIP** contendo:

1. **Resumo PDF** — dados do protocolo, lista de documentos, todas as observações, histórico de tramitação
2. **Todos os documentos** — arquivos originais organizados por tipo

```
Dossie_0153.250614.0003.zip
├── RESUMO_0153.250614.0003.pdf
├── Notas_Fiscais/
│   └── nota_fiscal_lab.pdf
├── Oficios/
│   └── oficio_021_2025.pdf
└── Fotos/
    └── foto_equipamento_01.jpg
```

Útil para prestação de contas — gestores exportam tudo de uma vez para enviar ao órgão competente.

---

### 4.10 RF-10: Dashboard (Admin+ e Super Admin only)

#### 4.10.1 Filtros Globais

Afetam todos os gráficos e métricas simultaneamente:

```
┌─ Filtros ───────────────────────────────────────────────────────────────┐
│ Período: [Últimos 30 dias ▼]  Setor: [Todos ▼]  Projeto: [Todos ▼]    │
│ Períodos rápidos: [7d] [30d] [90d] [6m] [1a] [Personalizado...]       │
└─────────────────────────────────────────────────────────────────────────┘
                                                   [📄 Exportar PDF] [📊 Excel]
```

#### 4.10.2 KPIs (Cards Resumo)

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 📄 1.842          │ │ 📎 4.567         │ │ ⚠️  312          │ │ 🕐 4,2 dias      │
│ Protocolos        │ │ Documentos       │ │ Sem documentos   │ │ Tempo médio      │
│ no período        │ │ anexados         │ │                  │ │ de tramitação    │
│                   │ │                  │ │ 16,9% do total   │ │                  │
│ ▲ 12% vs anterior │ │ ▲ 8% vs anterior │ │ ▼ 3% vs anterior │ │ ▼ 0,5d vs anterior│
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

Cada card mostra variação comparada ao período anterior (setas verdes/vermelhas).

#### 4.10.3 Gráficos — Linha 1

**Uploads por Período** (linha) + **Documentos por Tipo** (pizza)

Lado a lado. Gráfico de uploads mostra duas linhas quando setor específico está selecionado (total vs setor). Pizza é clicável — filtra a lista de protocolos sem docs abaixo.

#### 4.10.4 Gráficos — Linha 2

**Tempo Médio de Tramitação por Setor** (bar chart horizontal) + **Ranking de Uploads** (lista)

Setores acima da média em vermelho, abaixo em verde. Ranking respeita filtro de setor.

#### 4.10.5 Protocolos sem Documentos

Tabela paginada, ordenação padrão "mais antigo primeiro". Coluna "Dias sem" com cores:
- **Verde:** < 7 dias
- **Amarelo:** 7-30 dias
- **Vermelho:** > 30 dias

Clique leva direto ao detalhe do protocolo.

#### 4.10.6 Wireframe Completo

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📊 DASHBOARD                                                                   │
│                                                                                 │
│  ┌─ Filtros ───────────────────────────────────────────────────────────────┐   │
│  │ Período: [30d]  Setor: [Todos ▼]  Projeto: [Todos ▼]                   │   │
│  │ [7d] [30d] [90d] [6m] [1a] [Personalizado]   [📄 PDF] [📊 Excel]      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ 📄 1.842      │ │ 📎 4.567     │ │ ⚠️  312      │ │ 🕐 4,2d      │          │
│  │ Protocolos    │ │ Documentos   │ │ Sem docs     │ │ Tempo médio  │          │
│  │ ▲ 12%        │ │ ▲ 8%        │ │ ▼ 3%        │ │ ▼ 0,5d      │          │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                                 │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐        │
│  │ 📈 Uploads por Período         │  │ 📊 Documentos por Tipo         │        │
│  │  [gráfico de linha]            │  │  [gráfico de pizza]            │        │
│  │  ── Total  ── Meu setor       │  │  Notas Fiscais 45%             │        │
│  └────────────────────────────────┘  └────────────────────────────────┘        │
│                                                                                 │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐        │
│  │ 🕐 Tramitação por Setor        │  │ 🏆 Ranking de Uploads          │        │
│  │  [bar chart horizontal]        │  │  1. 🥇 João Silva    45 docs   │        │
│  │  Ger. Finanças ████████ 6,2d   │  │  2. 🥈 Maria Lima    38 docs   │        │
│  │  ── Média: 4,2 dias           │  │  3. 🥉 Ana Costa     27 docs   │        │
│  └────────────────────────────────┘  └────────────────────────────────┘        │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ PROTOCOLOS SEM DOCUMENTOS                              312 protocolos │  │
│  │ Nº Protocolo     │ Projeto          │ Setor         │ Dias sem          │  │
│  │ 0153.250412.0003 │ Conv. UFPI/FINEP │ Financeiro    │ 🔴 63 dias       │  │
│  │ 0153.250425.0008 │ Projeto Beta     │ Coord.Proj.   │ 🟡 50 dias       │  │
│  │ ...              │                  │               │                   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.11 RF-11: Área Administrativa (/admin)

Página separada com sub-navegação. Visibilidade por perfil:

| Aba | Visível para |
|-----|-------------|
| 📋 Tipos de Documento | Admin + Super Admin |
| 👥 Administradores | 🔴 Super Admin only |
| 📜 Logs | 🔴 Super Admin only |

Usuário sem permissão vê tela "🔒 Acesso Restrito".

#### 4.11.1 Aba: Tipos de Documento

Tabela com nome, descrição, status (ativo/inativo). Menu ⋮ com Editar, Desativar/Reativar. Modal para criar/editar com campos nome e descrição. Aviso: "Tipos não podem ser excluídos, apenas desativados."

#### 4.11.2 Aba: Administradores (🔴 Super Admin)

Card fixo do Super Admin ("Fixo no sistema, não pode ser removido"). Lista de admins GED com email, nome, data de nomeação, botão remover.

Modal adicionar: email (@fadex.org.br) + observação opcional. Aviso: "Usuário precisa ter conta e já ter acessado o sistema."

Modal remover: confirmação detalhada do que muda ("Perderá acesso a: ..., Continuará como Operadora com acesso normal").

#### 4.11.3 Aba: Logs do Sistema (🔴 Super Admin)

Tabela paginada com filtros: período, usuário, ação, protocolo.

Colunas: Data/Hora, Usuário, Ação, Detalhes (expansível inline).

**Ações rastreadas:**

| Ícone | Ação | Registra |
|-------|------|----------|
| 📤 | Upload | Arquivo, tipo, protocolo, tamanho, Drive ID |
| ⬇ | Download | Arquivo, protocolo |
| 🗑 | Exclusão | Arquivo/observação, protocolo, justificativa |
| 📝 | Observação criada/editada | Protocolo, preview do conteúdo |
| ⚙️ | Tipo criado/editado/desativado | Nome do tipo, mudança |
| 👥 | Admin adicionado/removido | Email, observação |
| 🏷️ | Protocolo interno criado | Número, assunto |
| 📤 | Protocolo interno tramitado | De/para setor, despacho |

**Nota:** Visualizações (👁) não são rastreadas no MVP para evitar volume excessivo de logs.

---

### 4.12 Comportamento quando SAGI Indisponível

Quando o SQL Server (SAGI) está fora do ar:

- Mensagem clara: "Sistema SAGI temporariamente indisponível"
- Funcionalidades que dependem só do PostgreSQL continuam funcionando normalmente:
  - Protocolos internos GED (criação, tramitação, listagem)
  - Documentos e observações já cadastrados
  - Dashboard (dados parciais — apenas protocolos internos)
  - Área administrativa
- Endpoint `/health` retorna `{ "status": "degraded", "sagi": "error" }`

---

## 5. Estrutura do Banco PostgreSQL (GED)

```sql
-- ═══════════════════════════════════════════════════════════════
-- BANCO: ged_fadex (PostgreSQL 15+)
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────
-- Administradores do GED
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ged_admins (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(200) NOT NULL UNIQUE,
    user_name VARCHAR(200),
    granted_by_email VARCHAR(200) NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_by_email VARCHAR(200),
    notes VARCHAR(500)
);

CREATE INDEX idx_ged_admins_email ON ged_admins(user_email) WHERE is_active = TRUE;

-- ───────────────────────────────────────────────────────────────
-- Tipos de Documentos
-- ───────────────────────────────────────────────────────────────
CREATE TABLE document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO document_types (name, description, display_order) VALUES
('Ofício', 'Documentos oficiais, comunicações formais', 1),
('Rel. Execução Objeto', 'Relatórios de execução física do projeto', 2),
('Rel. Execução Financeira', 'Relatórios de execução financeira', 3),
('Notas Fiscais', 'NFe, NFSe, cupons fiscais, recibos', 4),
('Extratos', 'Extratos bancários, extratos de conta', 5),
('Conciliação', 'Documentos de conciliação bancária/contábil', 6),
('Fotos', 'Registros fotográficos, evidências visuais', 7);

-- ───────────────────────────────────────────────────────────────
-- Documentos
-- ───────────────────────────────────────────────────────────────
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,

    -- Vínculo com protocolo (SAGI ou interno)
    protocol_id INTEGER NOT NULL,
    protocol_number VARCHAR(50) NOT NULL,
    protocol_source VARCHAR(20) NOT NULL DEFAULT 'sagi'
        CHECK (protocol_source IN ('sagi', 'ged_interno')),

    -- Tipo
    document_type_id INTEGER NOT NULL REFERENCES document_types(id),

    -- Arquivo
    original_filename VARCHAR(255) NOT NULL,
    storage_filename VARCHAR(255) NOT NULL,
    file_extension VARCHAR(20) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,

    -- Google Drive
    google_drive_id VARCHAR(100) NOT NULL,
    google_drive_url VARCHAR(500),
    google_drive_folder_id VARCHAR(100),

    -- Metadados
    description VARCHAR(500),

    -- Auditoria
    uploaded_by_id VARCHAR(50) NOT NULL,
    uploaded_by_email VARCHAR(200) NOT NULL,
    uploaded_by_name VARCHAR(200),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),

    -- Soft delete com justificativa
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by_id VARCHAR(50),
    deleted_by_email VARCHAR(200),
    delete_reason VARCHAR(500)           -- Justificativa obrigatória
);

CREATE INDEX idx_documents_protocol ON documents(protocol_id, protocol_source);
CREATE INDEX idx_documents_number ON documents(protocol_number);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_not_deleted ON documents(protocol_id) WHERE is_deleted = FALSE;

-- ───────────────────────────────────────────────────────────────
-- Observações
-- ───────────────────────────────────────────────────────────────
CREATE TABLE protocol_observations (
    id SERIAL PRIMARY KEY,

    -- Vínculo
    protocol_id INTEGER NOT NULL,
    protocol_number VARCHAR(50) NOT NULL,
    protocol_source VARCHAR(20) NOT NULL DEFAULT 'sagi'
        CHECK (protocol_source IN ('sagi', 'ged_interno')),

    -- Conteúdo
    content TEXT NOT NULL CHECK (char_length(content) <= 2000),
    is_important BOOLEAN DEFAULT FALSE,

    -- Auditoria (com setor do autor)
    created_by_id VARCHAR(50) NOT NULL,
    created_by_email VARCHAR(200) NOT NULL,
    created_by_name VARCHAR(200),
    created_by_sector VARCHAR(200),          -- Setor do autor no momento
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by_id VARCHAR(50)
);

CREATE INDEX idx_observations_protocol ON protocol_observations(protocol_id, protocol_source);
CREATE INDEX idx_observations_created ON protocol_observations(created_at DESC);
CREATE INDEX idx_observations_not_deleted ON protocol_observations(protocol_id) WHERE is_deleted = FALSE;

-- ───────────────────────────────────────────────────────────────
-- Protocolos Internos GED
-- ───────────────────────────────────────────────────────────────
CREATE TABLE internal_protocols (
    id SERIAL PRIMARY KEY,
    protocol_number VARCHAR(20) NOT NULL UNIQUE,  -- GED-2025-0001
    year INTEGER NOT NULL,
    sequence INTEGER NOT NULL,

    -- Campos (todos obrigatórios)
    subject VARCHAR(500) NOT NULL,
    interested VARCHAR(200) NOT NULL,
    sender VARCHAR(200) NOT NULL,
    project_name VARCHAR(300) NOT NULL,

    -- Setor atual
    current_sector_code INTEGER NOT NULL,
    current_sector_name VARCHAR(200) NOT NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'aberto'
        CHECK (status IN ('aberto', 'em_analise', 'finalizado', 'arquivado', 'cancelado')),
    cancel_reason VARCHAR(500),

    -- Auditoria
    created_by_id VARCHAR(50) NOT NULL,
    created_by_email VARCHAR(200) NOT NULL,
    created_by_name VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by_email VARCHAR(200),
    delete_reason VARCHAR(500),

    UNIQUE(year, sequence)
);

CREATE INDEX idx_internal_protocols_number ON internal_protocols(protocol_number);
CREATE INDEX idx_internal_protocols_sector ON internal_protocols(current_sector_code);
CREATE INDEX idx_internal_protocols_status ON internal_protocols(status);
CREATE INDEX idx_internal_protocols_created ON internal_protocols(created_at DESC);

-- ───────────────────────────────────────────────────────────────
-- Tramitação dos Protocolos Internos
-- ───────────────────────────────────────────────────────────────
CREATE TABLE internal_protocol_movements (
    id SERIAL PRIMARY KEY,
    protocol_id INTEGER NOT NULL REFERENCES internal_protocols(id),

    -- Movimentação
    sequence INTEGER NOT NULL,
    from_sector_code INTEGER,
    from_sector_name VARCHAR(200),
    to_sector_code INTEGER NOT NULL,
    to_sector_name VARCHAR(200) NOT NULL,
    dispatch_note TEXT NOT NULL,

    -- Quem tramitou
    moved_by_id VARCHAR(50) NOT NULL,
    moved_by_email VARCHAR(200) NOT NULL,
    moved_by_name VARCHAR(200),
    moved_at TIMESTAMPTZ DEFAULT NOW(),

    is_current BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_movements_protocol ON internal_protocol_movements(protocol_id);
CREATE INDEX idx_movements_current ON internal_protocol_movements(protocol_id) WHERE is_current = TRUE;

-- ───────────────────────────────────────────────────────────────
-- Protocolos Recentes do Usuário
-- ───────────────────────────────────────────────────────────────
CREATE TABLE user_recent_protocols (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(200) NOT NULL,
    protocol_id INTEGER NOT NULL,
    protocol_number VARCHAR(50) NOT NULL,
    protocol_source VARCHAR(20) NOT NULL DEFAULT 'sagi'
        CHECK (protocol_source IN ('sagi', 'ged_interno')),
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    view_count INTEGER DEFAULT 1,
    UNIQUE(user_email, protocol_id, protocol_source)
);

CREATE INDEX idx_recent_user ON user_recent_protocols(user_email);
CREATE INDEX idx_recent_viewed ON user_recent_protocols(last_viewed_at DESC);

-- ───────────────────────────────────────────────────────────────
-- Logs de Atividade
-- ───────────────────────────────────────────────────────────────
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_email VARCHAR(200) NOT NULL,
    user_name VARCHAR(200),

    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,

    protocol_id INTEGER,
    protocol_number VARCHAR(50),
    protocol_source VARCHAR(20),

    details JSONB,

    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_protocol ON activity_logs(protocol_id);
CREATE INDEX idx_logs_action ON activity_logs(action);
CREATE INDEX idx_logs_created ON activity_logs(created_at DESC);

-- ───────────────────────────────────────────────────────────────
-- Triggers
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_types_updated
    BEFORE UPDATE ON document_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_observations_updated
    BEFORE UPDATE ON protocol_observations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_internal_protocols_updated
    BEFORE UPDATE ON internal_protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. Estrutura do Projeto

### 6.1 Frontend (Next.js — apps/ged)

```
apps/ged/
├── app/
│   ├── layout.tsx                    # Root layout + busca global no header
│   ├── providers.tsx
│   ├── globals.css
│   │
│   └── (app)/
│       ├── layout.tsx                # Layout com Sidebar
│       ├── page.tsx                  # Lista de Protocolos
│       │
│       ├── protocolo/
│       │   └── [id]/
│       │       └── page.tsx          # Detalhes (SAGI)
│       │
│       ├── protocolo-interno/
│       │   ├── novo/
│       │   │   └── page.tsx          # Criar protocolo interno (Admin+)
│       │   └── [id]/
│       │       └── page.tsx          # Detalhes (interno)
│       │
│       ├── dashboard/
│       │   └── page.tsx              # Dashboard (Admin+)
│       │
│       └── admin/
│           └── page.tsx              # Área administrativa (/admin)
│
├── components/
│   ├── layout/
│   │   └── GlobalSearchBar.tsx       # Busca global no header
│   │
│   ├── protocolos/
│   │   ├── ProtocoloTable.tsx
│   │   ├── ProtocoloFilters.tsx
│   │   ├── ProtocoloTabs.tsx
│   │   ├── ProtocoloCounters.tsx
│   │   ├── ProtocoloDetails.tsx
│   │   ├── ProtocoloSearchBar.tsx
│   │   └── TramitacaoTimeline.tsx
│   │
│   ├── protocolos-internos/
│   │   ├── CriarProtocoloForm.tsx
│   │   ├── TramitarModal.tsx
│   │   ├── StatusDropdown.tsx
│   │   └── EditarProtocoloModal.tsx
│   │
│   ├── documentos/
│   │   ├── DocumentoList.tsx
│   │   ├── DocumentoUploadZone.tsx
│   │   ├── DocumentoViewer.tsx
│   │   ├── DocumentoCard.tsx
│   │   ├── DeleteModal.tsx           # Com justificativa
│   │   └── DossieExportButton.tsx
│   │
│   ├── observacoes/
│   │   ├── ObservacaoList.tsx
│   │   ├── ObservacaoForm.tsx
│   │   └── ObservacaoCard.tsx        # Com setor do autor
│   │
│   ├── dashboard/
│   │   ├── KpiCards.tsx
│   │   ├── ChartUploadsPeriodo.tsx
│   │   ├── ChartDocsPorTipo.tsx
│   │   ├── ChartTramitacaoSetor.tsx
│   │   ├── RankingUploads.tsx
│   │   └── ListaProtocolosSemDocs.tsx
│   │
│   ├── admin/
│   │   ├── TiposDocumentoTab.tsx
│   │   ├── AdminsTab.tsx
│   │   ├── LogsTab.tsx
│   │   └── AccessDenied.tsx
│   │
│   └── shared/
│       ├── SagiUnavailable.tsx       # Fallback SAGI fora do ar
│       └── Pagination.tsx
│
├── lib/
│   ├── api-client.ts
│   └── utils/
│       ├── file-utils.ts
│       └── export-utils.ts
│
├── hooks/
│   ├── useProtocolos.ts
│   ├── useProtocolosInternos.ts
│   ├── useDocumentos.ts
│   ├── useObservacoes.ts
│   ├── useDashboard.ts
│   ├── usePermissions.ts
│   ├── useUserSector.ts
│   └── useGlobalSearch.ts
│
├── types/
│   ├── protocolo.ts
│   ├── protocolo-interno.ts
│   ├── documento.ts
│   ├── observacao.ts
│   └── permissions.ts
│
├── package.json
├── next.config.ts
└── tsconfig.json
```

### 6.2 Backend API (Go — apps/ged-api)

```
apps/ged-api/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── permissions.go
│   │   ├── logger.go
│   │   ├── cors.go
│   │   └── ratelimit.go
│   ├── handler/
│   │   ├── protocolos.go
│   │   ├── protocolos_internos.go
│   │   ├── documentos.go
│   │   ├── observacoes.go
│   │   ├── tipos_documento.go
│   │   ├── admin.go
│   │   ├── dashboard.go
│   │   ├── user.go
│   │   ├── search.go                # Busca global
│   │   ├── dossie.go                # Exportação dossiê
│   │   └── health.go
│   ├── repository/
│   │   ├── sagi.go
│   │   ├── documents.go
│   │   ├── observations.go
│   │   ├── internal_protocols.go
│   │   ├── internal_movements.go
│   │   ├── activity_log.go
│   │   ├── admin.go
│   │   └── recent.go
│   ├── service/
│   │   ├── drive.go
│   │   ├── documents.go
│   │   ├── sector_cache.go
│   │   ├── dossie.go                # Geração ZIP + PDF resumo
│   │   └── protocol_number.go       # Geração GED-AAAA-NNNN
│   └── model/
│       ├── protocolo.go
│       ├── protocolo_interno.go
│       ├── documento.go
│       ├── observacao.go
│       └── user.go
├── db/
│   └── migrations/
│       ├── 000001_init.up.sql
│       └── 000001_init.down.sql
├── sqlc/
│   ├── sqlc.yaml
│   └── queries/
│       ├── documents.sql
│       ├── observations.sql
│       ├── internal_protocols.sql
│       ├── internal_movements.sql
│       ├── activity_logs.sql
│       ├── admins.sql
│       └── recent_protocols.sql
├── go.mod
├── go.sum
├── Makefile
├── Dockerfile
└── .air.toml
```

---

## 7. API Endpoints (Go)

### 7.1 Protocolos SAGI (leitura)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/protocolos` | Lista paginada (filtro setor) | Todos |
| GET | `/api/protocolos/:id` | Detalhes | Todos |
| GET | `/api/protocolos/:id/tramitacao` | Histórico tramitação | Todos |
| GET | `/api/protocolos/contadores` | Cards resumo do setor | Todos |

Query params de `/api/protocolos`:
- `tab`: meu_setor, recentes, sem_docs, internos, todos
- `search`, `search_scope`: setor / todos
- `periodo_inicio`, `periodo_fim`, `status`
- `page`, `page_size`

### 7.2 Protocolos Internos GED

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/protocolos-internos` | Lista | Todos |
| POST | `/api/protocolos-internos` | Criar | Admin+ |
| GET | `/api/protocolos-internos/:id` | Detalhes | Todos |
| PATCH | `/api/protocolos-internos/:id` | Editar | Admin+ |
| PATCH | `/api/protocolos-internos/:id/status` | Alterar status | Operador+ (setor) / Admin+ |
| POST | `/api/protocolos-internos/:id/tramitar` | Tramitar | Operador+ (setor) |
| GET | `/api/protocolos-internos/:id/tramitacao` | Histórico | Todos |
| DELETE | `/api/protocolos-internos/:id` | Soft delete | Admin+ (com justificativa) |

### 7.3 Documentos

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/protocolos/:source/:id/documentos` | Lista | Todos |
| POST | `/api/protocolos/:source/:id/documentos` | Upload (multipart) | Operador+ |
| GET | `/api/documentos/:id` | Metadados | Todos |
| GET | `/api/documentos/:id/download` | Download | Todos |
| PATCH | `/api/documentos/:id` | Editar | Autor ou Admin |
| DELETE | `/api/documentos/:id` | Soft delete (com justificativa) | Autor ou Admin |
| POST | `/api/protocolos/:source/:id/documentos/zip` | Download lote | Todos |

`:source` = `sagi` ou `ged_interno`

### 7.4 Observações

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/protocolos/:source/:id/observacoes` | Lista | Todos |
| POST | `/api/protocolos/:source/:id/observacoes` | Criar | Operador+ |
| PATCH | `/api/observacoes/:id` | Editar | Autor |
| DELETE | `/api/observacoes/:id` | Soft delete | Autor ou Admin |

### 7.5 Tipos de Documento

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/tipos-documento` | Lista ativos | Todos |
| POST | `/api/tipos-documento` | Criar | Admin+ |
| PATCH | `/api/tipos-documento/:id` | Editar | Admin+ |
| DELETE | `/api/tipos-documento/:id` | Desativar | Admin+ |

### 7.6 Administração

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/admin/admins` | Lista admins | Super Admin |
| POST | `/api/admin/admins` | Adicionar | Super Admin |
| DELETE | `/api/admin/admins/:id` | Remover | Super Admin |
| GET | `/api/admin/logs` | Logs completos | Super Admin |

### 7.7 Usuário e Busca

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/user/me` | Info + setor + role GED | Todos |
| GET | `/api/user/recentes` | Protocolos recentes | Todos |
| GET | `/api/search` | Busca global (protocolos SAGI + internos) | Todos |

### 7.8 Dashboard

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/dashboard/kpis` | KPIs com variação | Admin+ |
| GET | `/api/dashboard/uploads-periodo` | Gráfico linha | Admin+ |
| GET | `/api/dashboard/docs-por-tipo` | Gráfico pizza | Admin+ |
| GET | `/api/dashboard/tramitacao-por-setor` | Bar chart | Admin+ |
| GET | `/api/dashboard/ranking-uploads` | Ranking | Admin+ |
| GET | `/api/dashboard/sem-documentos` | Lista paginada | Admin+ |

### 7.9 Dossiê e Health

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/protocolos/:source/:id/dossie` | Gera ZIP do dossiê | Operador+ |
| GET | `/health` | Health check (postgres, sagi, drive) | Público |

---

## 8. Configurações e Ambiente

### 8.1 Variáveis — Frontend (apps/ged)

```env
NEXT_PUBLIC_APP_URL=http://localhost:4016
NEXT_PUBLIC_API_URL=http://localhost:4017
GED_PORT=4016
```

### 8.2 Variáveis — API Go (apps/ged-api)

```env
# Servidor
GED_API_PORT=4017
GED_API_ENV=development

# Autenticação
NEXTAUTH_SECRET=mesma_secret_do_nextauth
GED_SUPER_ADMIN_EMAIL=seu_email@fadex.org.br

# PostgreSQL (GED)
GED_DB_HOST=localhost
GED_DB_PORT=5432
GED_DB_NAME=ged_fadex
GED_DB_USER=ged_user
GED_DB_PASSWORD=senha

# SQL Server (SAGI — leitura, credenciais existentes)
SAGI_DB_HOST=servidor_sagi
SAGI_DB_PORT=1433
SAGI_DB_NAME=fade1
SAGI_DB_USER=usuario_leitura
SAGI_DB_PASSWORD=senha_leitura

# Google Drive
GOOGLE_DRIVE_CLIENT_EMAIL=ged-fadex@projeto.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_DRIVE_ROOT_FOLDER_ID=1abc123...

# Limites
MAX_FILE_SIZE_MB=50
MAX_OBSERVATION_LENGTH=2000

# Cache
SECTOR_CACHE_TTL_MINUTES=60

# Rate Limiting
RATE_LIMIT_UPLOAD=10        # /min por usuário
RATE_LIMIT_DOWNLOAD=30      # /min por usuário
RATE_LIMIT_SEARCH=60        # /min por usuário
RATE_LIMIT_DEFAULT=120      # /min por usuário
```

### 8.3 Docker Compose (Desenvolvimento e Produção)

```yaml
services:
  ged-api:
    build: ./apps/ged-api
    ports:
      - "4017:4017"
    env_file: ./apps/ged-api/.env
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:4017/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ged_fadex
      POSTGRES_USER: ged_user
      POSTGRES_PASSWORD: ${GED_DB_PASSWORD}
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ged_user -d ged_fadex"]
      interval: 10s
      timeout: 5s
      retries: 5

  backup:
    image: prodrigestivill/postgres-backup-local
    volumes:
      - ./backups:/backups
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: ged_fadex
      POSTGRES_USER: ged_user
      POSTGRES_PASSWORD: ${GED_DB_PASSWORD}
      SCHEDULE: "@daily"
      BACKUP_KEEP_DAYS: 30
    depends_on:
      - postgres

volumes:
  pgdata:
```

### 8.4 Registro no Sistema de Módulos

**`packages/types/src/modules.ts`:**
```typescript
{
  id: 'ged',
  iconName: 'FileStack',
  title: 'GED',
  description: 'Gerenciamento Eletrônico de Documentos',
  href: '/ged',
  color: 'blue',
  port: 4016,
}
```

**`apps/main/next.config.ts`:**
```typescript
{
  source: '/ged/:path*',
  destination: `${process.env.GED_APP_URL || 'http://localhost:4016'}/ged/:path*`
}
```

---

## 9. Requisitos Não-Funcionais

### 9.1 Performance

| Métrica | Alvo |
|---------|------|
| Carregamento inicial | < 3s |
| Listagem 100 protocolos | < 1s |
| Upload arquivo 10MB | < 10s |
| Resposta API Go (p95) | < 300ms |
| Resolução de setor (cache hit) | < 5ms |
| Busca global | < 500ms |
| Geração dossiê (10 arquivos) | < 30s |

### 9.2 Segurança

- ✅ Autenticação via NextAuth (JWT) validado no Go
- ✅ Autorização RBAC no middleware Go
- ✅ SQL parametrizado (sem injection)
- ✅ Validação de arquivos (tipo, tamanho)
- ✅ HTTPS obrigatório
- ✅ CORS configurado (apenas frontend)
- ✅ Rate limiting por usuário
- ✅ Logs de auditoria completos
- ✅ Soft delete com justificativa e retenção até prestação de contas
- ⚠️ LGPD: documentos podem conter dados pessoais

### 9.3 Disponibilidade

- Desktop only
- Tema: light/dark (seguir sistema de módulos)
- Navegadores: Chrome, Firefox, Edge (últimas 2 versões)
- Degradação graciosa quando SAGI indisponível

---

## 10. Cronograma de Desenvolvimento (11 semanas)

### Fase 1: Infraestrutura (2 semanas)

| Semana | Dev Júnior (Backend Go) | Estagiário (Frontend Next.js) |
|--------|-------------------------|-------------------------------|
| 1 | Setup Go (Gin, sqlx, sqlc), conexões (SAGI + PostgreSQL + Drive), Docker Compose | Setup Next.js no monorepo, layout com Sidebar, TanStack Query, API client |
| 2 | Middleware auth/RBAC, endpoint `/api/user/me`, `/health`, CRUD Tipos de Documento | Tela acesso restrito, fallback SAGI, busca global no header |

**âš¡ Atividade conjunta semana 1:** Definir tipos TypeScript compartilhados (interfaces de request/response de cada endpoint). Frontend desenvolve com dados mockados.

### Fase 2: Core (4 semanas)

| Semana | Dev Júnior (Backend Go) | Estagiário (Frontend Next.js) |
|--------|-------------------------|-------------------------------|
| 3 | Endpoints protocolos SAGI (listagem, contadores, filtros, busca) | Lista de Protocolos (tabela, abas, cards, indicadores, busca) |
| 4 | Endpoints documentos (CRUD + Google Drive), upload multipart | Detalhes do Protocolo (cabeçalho), aba Documentos (lista, viewer) |
| 5 | Endpoints observações, tramitação SAGI, protocolos recentes | Aba Observações (lista, form, setor autor), aba Tramitação (timeline) |
| 6 | Endpoints protocolos internos (CRUD, tramitação, numeração) | Upload zone (drag & drop, progresso), modal delete c/ justificativa |

**⚡ Integrações:**
- Semana 3: primeiro fluxo ponta a ponta (listagem)
- Semana 4: upload de documentos (frontend ↔ Go ↔ Google Drive)
- Semana 6: protocolos internos + tramitação

### Fase 3: Complementar (3 semanas)

| Semana | Dev Júnior (Backend Go) | Estagiário (Frontend Next.js) |
|--------|-------------------------|-------------------------------|
| 7 | Endpoints Dashboard, exportação PDF/Excel | Protocolo interno (criar, tramitar, status), componentes |
| 8 | Download lote ZIP, dossiê (ZIP + PDF resumo) | Dashboard (KPIs, gráficos Recharts, lista sem docs) |
| 9 | Endpoints admin (gestão admins, logs), rate limiting | Área Administrativa (/admin — tipos, admins, logs) |

### Fase 4: Finalização (2 semanas)

| Semana | Ambos |
|--------|-------|
| 10 | Testes integrados, bugs, ajustes de performance, revisão de segurança |
| 11 | Documentação técnica, deploy produção, manual do usuário |

### Quadro de Acompanhamento

```
[Backlog] → [Fazendo] → [Aguardando Integração] → [Testando] → [Concluído]
```

A coluna "Aguardando Integração" é essencial — evita bloqueios silenciosos entre frontend e backend.

---

## 11. Checklist de Entrega

### Pré-requisitos (⏳ Antes de iniciar)
- [ ] Verificar tipo JWT do NextAuth (assinado HS256 vs JWE)
- [ ] Configurar Google Cloud Service Account
- [ ] Criar pasta root no Google Drive (compartilhar com Service Account)
- [ ] Definir email do Super Admin (`GED_SUPER_ADMIN_EMAIL`)
- [ ] Validar credenciais de leitura do SAGI
- [ ] Confirmar campo EMAIL na tabela USUARIO do SAGI

### Infraestrutura
- [ ] Docker Compose (PostgreSQL + backup + API Go)
- [ ] Migrations PostgreSQL executando
- [ ] Conexão SQL Server (SAGI) funcionando
- [ ] Conexão Google Drive API funcionando
- [ ] Middleware autenticação JWT
- [ ] Middleware autorização RBAC
- [ ] Cache email → setor (TTL 1h)
- [ ] Health check (`/health`)
- [ ] Rate limiting

### MVP — Listagem e Navegação
- [ ] Busca global no header
- [ ] Lista de protocolos com filtro automático de setor
- [ ] Abas: Meu Setor, Recentes, Sem Docs, Internos, Todos
- [ ] Contadores de cabeçalho
- [ ] Indicadores visuais (Novo, Pendente, Atividade, Interno)
- [ ] Busca inteligente com escopo setor/todos
- [ ] Paginação

### MVP — Detalhes do Protocolo
- [ ] Cabeçalho fixo com dados do protocolo (grid 2x3)
- [ ] Abas com badges dinâmicos
- [ ] Registro de acesso (protocolos recentes)
- [ ] Botão exportar dossiê

### MVP — Documentos
- [ ] Lista com filtros (tipo, período, ordenação)
- [ ] Upload drag & drop (embutido na página)
- [ ] Upload múltiplo com tipo independente por arquivo
- [ ] Barra de progresso individual
- [ ] Visualização inline (PDF, imagens)
- [ ] Download individual
- [ ] Download em lote (ZIP)
- [ ] Editar metadados
- [ ] Excluir com justificativa obrigatória
- [ ] Menu contextual conforme perfil

### MVP — Observações
- [ ] Formulário no topo
- [ ] Lista cronológica reversa
- [ ] Setor do autor exibido
- [ ] Edição inline
- [ ] Marcar como importante
- [ ] Badge 🔴 na aba (< 48h)

### MVP — Tramitação
- [ ] Timeline SAGI (somente leitura)
- [ ] Permanência por setor
- [ ] Resumo (tempo total, setores, gargalo)

### Protocolos Internos
- [ ] Criar (Admin+, todos campos obrigatórios)
- [ ] Numeração automática GED-AAAA-NNNN
- [ ] Editar (Admin+)
- [ ] Alterar status (Operador+ do setor / Admin+)
- [ ] Tramitar com despacho obrigatório
- [ ] Timeline com despachos
- [ ] Cancelar com justificativa (Admin+)

### Dashboard (Admin+)
- [ ] Filtros globais (período, setor, projeto/convênio)
- [ ] KPIs com variação percentual
- [ ] Gráfico: uploads por período (linha)
- [ ] Gráfico: documentos por tipo (pizza)
- [ ] Gráfico: tramitação por setor (bar chart)
- [ ] Ranking de uploads
- [ ] Protocolos sem documentos (lista com cores)
- [ ] Exportar PDF
- [ ] Exportar Excel

### Área Administrativa
- [ ] Página /admin com sub-navegação
- [ ] Tipos de Documento: CRUD, ativar/desativar
- [ ] Administradores: adicionar, remover (Super Admin)
- [ ] Logs: tabela com filtros, detalhes expansíveis (Super Admin)
- [ ] Tela de acesso restrito

### Exportação
- [ ] Dossiê completo (ZIP + PDF resumo)
- [ ] Relatório Dashboard PDF
- [ ] Relatório Dashboard Excel

### Resiliência
- [ ] Fallback quando SAGI indisponível
- [ ] Backup diário PostgreSQL (30 dias retenção)

### Documentação
- [ ] README do projeto
- [ ] Documentação de API (Swagger/OpenAPI)
- [ ] Guia de instalação
- [ ] Manual do usuário

---

## 12. Informações Adicionais

### Deploy
- **Go API:** Container Docker (via Docker Compose)
- **Next.js Frontend:** Node.js (como demais módulos)
- **Horário:** Fora do expediente (após 17:30, seg-sex)
- **Backup:** PostgreSQL diário automático, 30 dias retenção

### Google Drive
- **Estrutura:** `GED_FADEX/{ano}/{mês}/{número_protocolo}/`
- **Service Account:** configurar no Google Cloud Console
- **Pasta root:** compartilhar com email da Service Account

### Retenção de Dados
- Documentos excluídos (soft delete) permanecem armazenados até prestação de contas
- Justificativa de exclusão registrada no banco e nos logs
- Exclusão física somente após aprovação da prestação de contas (processo manual)

---

*Documento consolidado em Janeiro/2025*
*Versão 4.0 Final — Fevereiro/2025*
*Go Backend + Protocolos Internos + Dossiê + Busca Global + Divisão de Trabalho*
