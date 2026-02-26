# GED FADEX — Mapa de Endpoints da API v1.0

> **Backend:** Go (Gin) `:4017`
> **Frontend:** Next.js `:4016`
> **Gerado em:** 2026-02-26

## Legenda de Roles

| Sigla | Descrição |
|-------|-----------|
| `SA` | SUPER_ADMIN |
| `AD` | ADMIN |
| `US` | USER_SETOR |
| `VW` | VIEWER |
| `*` | Qualquer autenticado |
| `pub` | Público (sem autenticação) |

---

## Endpoints

### Saúde e Auth

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 1 | `GET` | `/api/health` | Health check do sistema | `pub` | Pronto |
| 2 | `GET` | `/api/me` | Dados do usuário autenticado | `*` | Pronto |

### Protocolos SAGI (somente leitura)

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 3 | `GET` | `/api/protocolos` | Listar protocolos SAGI (paginado, filtros) | `SA` `AD` `US` `VW` | Pendente |
| 4 | `GET` | `/api/protocolos/:numero/:ano` | Detalhe do protocolo + docs + obs | `SA` `AD` `US` `VW` | Pendente |
| 5 | `GET` | `/api/protocolos/:numero/:ano/count` | Contagem de protocolos com filtros | `SA` `AD` `US` `VW` | Pendente |

### Setores SAGI

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 6 | `GET` | `/api/setores` | Listar todos os setores ativos | `SA` `AD` `US` | Pendente |
| 7 | `GET` | `/api/setores/me` | Setores do usuário logado | `*` | Pendente |

### Documentos

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 8 | `GET` | `/api/protocolos/:numero/:ano/documentos` | Listar documentos do protocolo | `SA` `AD` `US` `VW` | Pendente |
| 9 | `GET` | `/api/documentos/:id` | Detalhe de um documento | `SA` `AD` `US` `VW` | Pendente |
| 10 | `POST` | `/api/protocolos/:numero/:ano/documentos` | Upload de documento (multipart) | `SA` `AD` `US` | Pendente |
| 11 | `DELETE` | `/api/documentos/:id` | Soft delete de documento | `SA` `AD` | Pendente |
| 12 | `GET` | `/api/documentos/:id/download` | Download/redirect do arquivo | `SA` `AD` `US` `VW` | Pendente |

### Observações

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 13 | `GET` | `/api/protocolos/:numero/:ano/observacoes` | Listar observações do protocolo | `SA` `AD` `US` `VW` | Pendente |
| 14 | `POST` | `/api/protocolos/:numero/:ano/observacoes` | Criar observação | `SA` `AD` `US` | Pendente |
| 15 | `PATCH` | `/api/observacoes/:id` | Editar texto da observação | `SA` `AD` autor | Pendente |
| 16 | `DELETE` | `/api/observacoes/:id` | Soft delete de observação | `SA` `AD` | Pendente |

### Protocolos Internos

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 17 | `GET` | `/api/protocolos-internos` | Listar protocolos internos (paginado) | `SA` `AD` `US` | Pendente |
| 18 | `GET` | `/api/protocolos-internos/:id` | Detalhe + tramitações | `SA` `AD` `US` | Pendente |
| 19 | `GET` | `/api/protocolos-internos/numero/:numero` | Buscar por número legível | `SA` `AD` `US` | Pendente |
| 20 | `POST` | `/api/protocolos-internos` | Criar protocolo interno | `SA` `AD` `US` | Pendente |
| 21 | `PATCH` | `/api/protocolos-internos/:id/status` | Atualizar status | `SA` `AD` | Pendente |

### Tramitações

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 22 | `GET` | `/api/protocolos-internos/:id/tramitacoes` | Listar tramitações do protocolo | `SA` `AD` `US` | Pendente |
| 23 | `POST` | `/api/protocolos-internos/:id/tramitacoes` | Tramitar para outro setor | `SA` `AD` `US` | Pendente |

### Tipos de Documento

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 24 | `GET` | `/api/tipos-documento` | Listar tipos ativos | `*` | Pendente |
| 25 | `GET` | `/api/tipos-documento/:id` | Detalhe de um tipo | `SA` `AD` | Pendente |
| 26 | `POST` | `/api/tipos-documento` | Criar tipo de documento | `SA` `AD` | Pendente |
| 27 | `PUT` | `/api/tipos-documento/:id` | Atualizar tipo | `SA` `AD` | Pendente |
| 28 | `DELETE` | `/api/tipos-documento/:id` | Desativar tipo | `SA` | Pendente |

### Dashboard

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 29 | `GET` | `/api/dashboard/kpis` | KPIs gerais do sistema | `SA` `AD` | Pendente |
| 30 | `GET` | `/api/dashboard/protocolos-por-mes` | Gráfico: protocolos/mês | `SA` `AD` | Pendente |
| 31 | `GET` | `/api/dashboard/ranking-setores` | Ranking setores por tramitações | `SA` `AD` | Pendente |
| 32 | `GET` | `/api/dashboard/documentos-por-tipo` | Distribuição docs por tipo | `SA` `AD` | Pendente |
| 33 | `GET` | `/api/dashboard/atividade-recente` | Últimas ações no sistema | `SA` `AD` | Pendente |

### Admin (gestão de administradores)

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 34 | `GET` | `/api/admins` | Listar admins (paginado) | `SA` | Pendente |
| 35 | `GET` | `/api/admins/:id` | Detalhe de um admin | `SA` | Pendente |
| 36 | `POST` | `/api/admins` | Criar admin | `SA` | Pendente |
| 37 | `PATCH` | `/api/admins/:id/role` | Alterar role do admin | `SA` | Pendente |
| 38 | `DELETE` | `/api/admins/:id` | Desativar admin | `SA` | Pendente |
| 39 | `GET` | `/api/admins/count` | Contagem de admins | `SA` | Pendente |

### Activity Logs (auditoria)

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 40 | `GET` | `/api/activity-logs` | Listar logs (paginado, filtros) | `SA` `AD` | Pendente |
| 41 | `GET` | `/api/activity-logs/export/csv` | Exportar logs como CSV | `SA` | Pendente |

### Exportações

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 42 | `POST` | `/api/protocolos/:numero/:ano/export/zip` | ZIP com docs do protocolo | `SA` `AD` `US` | Pendente |
| 43 | `POST` | `/api/protocolos/:numero/:ano/export/dossie` | Dossiê PDF consolidado | `SA` `AD` | Pendente |
| 44 | `GET` | `/api/protocolos-internos/:id/export/pdf` | PDF do protocolo interno | `SA` `AD` | Pendente |

### Cache Email-Setor (gestão interna)

| # | Método | Path | Descrição | Roles | Status |
|---|--------|------|-----------|-------|--------|
| 45 | `GET` | `/api/cache-email-setor` | Listar mapeamentos email→setor | `SA` | Pendente |
| 46 | `PUT` | `/api/cache-email-setor` | Upsert mapeamento | `SA` | Pendente |

---

## Resumo

| Módulo | Endpoints | Status |
|--------|-----------|--------|
| Saúde e Auth | 2 | 2 prontos |
| Protocolos SAGI | 3 | 0 prontos |
| Setores SAGI | 2 | 0 prontos |
| Documentos | 5 | 0 prontos |
| Observações | 4 | 0 prontos |
| Protocolos Internos | 5 | 0 prontos |
| Tramitações | 2 | 0 prontos |
| Tipos de Documento | 5 | 0 prontos |
| Dashboard | 5 | 0 prontos |
| Admin | 6 | 0 prontos |
| Activity Logs | 2 | 0 prontos |
| Exportações | 3 | 0 prontos |
| Cache Email-Setor | 2 | 0 prontos |
| **Total** | **46** | **2 prontos** |

---

## Padrões de Request/Response

### Headers obrigatórios (rotas autenticadas)
```
Authorization: Bearer <jwt-token>
Content-Type: application/json (exceto upload: multipart/form-data)
```

### Paginação (query params)
```
?page=1&per_page=20
```

### Response de sucesso
```json
{
  "data": { ... },
  "message": "Operação realizada"
}
```

### Response paginada
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Response de erro
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      { "field": "email", "message": "Email inválido" }
    ]
  }
}
```

### Códigos de erro

| Código HTTP | Error Code | Quando |
|-------------|-----------|--------|
| 400 | `VALIDATION_ERROR` | Dados inválidos no request |
| 400 | `BAD_REQUEST` | Erro genérico de request |
| 401 | `UNAUTHORIZED` | Token ausente/inválido/expirado |
| 403 | `FORBIDDEN` | Role insuficiente |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `CONFLICT` | Duplicata (ex: email já existe) |
| 413 | `FILE_TOO_LARGE` | Upload excedeu limite |
| 422 | `UNPROCESSABLE` | Dados válidos mas regra de negócio falhou |
| 500 | `INTERNAL_ERROR` | Erro interno do servidor |
| 503 | `SAGI_UNAVAILABLE` | SQL Server do SAGI indisponível |
