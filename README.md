# Vortex One

Vortex One is a multi-tenant property intelligence and operations platform with PostgreSQL-backed authentication, property/owner/lead data, CRM workflows, dialer operations, AI agents, durable jobs, workflow execution, approvals, and integration services.

## Production architecture

- React + Vite frontend
- Express API
- PostgreSQL as the authoritative production datastore
- Session-based PostgreSQL authentication
- Organization-scoped RBAC and tenant isolation
- Durable PostgreSQL jobs and workflow runs
- Cloudflare Worker/Container deployment path
- Netlify frontend deployment path

## Local validation

```bash
npm ci
npm run lint
npm run build
npm test
```

The integration test suite starts against a PostgreSQL 16 service in CI. Live county GIS integration tests remain opt-in and are not run by the normal CI suite.

## Required production environment

At minimum, production requires:

- `NODE_ENV=production`
- `PORT=8080`
- `DATABASE_URL` or the `SQL_*` PostgreSQL connection settings
- `AUTH_SESSION_PEPPER` with a strong random value
- `VORTEX_ONE_SEED_DEMO_DATA=0`
- provider credentials configured server-side only

Do not expose database credentials, OAuth secrets, telephony secrets, AI provider secrets, or encryption keys through `VITE_*` variables.

## Deployment

### Netlify frontend

The repository contains `netlify.toml` with:

```
npm ci && npm run build
```

and publishes `dist`. Browser API requests under `/api/*` are proxied to the production Cloudflare Worker endpoint.

### Cloudflare backend

The Cloudflare deployment configuration is under `deploy/cloudflare-app/`. The deployment workflow is manual and requires GitHub environment secrets for the Cloudflare API token and account ID.

The PostgreSQL password is intentionally kept as a Cloudflare secret rather than committed to source control.

## Security

Production API access is authenticated. Organization context is derived from the authenticated PostgreSQL user and client-supplied organization identifiers are not treated as authoritative. Privileged mutations use backend RBAC.

External webhook delivery includes URL validation, SSRF address blocking, signed payloads, retry handling, and PostgreSQL delivery records.

## Approval boundary

The `production-readiness` branch is the release candidate. The `main` branch is not changed automatically. Merge and production approval remain manual.
