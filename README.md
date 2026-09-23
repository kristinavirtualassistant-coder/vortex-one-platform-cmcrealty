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

The controlled production workflow is `.github/workflows/netlify-deploy.yml`. It is manual-only and requires these GitHub environment secrets in the `production` environment:

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

The workflow builds, lints, and deploys `dist` with the pinned Netlify CLI version.

### Cloudflare backend

The Cloudflare deployment configuration is under `deploy/cloudflare-app/`. The deployment workflow is manual-only and requires these GitHub environment secrets in the `production` environment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The PostgreSQL password is intentionally kept as a Cloudflare secret rather than committed to source control.

The Worker configuration uses the public endpoint:

`https://vortex-one.workers.dev`

After the first successful deployment, verify:

```
curl -i https://vortex-one.workers.dev/
curl -i https://vortex-one.workers.dev/api/health
```

### Production sequence

1. Configure the required GitHub `production` environment secrets.
2. Run `Vortex One Cloudflare Deployment` manually.
3. Verify the Worker hostname and `/api/health`.
4. Run `Vortex One Netlify Deployment` manually.
5. Verify `https://vortexone-cmc.netlify.app/` and authenticated API flows through `/api/*`.
6. Only then approve and merge PR #1 into `main`.

## Security

Production API access is authenticated. Organization context is derived from the authenticated PostgreSQL user and client-supplied organization identifiers are not treated as authoritative. Privileged mutations use backend RBAC.

External webhook delivery includes URL validation, SSRF address blocking, signed payloads, retry handling, and PostgreSQL delivery records.

## Approval boundary

The `production-readiness` branch is the release candidate. The `main` branch is not changed automatically. Merge remains manual. Production deployments are also manual and secret-gated.
