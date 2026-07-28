<div align="center">

<img src="frontend-v2/public/logo-horizontal-light.svg" alt="Opita Code" height="50" />

# www.opitacode.com

**Sitio corporativo de Opita Code.** Software práctico para negocios reales, construido desde Colombia con identidad local y ambición global.
**Opita Code corporate site.** Practical software for real businesses, built from Colombia with local identity and global ambition.

[![Stack](https://img.shields.io/badge/astro-v6.3-blueviolet)](https://github.com/Opita-Code/www.opitacode.com)
[![React](https://img.shields.io/badge/react-19.2-149eca)](https://github.com/Opita-Code/www.opitacode.com)
[![Tailwind](https://img.shields.io/badge/tailwindcss-4.3-38bdf8)](https://github.com/Opita-Code/www.opitacode.com)
[![Backend](https://img.shields.io/badge/aws-sam-yellow)](https://github.com/Opita-Code/www.opitacode.com)
[![DB](https://img.shields.io/badge/db-supabase-3ecf8e)](https://github.com/Opita-Code/www.opitacode.com)
[![Site](https://img.shields.io/badge/site-opitacode.com-6366f1)](https://opitacode.com)

[Visita el sitio](https://opitacode.com) · [Proyectos autenticados](https://opitacode.com/projects) · [Contacto](https://opitacode.com/#contacto)

</div>

---

## Estado del proyecto · Project state

| | |
|---|---|
| **Producción** | <https://opitacode.com/> (CloudFront `EO2EU8EVU2RVR` + S3) |
| **Landing lenguaje** | Bilingüe: español (`/es`) + inglés (`/en`) + ruta raíz (`/`) |
| **Frontend v2** | Astro 6.3 + React 19.2 + Tailwind 4.3 — deployado desde `main` vía GitHub Actions |
| **Frontend legado** | HTML/CSS estático (sin build), mantenido para `/legal/*` (cookies, privacidad, términos) y rutas SEO legacy |
| **Backend** | AWS SAM (`template.yaml`) — API Gateway + Lambda (Node.js 20 ESM, arm64) + SES para `/contact` |
| **DB** | Supabase (Postgres) — tabla `opita_projects` (`migrations/20260512_init_opita_projects.sql`) |
| **Auth de clientes** | Magic Link (reusa el CoreAPI de Vibe Studio, `service: 'opita-code'`, redirect → `/projects`) |
| **Tests** | 2 capas: backend Lambda (`node:test`, raíz) + e2e Astro (Playwright 1.42, en `frontend-v2/`) |
| **Origen** | Mono-repositorio: `frontend/` + `frontend-v2/` + `backend/` + `supabase/` |

## ¿Qué es? · What is it?

**ES** — Sitio público y dashboard autenticado de Opita Code. La landing bilingüe presenta los productos verticales (`opita-market`, Vibe Studio, `trabajos.opitacode.com`, …) y permite a clientes autenticados consultar sus proyectos, deliverables y chatear con el equipo vía `/projects`.

**EN** — Opita Code's public site and authenticated client dashboard. The bilingual landing presents vertical products and lets authenticated clients track their projects, deliverables, and chat with the team at `/projects`.

## Arquitectura · Architecture

```
www.opitacode.com/
├── frontend/                       LEGACY — HTML + CSS plano (sin build)
│   ├── index.html                  landing SEO legacy
│   ├── 404.html
│   ├── legal/                      cookies.html · privacidad.html · terminos.html
│   ├── robots.txt · sitemap.xml
│   └── assets/                     css, fonts, img (logos, founder, favicons)
│
├── frontend-v2/                    ACTIVE — Astro v6 + React 19 + Tailwind 4
│   ├── astro.config.mjs
│   ├── playwright.config.ts
│   ├── public/                     favicons, logos (light/dark/glass), founder, og-image
│   └── src/
│       ├── layouts/Layout.astro    Base con i18n + SEO + OG
│       ├── pages/
│       │   ├── index.astro         raíz (default lang)
│       │   ├── es/index.astro
│       │   ├── en/index.astro
│       │   ├── es/projects/index.astro
│       │   └── en/projects/index.astro
│       ├── components/
│       │   ├── ContactForm.tsx
│       │   ├── ThemeToggle.astro
│       │   └── projects/
│       │       ├── AuthForm.tsx           Magic Link → CoreAPI (service: 'opita-code')
│       │       ├── ProjectsDashboard.tsx   proyectos del cliente
│       │       ├── ProjectTracker.tsx     tracker de estado
│       │       ├── ChatPanel.tsx          chat IA para clientes
│       │       └── DeliverablesPanel.tsx  entregables
│       └── styles/global.css
│
├── backend/                        AWS SAM — contact form
│   ├── template.yaml               S3 + CloudFront + API Gateway + Lambda + SES
│   ├── src/contact-form.mjs        Lambda handler (validación + rate-limit + SES)
│   └── tests/contact-form.test.mjs tests con node:test + node:assert/strict
│
├── supabase/                       Postgres project
│   ├── config.toml                 config del proyecto
│   ├── migrations/20260512_init_opita_projects.sql
│   └── templates/magic_link.html   template del email de magic link
│
├── package.json                    runner de tests del backend (node:test)
├── package-lock.json
├── .github/workflows/deploy.yml    build + s3 sync + CloudFront invalidation
└── README.md
```

## Stack · Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend v2 | Astro · React · TypeScript · Tailwind (Vite plugin) | Astro 6.3 · React 19.2 · Tailwind 4.3 |
| i18n | Astro routing (`pages/{es,en}/`) — sin lib externa | — |
| Frontend legado | HTML + CSS variables + assets planos | — |
| Auth (clientes) | Magic Link — reusa CoreAPI de Vibe Studio (`service: 'opita-code'`) | — |
| Backend contacto | AWS SAM · API Gateway · Lambda Node.js 20 ESM (arm64) | nodejs20.x · MemorySize 128 |
| Mail | SES (`SendEmailCommand`) · rate-limit in-memory | 5 req / 60 s / IP |
| DB | Supabase (Postgres) | — |
| Hosting | S3 + CloudFront (`EO2EU8EVU2RVR`) + Route53 + ACM | us-east-1 |
| Tests | `node:test` (backend) · `@playwright/test 1.42` (e2e Astro) | 3 specs e2e: auth, prod, projects |
| CI/CD | GitHub Actions en push a `main` | `.github/workflows/deploy.yml` |

## Auth de clientes · Customer auth

El form `frontend-v2/src/components/projects/AuthForm.tsx` postea a:

```
POST {PUBLIC_AUTH_API_URL || "https://api.opitacode.com"}/auth/request
Content-Type: application/json
{
  "email": "<cliente>@…",
  "service": "opita-code",
  "redirectTo": "https://opitacode.com/projects"
}
```

El CoreAPI envía un email con el branding de Opita Code (`#6366f1`) y un magic link de un solo uso. Errores manejados desde URL: `invalid_token`, `missing_token`.

> El dashboard autenticado vive en [`opita-account-ui`](https://github.com/Opita-Code/opita-account-ui) (privado); las integraciones de OCAIS están detrás de ese servicio.

## Quick start

### Frontend v2 (recomendado para nuevos cambios)

```bash
git clone https://github.com/Opita-Code/www.opitacode.com.git
cd www.opitacode.com/frontend-v2
npm install
npm run dev          # → http://localhost:4321
```

### Backend (SAM local)

```bash
cd backend
sam build
sam local start-api  # requiere SAM CLI + Docker
```

### Tests

```bash
# Backend Lambda (raíz del repo)
node --test backend/tests/*.test.mjs

# E2E frontend-v2 (requiere API_AUTH_URL + email de prueba)
cd frontend-v2
npm run test:e2e
```

### Variables de entorno

- Backend Lambda (en `template.yaml Globals.Function.Environment`): `OWNER_EMAIL`.
- Frontend-v2 (definidas en `frontend-v2/.env` o `.env.production`): `PUBLIC_AUTH_API_URL`.
- El email del propietario está en **`OWNER_EMAIL`** (default `owner@opitacode.com` — sobreescribir en el deploy con la dirección real de contacto).

## Deploy · Deployment

### Pipeline (frontend-v2)

Push a `main` ejecuta `.github/workflows/deploy.yml`:

1. `npm ci` + `npm run build` en `frontend-v2/`
2. `aws s3 sync . s3://opitacode.com --delete --cache-control "max-age=14400"`
3. `aws cloudfront create-invalidation --distribution-id EO2EU8EVU2RVR --paths "/*"`

> ⚠️ El sync al bucket root sobrescribe TODO el contenido. Las páginas legales en `frontend/legal/` deben estar previamente desplegadas por otro mecanismo (o agregarse al flujo antes de cualquier `aws s3 sync`). Coordinar con el workflow si añadís rutas nuevas fuera de `frontend-v2/`.

### Backend

```bash
cd backend
sam build
sam deploy --guided    # primer deploy — responde a prompts, queda samconfig.toml
```

### Frontend legado

Las páginas en `frontend/legal/` se despliegan manualmente a S3 (no entran en `deploy.yml`). Si sumás páginas SEO nuevas al legado, documentar el path aquí.

## Bilingüismo · i18n

| Locale | Raíz | Projects |
|---|---|---|
| `es` | `/es/` | `/es/projects/` |
| `en` | `/en/` | `/en/projects/` |
| `default` | `/` (mismo que `/es` según `Layout.astro` `lang={lang}`) | `/projects/` |

El Layout detecta el locale vía la propiedad `lang` que cada `.astro` pasa. Las traducciones viven inline en los componentes (no se usa i18n lib).

## Tests

| Layer | Tool | Comando | Cobertura |
|---|---|---|---|
| Backend Lambda | `node:test` + `node:assert/strict` (raíz) | `node --test backend/tests/*.test.mjs` | `contact-form.test.mjs` (validate + rate-limit + SES) |
| E2E (Astro) | `@playwright/test` 1.42 | `cd frontend-v2 && npm run test:e2e` | `auth.spec.ts` · `prod.spec.ts` · `projects.spec.ts` |

Playwright requiere `PLAYWRIGHT_TEST_BASE_URL` apuntando al entorno correcto (`http://localhost:4321` para dev, `https://opitacode.com` para prod).

## Compliance / Legal

- **RGPD / Habeas Data (Colombia)** — la landing incluye `frontend/legal/{cookies,privacidad,terminos}.html`. Estos tres archivos son los oficiales.
- **Email transaccional** — `contact-form.mjs` → SES, receptor `OWNER_EMAIL` configurable.
- **Auth sin password** — no se almacenan hashes de credenciales.
- **DB** — Supabase RLS debe estar habilitado en cualquier tabla nueva bajo `supabase/migrations/`. Ver el init migration para patrón.

## Licencia · License

Propietario · © 2026 Opita Code · Hecho en Colombia 🇨🇴

---

<div align="center">

<sub>Última revisión del README: **2026-07-28** — auditoría org-wide contra `frontend-v2/package.json` (Astro 6.3 · React 19.2 · Tailwind 4.3), `backend/template.yaml` (SAM + nodejs20.x), `frontend-v2/src/components/projects/AuthForm.tsx` (CoreAPI endpoint), `.github/workflows/deploy.yml` (CloudFront `EO2EU8EVU2RVR`). Pendientes separados: (a) reemplazar `frontend-v2/README.md` que es el Astro starter default — placeholder; (b) alinear `template.yaml` para que el deploy del backend también sea CI-driven.</sub>

</div>
