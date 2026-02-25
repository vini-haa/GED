# CLAUDE.md - Contexto Completo FADEX

> Documento de contexto para Claude AI operando no monorepo FADEX.
> Leia completamente antes de executar qualquer tarefa.

---

## 1. Sobre o Projeto

### 1.1 Identidade

| Campo | Valor |
|-------|-------|
| **Nome** | FADEX - Plataforma de Gestao Institucional |
| **Organizacao** | FADEX - Fundacao Cultural e de Fomento a Pesquisa, Ensino, Extensao e Inovacao (CNPJ 07.501.328/0001-30) |
| **Vinculo** | Fundacao de apoio da UFPI - Universidade Federal do Piaui, Teresina-PI |
| **Tipo** | Monorepo Turborepo |
| **Apps** | 12+ aplicacoes Next.js independentes |
| **Ambiente** | Linux Ubuntu + PM2 + PostgreSQL + SQL Server |

### 1.2 Proposito

Sistema de gestao institucional que integra:
- Gestao de projetos e contratos
- Controle financeiro (ressarcimentos, extratos, faturas)
- Credenciamentos de instituicoes
- Relatorios e auditorias
- Viagens corporativas
- Assinaturas digitais

---

## 2. Stack Tecnica Detalhada

### 2.1 Frontend

| Tecnologia | Versao | Notas |
|------------|--------|-------|
| Next.js | 16.x | App Router, Turbopack, Multi-Zones |
| React | 19.x | Server Components, Suspense |
| TypeScript | 5.x | Strict mode obrigatorio |
| Tailwind CSS | v4 | Nova sintaxe de configuracao |
| shadcn/ui | Latest | Tema customizado Notion-inspired |
| Lucide Icons | Latest | Icones padrao |
| Recharts | Latest | Graficos e visualizacoes |

### 2.2 Backend

| Tecnologia | Versao | Notas |
|------------|--------|-------|
| Node.js | 20+ | Obrigatorio |
| Prisma | Latest | ORM para PostgreSQL |
| NextAuth | v5 | Autenticacao OAuth |
| Zod | Latest | Validacao de schemas |
| mssql | Latest | Conexao SQL Server (read-only) |

### 2.3 Infraestrutura

| Tecnologia | Uso |
|------------|-----|
| PostgreSQL | Banco principal (auth, dados de app) |
| SQL Server | Banco legado Snowflake (read-only) |
| PM2 | Process manager em producao |
| Turborepo | Monorepo tooling |
| Husky | Git hooks |
| Commitlint | Validacao de commits |

---

## 3. Arquitetura Completa

### 3.1 Estrutura de Diretorios

```
sistemasfadex/
├── apps/                        # Apps Next.js independentes
│   ├── main/                   # Portal central (4000)
│   │   ├── app/               # App Router pages
│   │   │   ├── (auth)/       # Rotas de autenticacao
│   │   │   ├── (dashboard)/  # Rotas protegidas
│   │   │   └── api/          # API routes
│   │   ├── components/        # Componentes locais
│   │   ├── lib/              # Utilitarios locais
│   │   └── next.config.ts    # Config com rewrites multi-zone
│   ├── viagens/               # Gestao de viagens (4001)
│   ├── projetos/              # Gestao de projetos (4002)
│   ├── ressarcimentos/        # Ressarcimentos (4003)
│   ├── extratos/              # Extratos BB (4004)
│   ├── relatorios/            # Relatorios (4006)
│   ├── entrada_saida/         # Entradas/Saidas (4007)
│   ├── servicos-pontuais/     # Servicos (4008)
│   ├── credenciamentos/       # Credenciamentos (4009)
│   ├── faturas/               # Faturas NFSe (4010)
│   ├── assinaturas/           # Assinaturas (4011)
│   ├── catalogo/              # Links (4012)
│   └── ralph-dashboard/       # Ralph IA Dashboard (4020)
│
├── packages/                    # Codigo compartilhado
│   ├── auth/                   # @fadex/auth
│   │   └── src/
│   │       └── auth.ts        # Config NextAuth v5
│   ├── database/               # @fadex/database
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Schema PostgreSQL
│   │   └── src/
│   │       ├── config.ts      # Config de conexao
│   │       ├── mssql-connection.ts  # SQL Server
│   │       └── queries/       # Queries organizadas
│   ├── hooks/                  # @fadex/hooks
│   │   └── src/
│   │       ├── use-modules.ts
│   │       ├── use-session-monitor.ts
│   │       └── use-contas-projeto.ts
│   ├── services/               # @fadex/services
│   │   └── src/
│   │       ├── api/           # Clientes API
│   │       └── bb-extratos.ts # API Banco do Brasil
│   ├── types/                  # @fadex/types
│   │   └── src/
│   │       ├── auth.ts        # Tipos de autenticacao
│   │       ├── modules.ts     # Catalogo de modulos
│   │       └── index.ts       # Re-exports
│   ├── ui/                     # @fadex/ui
│   │   └── src/
│   │       ├── components/    # shadcn/ui customizados
│   │       ├── charts/        # Componentes de graficos
│   │       ├── dashboard/     # Layout components
│   │       └── navigation/    # Sidebar, Header
│   └── utils/                  # @fadex/utils
│       └── src/
│           ├── validation.ts  # Validacoes (CPF, CNPJ)
│           └── categorias.ts  # Utilitarios de categorias
│
├── docs/                        # Documentacao organizada
│   ├── arquitetura/            # Docs de arquitetura
│   ├── banco-dados/            # Docs de banco
│   ├── integracao/             # Docs de APIs
│   ├── ui/                     # Docs de UI
│   ├── troubleshooting/        # Solucoes
│   └── README.md               # Indice
│
├── prisma/                      # Schema raiz (legacy)
│   └── schema.prisma
│
├── scripts/                     # Automacao
│   ├── sync-project-folders.ts
│   └── credenciamentos-notify-validade.js
│
├── certificados/                # Certs BB (NAO VERSIONAR)
├── logs/                        # Logs PM2 (NAO VERSIONAR)
│
├── ecosystem.config.js          # Config PM2
├── turbo.json                   # Config Turborepo
├── package.json                 # Root package
├── tsconfig.base.json           # TS config base
├── CLAUDE.md                    # Este arquivo
├── AGENTS.md                    # Instrucoes para agentes
└── README.md                    # Doc principal
```

### 3.2 Mapa de Modulos

| ID | App | Porta | PM2 Name | Descricao |
|----|-----|-------|----------|-----------|
| main | main | 4000 | fadex-main | Portal central, proxy |
| viagens | viagens | 4001 | fadex-viagens | Viagens corporativas |
| projetos | projetos | 4002 | fadex-projetos | Gestao de projetos |
| ressarcimentos | ressarcimentos | 4003 | fadex-ressarcimentos | Ressarcimentos |
| extratos | extratos | 4004 | fadex-extratos | Extratos BB |
| relatorios | relatorios | 4006 | fadex-relatorios | Relatorios |
| entradas-saidas | entrada_saida | 4007 | fadex-entrada-saida | Entradas/Saidas |
| servicos-pontuais | servicos-pontuais | 4008 | fadex-servicos | Servicos pontuais |
| credenciamentos | credenciamentos | 4009 | fadex-credenciamentos | Credenciamentos |
| faturas | faturas | 4010 | fadex-faturas | Faturas NFSe |
| assinaturas | assinaturas | 4011 | fadex-assinaturas | Assinaturas email |
| catalogo | catalogo | 4012 | fadex-catalogo | Catalogo links |
| ralph | ralph-dashboard | 4020 | ralph-dashboard | Ralph IA Dashboard |

### 3.3 Multi-Zones Architecture

```
                    ┌─────────────────────────────────────┐
                    │         main:4000 (Proxy)           │
                    │   - NextAuth (login/session)        │
                    │   - Dashboard principal             │
                    │   - Rewrites para outras apps       │
                    └─────────────────┬───────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ projetos:4002   │      │ credenciamentos │      │   faturas:4010  │
│ /projetos/*     │      │     :4009       │      │   /faturas/*    │
└─────────────────┘      │ /credenciamentos│      └─────────────────┘
                         └─────────────────┘
```

**Configuracao de rewrite em `apps/main/next.config.ts`:**

```typescript
async rewrites() {
  return {
    beforeFiles: [
      { source: '/projetos/:path*', destination: 'http://localhost:4002/projetos/:path*' },
      { source: '/credenciamentos/:path*', destination: 'http://localhost:4009/credenciamentos/:path*' },
      // ...
    ]
  };
}
```

---

## 4. Banco de Dados

### 4.1 Arquitetura Dual Database

```
┌─────────────────────────────────────────────────────────────────┐
│                        APLICACAO FADEX                          │
├─────────────────────────────┬───────────────────────────────────┤
│       PostgreSQL            │           SQL Server              │
│       (READ/WRITE)          │           (READ-ONLY)             │
├─────────────────────────────┼───────────────────────────────────┤
│ - Users, Sessions, Accounts │ - Projetos (Snowflake)            │
│ - RoleProfiles              │ - Contas Correntes                │
│ - ExtratoSnapshots          │ - Instituicoes                    │
│ - Links, Categorias         │ - Ressarcimentos                  │
│ - Credenciamentos           │ - Dados historicos                │
└─────────────────────────────┴───────────────────────────────────┘
```

### 4.2 PostgreSQL (Prisma)

**Modelos principais:**

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(MEMBER)  // OWNER, ADMIN, MEMBER, GUEST
  themePreference String  @default("dark")
  // ... relations
}

model credProcesso {
  id              String   @id @default(cuid())
  numero          String
  tipoProcessoId  String
  instituicaoId   String
  status          String
  // ... campos de credenciamento
}
```

### 4.3 SQL Server (mssql - READ-ONLY)

**Conexao via `packages/database/src/mssql-connection.ts`:**

```typescript
// APENAS SELECT - NUNCA modificar dados
const pool = await sql.connect({
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
});
```

**Tabelas principais do Snowflake:**
- `PJTO` - Projetos
- `INSTITUICAO` - Instituicoes
- `CONTA_CORRENTE` - Contas bancarias
- `RESSARCIMENTO` - Dados de ressarcimento

---

## 5. Autenticacao

### 5.1 Fluxo

```
1. Usuario acessa main:4000/login
2. Clica "Entrar com Google"
3. OAuth Google -> callback NextAuth
4. NextAuth cria/atualiza User no PostgreSQL
5. JWT gerado e salvo em cookie
6. Cookie compartilhado entre todas as apps (mesmo dominio)
7. Middleware valida sessao em cada request
```

### 5.2 Roles e Permissoes

| Role | Descricao | Permissoes |
|------|-----------|------------|
| OWNER | Proprietario do sistema | Tudo + gestao de admins |
| ADMIN | Administrador | Tudo exceto gestao de owners |
| MEMBER | Membro padrao | Acesso a modulos autorizados |
| GUEST | Convidado | Acesso limitado/read-only |

### 5.3 Configuracao NextAuth

```typescript
// packages/auth/src/auth.ts
export const authConfig = {
  providers: [Google],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    session: async ({ session, user }) => {
      session.user.role = user.role;
      return session;
    }
  }
};
```

---

## 6. Padroes de Codigo

### 6.1 TypeScript

```typescript
// OBRIGATORIO: Tipagem estrita
interface ProcessoData {
  id: string;
  numero: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  createdAt: Date;
}

// PROIBIDO: any
const data: any = {}; // NUNCA

// CORRETO: Tipos estruturados
const data: ProcessoData = { ... };
```

### 6.2 Componentes React

```typescript
// Componente funcional com tipos
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', size = 'md', children, onClick }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 6.3 API Routes

```typescript
// app/api/processos/[id]/route.ts
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().cuid()
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validar
  const result = paramsSchema.safeParse({ id });
  if (!result.success) {
    return Response.json({ error: 'ID invalido' }, { status: 400 });
  }

  // Buscar dados
  const processo = await prisma.credProcesso.findUnique({
    where: { id }
  });

  if (!processo) {
    return Response.json({ error: 'Nao encontrado' }, { status: 404 });
  }

  return Response.json(processo);
}
```

### 6.4 Hooks Customizados

```typescript
// packages/hooks/src/use-modules.ts
export function useModules() {
  const [modules, setModules] = useState<ModuleDescriptor[]>([]);

  useEffect(() => {
    setModules(getActiveModules());
  }, []);

  return { modules, getById: getModuleById };
}
```

### 6.5 Nomenclatura

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `ModuleCard.tsx`, `ProcessoForm.tsx` |
| Hooks | kebab-case | `use-session-monitor.ts` |
| API Routes | kebab-case | `/api/processos/[id]/route.ts` |
| Utilitarios | camelCase | `formatDate.ts`, `validateCNPJ.ts` |
| Tipos/Interfaces | PascalCase | `ProcessoData`, `UserSession` |
| Constantes | SCREAMING_SNAKE | `MAX_RETRIES`, `API_TIMEOUT` |
| Arquivos CSS | kebab-case | `button-styles.css` |

---

## 7. Comandos

### 7.1 Desenvolvimento

```bash
# Iniciar todos os modulos
npm run dev

# Iniciar modulo especifico
npm run dev:main
npm run dev:projetos
npm run dev:credenciamentos
npm run dev:faturas
npm run dev:catalogo

# Build de producao
npm run build
npm run build:main
```

### 7.2 Qualidade de Codigo

```bash
# Lint
npm run lint
npm run lint:fix

# TypeScript
npm run typecheck

# Formatacao
npm run format
npm run format:check

# Testes
npm run test
npm run test:coverage
```

### 7.3 Banco de Dados

```bash
# Prisma
npm run prisma:generate   # Gerar Prisma Client
npm run prisma:migrate    # Executar migrations
npm run prisma:studio     # Interface visual (localhost:5555)

# Limpar e regenerar
rm -rf node_modules/.prisma
npm run prisma:generate
```

### 7.4 PM2 (Producao)

```bash
# Status
pm2 list
pm2 status

# Logs
pm2 logs                   # Todos
pm2 logs fadex-main        # App especifica
pm2 logs fadex-main --lines 100

# Controle
pm2 restart all
pm2 restart fadex-main
pm2 reload fadex-main      # Zero-downtime

# Gerenciamento
pm2 save                   # Salvar estado
pm2 startup                # Configurar autostart
pm2 delete fadex-main      # Remover app
```

---

## 8. Variaveis de Ambiente

### 8.1 Estrutura

Cada app tem seu `.env.local`. Variaveis compartilhadas sao propagadas via `ecosystem.config.js`.

### 8.2 Variaveis Obrigatorias

```env
# PostgreSQL (todas as apps)
DATABASE_URL="postgresql://user:pass@localhost:5432/fadex"

# Auth (todas as apps - MESMO valor)
AUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:4000"
AUTH_TRUST_HOST="true"

# Owner
OWNER_EMAIL="admin@fadex.org.br"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 8.3 SQL Server

```env
# Apps que acessam Snowflake
DB_SERVER="servidor.database.windows.net"
DB_DATABASE="fade1"
DB_USER="usuario"
DB_PASSWORD="senha"
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### 8.4 Integracoes Especificas

```env
# Banco do Brasil (app extratos)
BB_CLIENT_ID="..."
BB_CLIENT_SECRET="..."
BB_CERT_PATH="/path/to/cert.pem"
BB_KEY_PATH="/path/to/key.pem"

# Google Drive (app faturas)
GOOGLE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_PRIVATE_KEY="..."
GOOGLE_DRIVE_FOLDER_ID="..."

# Projetos
CONTRATOS_PATH="/mnt/contratos/1 - PROJETOS EM EXECUÇÃO"
```

---

## 9. Imports Padrao

### 9.1 Packages Compartilhados

```typescript
// Componentes UI
import { Button, Card, Input, Badge, Table } from '@fadex/ui';
import { Sidebar, Header, ModuleShell } from '@fadex/ui';
import { AreaChart, BarChart, PieChart } from '@fadex/ui';

// Hooks
import { useModules, useSessionMonitor, useContasProjeto } from '@fadex/hooks';

// Tipos
import type { ModuleDescriptor, ModuleKey } from '@fadex/types';
import type { Processo, Instituicao, User } from '@fadex/types';

// Utilitarios
import { formatCNPJ, formatCPF, isValidUUID } from '@fadex/utils';
import { cn } from '@fadex/utils';

// Database
import { prisma } from '@fadex/database';
import { getMssqlPool, executeQuery } from '@fadex/database';

// Auth
import { auth, signIn, signOut } from '@fadex/auth';

// Services
import { withAuth } from '@fadex/services';
```

### 9.2 Imports Internos

```typescript
// Dentro de uma app
import { SomeComponent } from '@/components/SomeComponent';
import { someUtil } from '@/lib/utils';
import type { LocalType } from '@/types';
```

---

## 10. Seguranca

### 10.1 Regras Absolutas

1. **NUNCA** versionar `.env*`, certificados, ou credenciais
2. **NUNCA** modificar dados no SQL Server (read-only)
3. **NUNCA** usar `any` em TypeScript
4. **NUNCA** expor endpoints sem autenticacao
5. **NUNCA** hardcodar senhas ou tokens

### 10.2 Validacao de Inputs

```typescript
// SEMPRE validar com Zod
import { z } from 'zod';

const createProcessoSchema = z.object({
  numero: z.string().min(1).max(50),
  instituicaoId: z.string().cuid(),
  tipoProcessoId: z.string().cuid(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = createProcessoSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // Processar dados validados
  const { numero, instituicaoId, tipoProcessoId } = result.data;
}
```

### 10.3 Autenticacao em APIs

```typescript
import { auth } from '@fadex/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
    return Response.json({ error: 'Sem permissao' }, { status: 403 });
  }

  // Continuar...
}
```

---

## 11. Troubleshooting

### 11.1 Erro de Build

```bash
# Limpar cache
rm -rf apps/*/.next
rm -rf node_modules/.cache
npm run build
```

### 11.2 Erro de Tipos Prisma

```bash
npm run prisma:generate
# Se persistir:
rm -rf node_modules/.prisma
npm install
npm run prisma:generate
```

### 11.3 Memoria Insuficiente

```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### 11.4 Porta em Uso

```bash
lsof -i :4000
kill -9 <PID>
```

### 11.5 PM2 Nao Inicia

```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### 11.6 Sessao Nao Persiste Entre Apps

Verificar se `AUTH_SECRET` e `NEXTAUTH_URL` sao identicos em todas as apps.

---

## 12. Documentacao

### 12.1 Estrutura

```
docs/
├── README.md                  # Indice geral
├── arquitetura/              # Multi-zones, Turborepo
├── banco-dados/              # SQL Server, Snowflake
├── integracao/               # APIs BB, Google
├── ui/                       # Design system
├── troubleshooting/          # Problemas comuns
├── seguranca/                # Auditorias
├── planejamento/             # Roadmaps
├── testes/                   # Relatorios
├── infraestrutura/           # Rede, deploy
└── historico/                # Arquivo morto
```

### 12.2 Docs Essenciais

- `docs/arquitetura/ARQUITETURA_MULTI_ZONES_COMPLETA.md`
- `docs/integracao/AUTENTICACAO_TRANSPARENTE.md`
- `docs/ui/DESIGN-SYSTEM.md`
- `docs/banco-dados/ANALISE_BANCO_DADOS.md`

---

## 13. Checklist para Tarefas

### 13.1 Antes de Comecar

- [ ] Li os arquivos relevantes
- [ ] Entendi a estrutura do modulo
- [ ] Verifiquei se existe em `packages/`
- [ ] Identifiquei dependencias

### 13.2 Durante Desenvolvimento

- [ ] Usando tipos TypeScript
- [ ] Validando inputs com Zod
- [ ] Tratando erros adequadamente
- [ ] Seguindo padroes de nomenclatura

### 13.3 Antes de Commitar

- [ ] Codigo compila sem erros
- [ ] `npm run lint` passa
- [ ] `npm run typecheck` passa
- [ ] Sem credenciais hardcoded
- [ ] Commit message semantica

---

## 14. Commits

### 14.1 Formato

```
tipo: descricao curta em portugues

Corpo opcional explicando o que e por que.

Refs: #123
```

### 14.2 Tipos

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correcao de bug |
| `refactor` | Refatoracao sem mudanca funcional |
| `docs` | Documentacao |
| `style` | Formatacao, espacos |
| `test` | Testes |
| `chore` | Tarefas de manutencao |

### 14.3 Exemplos

```
feat: adiciona filtro por instituicao na listagem de processos

fix: corrige validacao de CNPJ com pontuacao

refactor: extrai logica de formatacao para @fadex/utils

docs: atualiza README com instrucoes de setup
```

---

## 15. Design System e Estilo Frontend

### 15.1 Filosofia Visual

| Principio | Descricao |
|-----------|-----------|
| **Notion-inspired** | Cores quentes, neutras, suaves — nao corporativo frio |
| **Sem alto contraste** | Bordas em `border-border/60`, nunca preto puro sobre branco puro |
| **Sem neon** | Nunca usar verde neon (#00ff00), amarelo berrante, etc. |
| **Grid de 8px** | Espacamento sempre multiplo de 8 (8, 16, 24, 32, 40, 48...) |
| **Warm neutrals** | Cinzas quentes (#2d2b28, #73716d, #e0dfd9) em vez de cinzas puros |
| **Valores nunca truncam** | Numeros financeiros NUNCA devem ter "..." — reduzir font-size se preciso |
| **Alinhamento rigoroso** | Cards lado a lado devem ter titulo com h fixo para alinhar valores abaixo |

### 15.2 Stack de UI

```
shadcn/ui (Radix Primitives)  →  @fadex/ui (customizado)  →  Apps
         ↑                              ↑
   Radix UI (acessibilidade)    Tailwind CSS v4 + CSS Variables
```

- **Radix UI**: Todos os componentes interativos (Dialog, DropdownMenu, Select, Popover, Tabs, Accordion, Tooltip, Switch, Checkbox)
- **shadcn/ui**: Base dos componentes, customizados no `@fadex/ui`
- **Tailwind v4**: Utilitarios, sem `tailwind.config.ts` legado — usa CSS nativo
- **Lucide Icons**: Unico pacote de icones (nunca Heroicons, FontAwesome, etc.)
- **Recharts**: Graficos (AreaChart, BarChart, PieChart, ComposedChart)

### 15.3 Paleta de Cores (CSS Variables)

**Modo Claro (`:root`)**

```css
/* Backgrounds */
--background: #f5f4f0;              /* Fundo principal - branco quente */
--background-secondary: #eeedea;    /* Sidebar, areas secundarias */
--background-hover: #e4e3df;        /* Hover em superficies */

/* Textos */
--foreground: #2d2b28;              /* Texto principal - cinza escuro quente */
--foreground-secondary: #73716d;    /* Texto secundario */
--foreground-tertiary: #a09e9a;     /* Texto terciario / muted */

/* Marca */
--primary: #2563eb;                 /* Azul 600 - acoes principais */
--primary-hover: #1d4ed8;           /* Azul 700 */

/* Status */
--status-success: #16a34a;          /* Verde 600 */
--status-danger: #dc2626;           /* Vermelho 600 */
--status-warning: #ca8a04;          /* Ambar 600 */
--status-info: #2563eb;             /* Azul 600 */

/* Bordas */
--border: #e0dfd9;                  /* Borda sutil quente */
--border-hover: #d0cfc8;            /* Borda hover */
```

**Modo Escuro (`.dark`)**

```css
--background: #191919;              /* Notion dark */
--background-secondary: #202020;
--foreground: #e3e2e0;
--foreground-secondary: #9b9a97;
--primary: #3b82f6;                 /* Azul 500 - mais claro no escuro */
--border: #2f2f2f;
```

### 15.4 Sistema de Espacamento (Grid 8px)

**Regra: todo espacamento deve ser multiplo de 8px (0.5rem)**

| Tailwind | Valor | Uso |
|----------|-------|-----|
| `p-2` / `gap-2` | 8px | Espacamento minimo entre elementos |
| `p-3` / `gap-3` | 12px | Padding interno de badges, chips |
| `p-4` / `gap-4` | 16px | Padding padrao de cards, gap de grids |
| `p-6` / `gap-6` | 24px | Padding de secoes, gaps maiores |
| `p-8` / `gap-8` | 32px | Padding de paginas em desktop |
| `p-10` | 40px | Espacamento grande entre secoes |
| `p-12` | 48px | Areas de respiro visual |

**Padding responsivo padrao:**
```tsx
// Cards
className="p-4 sm:p-6"

// Paginas (main content)
className="p-4 sm:p-6 lg:p-8"

// Secoes dentro de pagina
className="space-y-6"  /* ou space-y-8 */
```

### 15.5 Bordas e Sombras

**Bordas — sempre suaves, nunca alto contraste:**

```tsx
// Borda padrao (sutil)
className="border border-border/60 rounded-xl"

// Borda em hover
className="hover:border-border-hover"

// Card padrao
className="rounded-xl border border-border/40 bg-card/50 shadow-sm"

// Separadores
className="border-t border-border/30"
```

**Sombras — discretas e quentes:**

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 2px 4px rgba(0,0,0,0.07);
--shadow-card: 0 1px 3px rgba(0,0,0,0.06);
--shadow-glass: 0 2px 8px rgba(0,0,0,0.08);
```

**Arredondamento padrao:**

| Classe | Valor | Uso |
|--------|-------|-----|
| `rounded-lg` | 8px | Botoes, inputs, badges |
| `rounded-xl` | 12px | Cards, modais, dropdowns |
| `rounded-2xl` | 16px | Cards maiores, hero sections |
| `rounded-full` | 9999px | Avatares, chips, pills |

### 15.6 Tipografia

- **Fonte**: Inter (Google Fonts) — weights 400, 500, 600, 700
- **Base**: 16px / 1rem
- **Mobile**: inputs sempre 16px (evita zoom no iOS)

| Elemento | Classes |
|----------|---------|
| h1 (pagina) | `text-2xl font-bold tracking-tight` |
| h2 (secao) | `text-lg font-semibold` |
| h3 (card title) | `text-base font-medium` |
| Texto body | `text-sm text-foreground` |
| Texto muted | `text-sm text-muted-foreground` |
| Label | `text-sm font-semibold` |
| Caption | `text-xs text-muted-foreground` |
| Monospace | `font-mono` (numeros de conta, valores) |

### 15.7 Componentes — Padroes de Uso

**Card padrao:**
```tsx
<Card className="rounded-xl border border-border/40 bg-card/50 shadow-sm">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5" />
      Titulo
    </CardTitle>
    <CardDescription>Descricao curta</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* conteudo */}
  </CardContent>
</Card>
```

**Stats grid (KPIs):**
```tsx
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-xl border border-border/50 bg-card/50 p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">Label</p>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="mt-1 text-2xl font-semibold">R$ 1.234,56</p>
  </div>
</div>
```

**Tabela padrao:**
```tsx
<div className="rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden">
  <Table>
    <TableHeader className="bg-muted/30">
      <TableRow className="hover:!bg-transparent">
        <TableHead>Coluna</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="!border-border/30 hover:!bg-muted/20">
        <TableCell>Valor</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

**Filtros:**
```tsx
<div className="rounded-xl border border-border/50 bg-muted/20 p-4">
  <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Buscar..." className="pl-10" />
    </div>
    <Select>...</Select>
    <Button variant="ghost">Limpar</Button>
  </div>
</div>
```

### 15.8 Responsividade

**Breakpoints (Tailwind padrao):**

| Breakpoint | Largura | Uso |
|------------|---------|-----|
| `sm:` | 640px | Tablets, grids 2 colunas |
| `md:` | 768px | Sidebar visivel, tabela visivel |
| `lg:` | 1024px | Grids 3-4 colunas |
| `xl:` | 1280px | Grids expandidos |

**Padrao mobile-first:**
```tsx
// Cards no mobile, tabela no desktop
<div className="space-y-3 md:hidden">
  {/* Cards mobile */}
</div>
<div className="hidden md:block">
  <Table>...</Table>
</div>
```

**Sidebar:**
- Mobile: drawer overlay com backdrop blur
- Desktop: collapsible (260px expandida, 68px colapsada)
- Altura: `h-dvh` (nunca `h-screen` — dvh respeita barra do navegador mobile)

### 15.9 Transicoes e Animacoes

```css
/* Transicoes rapidas (foco, cor) */
transition-all duration-150

/* Transicoes medias (hover, estado) */
transition-all duration-200

/* Entrada de componente */
transition-all duration-300

/* Tema (light/dark) */
transition: background-color 0.15s ease-out, border-color 0.15s ease-out;
```

**Regra: nunca animar layout (width, height, margin) — apenas transform, opacity, color, background-color, border-color.**

### 15.10 Anti-Patterns (NUNCA FAZER)

| Proibido | Correto |
|----------|---------|
| `border-black` ou `border-white` | `border-border/60` |
| `bg-green-500` para sucesso | `bg-status-success-bg text-status-success` |
| `text-green-400` neon | `text-emerald-600` (light) / `text-emerald-400` (dark) |
| `shadow-2xl` exagerado | `shadow-sm` ou `shadow-card` |
| `rounded-none` em cards | Minimo `rounded-lg` |
| `text-xs truncate` em valores | Reduzir font-size mas mostrar completo |
| `h-screen` no layout | `h-dvh` (dynamic viewport height) |
| `any` em TypeScript | Tipos explicitos sempre |
| Hardcodar cores hex inline | Usar CSS variables ou Tailwind tokens |
| Misturar icon libraries | Apenas Lucide React |

---

*Ultima atualizacao: Fevereiro 2026*
