# Vortex One — Complete Technology Stack

**Repository:** `kristinavirtualassistant-coder/vortex-one-platform-cmcrealty`
**Revision audited:** `a216f5e9fa656d5107ad753477b36992ddbf193a`
**Application:** Vortex One Owner Intelligence, CRM, property search, skip-trace, workflow automation, and dialer platform.

## 1. Architecture

Vortex One is a full-stack TypeScript application with a React/Vite browser client, an Express API, PostgreSQL as the authoritative production database, and Cloudflare Containers as the portable production API/runtime target. Netlify serves the web frontend and proxies `/api/*` to the Cloudflare Worker.

```text
Browser
  │
  ▼
Netlify — React/Vite static frontend
  │ /api/*
  ▼
Cloudflare Worker
  │
  ▼
Cloudflare Container — Node 22 / Express
  │
  ▼
Supabase PostgreSQL — authoritative production state

External integrations:
Google Workspace · Microsoft 365 · RingCentral · AI providers
property-data/GIS providers · email/SMTP · approved webhooks
```

## 2. Frontend

- React 19
- TypeScript 5.8
- Vite 6
- Tailwind CSS 4
- `@tailwindcss/vite`
- React DOM 19
- Lucide React icons
- Motion animations
- Recharts analytics/charts
- D3 data visualization
- React Flow (`@xyflow/react`) workflow graphing
- dnd-kit drag/drop and sortable UI
- SWR data fetching/cache
- Google Maps React integration
- jsPDF and Puppeteer-backed reporting paths
- PapaParse CSV import/export

Primary frontend entry points:
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/types.ts`

Major UI domains:
Dashboard, Command Center, CRM/Leads, Owners, Properties, Property Search, Skip Trace, Campaigns, Dialer, Calls, Workflows, Agents, Approvals, Tasks, Analytics, Reports, Integrations, Audit, Settings, Research Queue, Google Drive/Sheets, and production monitoring.

## 3. Backend

- Node.js 22
- Express 4
- TypeScript / TSX
- esbuild production server bundling
- dotenv environment loading
- PostgreSQL client: `pg`
- PostgreSQL-only production authentication/session authority
- Express middleware for authentication, organization context, RBAC, webhook validation, and request boundaries

Core backend modules:
- `server.ts` — API/application entry point
- `server/db/*` — database, migrations, auth schema, compatibility
- `server/middleware/*` — authentication and PostgreSQL auth middleware
- `server/services/*` — business services
- `server/agents/*` — agent registry/orchestration/sub-agents
- `server/dialer/*` — campaigns, dialing engine, call state, telephony, suppression, webhooks
- `server/workers/*` — asynchronous worker processes
- `server/test/*` — backend and integration tests

## 4. Data and persistence

**Primary production database:** PostgreSQL via Supabase.

Production connection values are represented by environment variables rather than hard-coded credentials:
- `DATABASE_URL`
- `SQL_HOST`
- `SQL_PORT`
- `SQL_DB_NAME`
- `SQL_USER`
- `SQL_PASSWORD`
- `SQL_SSL`
- `AUTH_SESSION_PEPPER`

The production design treats PostgreSQL as authoritative state. Durable workflow runs, authentication/session data, organization/tenant boundaries, CRM records, calls, campaigns, jobs, approvals, audit records, and property/lead state are persisted through the backend database layer.

Local development can use the configured local PostgreSQL settings. Production should not depend on SQLite or browser/localStorage for authoritative application state.

## 5. Authentication and authorization

- PostgreSQL-backed authentication/session model
- Server-side session authority
- Organization/tenant context enforcement
- Backend RBAC
- Roles used throughout protected routes include `admin`, `executive`, `manager`, and `agent`
- Protected routes use `requireAuth` and/or `requireRole`
- Session secret material uses `AUTH_SESSION_PEPPER`
- OAuth integrations use server-side credentials
- Browser-exposed `VITE_*` variables must contain public configuration only

Security boundaries include tenant isolation, role checks, webhook authorization/signatures, external webhook SSRF protection, suppression/DNC enforcement, call-state validation, and production-state boundary tests.

## 6. AI and automation

AI/automation stack:
- Google Gemini SDK: `@google/genai`
- `server/gemini.ts` for server-side Gemini operations/TTS integration
- Agent registry and orchestrator
- Sub-agent execution
- Durable workflow-run persistence
- Job queue/service boundaries
- Human approval workflow
- Scheduled workflow execution
- Email outreach queue and worker
- Property refresh worker/scheduler
- Call analysis and transcript tooling

The platform supports workflows that plan, execute, persist results, require approvals where configured, and expose run state to the frontend.

## 7. CRM and property intelligence

CRM capabilities:
- canonical lead creation/upsert
- lead scoring/rescoring
- owner records
- lead/contact management
- bulk lead updates/deletes
- outreach templates
- email outreach
- campaign management
- task creation and follow-up

Property intelligence capabilities:
- property search
- property inventory
- owner/property relationship handling
- bulk tagging and updates
- property-to-lead conversion
- skip tracing
- automated enrichment
- property refresh scheduling
- GIS/public-data provider abstraction
- property reports/PDF generation

Provider abstraction is centered on `UnifiedPropertyDataProvider` and `PropertyDataProvider` so providers can be enabled without coupling the core application to one vendor.

Implemented provider adapters include county GIS/public-data integrations for Alameda, Los Angeles, Orange, Riverside, Sacramento, San Bernardino, San Diego, Santa Clara, and Ventura, plus ArcGIS, ATTOM, Google Maps, NetrOnline, Realtor, Redfin, Zillow, and ZoomInfo adapters where configured.

## 8. Telephony and dialer

Telephony stack:
- RingCentral SDK
- provider adapter architecture
- RingCentral webhook verification/validation
- campaign manager
- dialing engine
- manual dial service
- dial request validation
- suppression/DNC service
- call state machine/FSM
- durable call events/state transitions
- real-time dialer stream
- voicemail management/drop controls
- call disposition and notes
- call transcript/AI analysis

RingCentral credentials and JWT material are server-side secrets and must never be placed in source code or browser-exposed environment variables.

## 9. Integrations

Supported integration architecture includes:
- Google Workspace / Google Drive / Google Sheets
- Microsoft 365
- RingCentral
- AI providers
- CRM systems
- Slack
- SMTP/email services
- property-data/GIS providers
- approved external webhooks

OAuth flow is implemented in `server/services/integrationOAuth.ts`. Integration credentials are encrypted/configured server-side and are not intended for `VITE_*` exposure.

## 10. Deployment

### Netlify frontend

- Site: `vortexone-cmc`
- Site URL: `https://vortexone-cmc.netlify.app/`
- Build: `npm ci && npm run build`
- Publish directory: `dist`
- Node: 22
- `/api/*` is configured to proxy to `https://vortex-one.workers.dev/api/:splat`
- SPA fallback routes all remaining paths to `/index.html`
- Production deployment workflow: `.github/workflows/netlify-deploy.yml`

### Cloudflare

- Worker name: `vortex-one`
- Worker target: `https://vortex-one.workers.dev`
- Runtime: Cloudflare Workers + Cloudflare Containers
- Container base: Node 22 Bookworm Slim
- Container port: 8080
- Node compatibility enabled
- Observability enabled
- Durable Object binding: `VORTEX_ONE_CONTAINER`
- Required secret: `SQL_PASSWORD`
- Account credentials are supplied through GitHub Actions secrets, not source control

Cloudflare deployment workflow:
`.github/workflows/cloudflare-deploy.yml`

### Container

`Dockerfile` uses a two-stage build:
1. Node 22 build image installs dependencies and runs the Vite/esbuild production build.
2. Node 22 runtime image installs production dependencies and starts `dist/server.cjs` on port 8080.

## 11. CI/CD and quality

GitHub Actions:
- `.github/workflows/ci.yml`
- `.github/workflows/netlify-deploy.yml`
- `.github/workflows/cloudflare-deploy.yml`

CI uses:
- Ubuntu runners
- Node 22
- npm lockfile with `npm ci`
- TypeScript validation
- production build
- Cloudflare Worker typecheck
- PostgreSQL 16 service container for integration tests

Primary commands:
```bash
npm ci
npm run lint
npm run build
npm test
npx tsc --noEmit -p deploy/cloudflare-app/tsconfig.json
```

Application test suite is in `server/test/` and covers authentication, tenant boundaries, RBAC, PostgreSQL authority, workflow/jobs, dialer state, campaigns, property search/providers, webhook security, integrations, scheduler contracts, and production acceptance.

## 12. Package manifest

Runtime/framework dependencies currently declared in `package.json` include:
- `react`, `react-dom`, `vite`, `typescript`, `tsx`, `express`, `esbuild`
- `pg`, `dotenv`
- `@google/genai`, `@ringcentral/sdk`
- `@cloudflare/containers`, `@cloudflare/workers-types`
- `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `@xyflow/react`, `d3`, `recharts`, `@vis.gl/react-google-maps`
- `lucide-react`, `motion`, `swr`
- `papaparse`, `jspdf`, `puppeteer`
- Express/Node/PostgreSQL TypeScript definitions

Dependency override:
- `qs` is pinned through the package override to the current declared secure major/minor range.

Engine requirements:
- Node `>=22 <23`
- npm `>=10 <12`

## 13. Important repository files

```text
package.json                 dependency/scripts manifest
package-lock.json            reproducible npm dependency lock
server.ts                    Express API/application
src/                         React frontend
server/                      backend services and tests
deploy/cloudflare-app/       Cloudflare Worker/container deployment
.github/workflows/           CI/CD workflows
Dockerfile                   production container build
netlify.toml                 Netlify build/proxy/SPA configuration
.env.example                 environment contract template
vite.config.ts               frontend build configuration
tsconfig.json                TypeScript configuration
TECHSTACK.md                 this canonical technology-stack document
docs/                        architecture, deployment, security, and execution docs
scripts/                     operational/local scripts
```

## 14. Environment contract

Required/important production variables include:
```text
NODE_ENV
PORT
DATABASE_URL
SQL_HOST
SQL_PORT
SQL_DB_NAME
SQL_USER
SQL_PASSWORD
SQL_SSL
AUTH_SESSION_PEPPER
APP_URL
INTEGRATION_ENCRYPTION_KEY
```

Optional provider/OAuth variables are configured only when the corresponding integration is enabled. Secrets must be stored in the deployment secret manager or CI/CD secret store.

## 15. Operational rules

1. PostgreSQL is the production source of truth.
2. Do not place credentials, JWTs, API tokens, OAuth secrets, or database passwords in source control.
3. Do not expose private provider credentials through `VITE_*` variables.
4. Production API routes must remain organization-scoped and role-protected where required.
5. External webhook destinations must pass SSRF/security validation and use authenticated signing where supported.
6. Dialing must honor suppression/DNC eligibility and valid call-state transitions.
7. Workflow execution must persist durable run state instead of relying only on process memory.
8. Deployment should use the existing Netlify site and existing Cloudflare Worker; do not create replacement sites unless explicitly authorized.
9. Preserve user-owned changes in working trees.
10. Run build, lint/typecheck, and tests before declaring a code change production-ready.

## 16. Current verified build state

At the time this file was generated:
- `npm ci` completed successfully.
- npm audit reported `0 vulnerabilities`.
- `npm run build` completed successfully.
- Vite transformed 2,983 modules.
- `dist/index.html` and frontend assets were generated.
- `dist/server.cjs` and source map were generated.
- The production Netlify deployment was blocked by an account-level credit restriction, not by a source-code/build error.

## 17. Deployment limitation currently known

Netlify authentication is working for the configured account/team. The existing production site is linked locally. A direct production deployment attempt returned HTTP 403 because the Netlify account had exceeded its credit usage and Netlify blocked new deploys.

This is an external account/billing/platform restriction. It does not indicate a failed Vortex One compilation or failed local production build.

## 18. Canonical URLs

- Repository: `https://github.com/kristinavirtualassistant-coder/vortex-one-platform-cmcrealty`
- Frontend: `https://vortexone-cmc.netlify.app/`
- Intended API Worker: `https://vortex-one.workers.dev`

## 19. Completion definition

Vortex One should be considered technically complete only when all of the following are true:

- source code is clean and committed
- frontend production build passes
- TypeScript checks pass
- full automated test suite passes
- PostgreSQL integration tests pass
- authentication/session persistence is PostgreSQL-backed
- tenant isolation and RBAC tests pass
- dialer/call state and suppression tests pass
- webhook security tests pass
- Cloudflare Worker/container deployment succeeds
- PostgreSQL production connection succeeds
- Netlify production deployment succeeds
- `/api/health` and `/api/ready` return healthy/ready states in production
- frontend can authenticate and reach the production API
- a real end-to-end workflow, CRM lead operation, property search, and dialer operation can be verified against production dependencies

## 20. Source of truth

This document describes the repository as it exists at the revision recorded at the top of this file. When architecture or dependencies change, update this document together with the corresponding source/configuration and re-run the validation commands above.
