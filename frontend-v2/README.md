# frontend-v2 — live marketing site

> Este subdirectorio es la **cara pública y actual** de opitacode.com. Reemplazó al legacy en `../frontend/` (HTML/CSS plano, todavía hosteado para rutas SEO y legales).
> **This subdirectory is the current public face** of opitacode.com. It replaced the legacy `../frontend/` (plain HTML/CSS, still hosted for SEO and legal routes).

## Stack

| | |
|---|---|
| Astro | 6.3 |
| React | 19.2 |
| TypeScript | 5.x |
| Tailwind | 4.3 (Vite plugin) |
| Tests E2E | `@playwright/test` 1.42 (3 specs) |
| Node | 22.12+ |

Ver `package.json` y `astro.config.mjs` para detalle.

## Estructura · Structure

```
frontend-v2/
├── astro.config.mjs                  Astro + React + Tailwind (Vite plugin)
├── playwright.config.ts              config Playwright
├── public/                           founder, og-image, vibe-logo (sin logos gráficos — marca tipográfica `>_`)
├── src/
│   ├── layouts/Layout.astro         layout base con i18n + SEO + OG
│   ├── pages/
│   │   ├── index.astro              raíz (lang detectado vía prop)
│   │   ├── es/index.astro
│   │   ├── en/index.astro
│   │   ├── es/projects/index.astro
│   │   └── en/projects/index.astro
│   ├── components/
│   │   ├── ContactForm.tsx          formulario de contacto (→ SES via Lambda)
│   │   ├── ThemeToggle.astro        dark/light mode
│   │   └── projects/
│   │       ├── AuthForm.tsx                 magic link login
│   │       ├── ProjectsDashboard.tsx       dashboard del cliente
│   │       ├── ProjectTracker.tsx          tracker de estado
│   │       ├── ChatPanel.tsx               chat IA clientes
│   │       └── DeliverablesPanel.tsx       entregables
│   └── styles/global.css
├── e2e/                              Playwright specs (auth, prod, projects)
└── tsconfig.json
```

## Quick start

```bash
cd frontend-v2
npm install
npm run dev           # → http://localhost:4321

# build
npm run build         # → dist/

# tests e2e (Playwright)
npm run test:e2e      # requiere PUBLIC_AUTH_API_URL apuntando al CoreAPI
```

## Deploy

Forma parte de `.github/workflows/deploy.yml` del repo raíz: cada push a `main` ejecuta `npm ci && npm run build` y sincroniza `dist/` a `s3://opitacode.com`, con cache-control 4h e invalidación de CloudFront (`EO2EU8EVU2RVR`).

## Auth de clientes

`components/projects/AuthForm.tsx` postea al CoreAPI de Vibe Studio:

```
POST {PUBLIC_AUTH_API_URL || "https://api.opitacode.com"}/auth/request
{ email, service: "opita-code", redirectTo: "https://opitacode.com/projects" }
```

El usuario aterriza en `/projects` con sesión autenticada vía magic link de un solo uso.

## i18n

i18n sin lib externa — Astro routing basado en `src/pages/{es,en}/` y `<Layout lang="…" />`. Las traducciones viven inline en cada componente.

| Locale | Ruta raíz | Ruta projects |
|---|---|---|
| `es` | `/es/` | `/es/projects/` |
| `en` | `/en/` | `/en/projects/` |

> **Nota:** El `index.astro` en la raíz (`/`) NO es la landing principal — la landing principal es `pages/es/index.astro`. Investigar antes de cambiarla si entrás nuevo al repo.

## Tests E2E (Playwright)

3 specs en `e2e/`:
- `auth.spec.ts` — flujo magic link (happy path + invalid_token + missing_token)
- `prod.spec.ts` — smoke contra `https://opitacode.com`
- `projects.spec.ts` — dashboard autenticado de proyectos

Antes de correrse contra producción, seteá `PLAYWRIGHT_TEST_BASE_URL=https://opitacode.com` y un email de prueba real (el form es no determinístico en SES — el spec depende del inbox de prueba).

## Relación con otros repos

| Repo | Rol |
|---|---|
| [`www.opitacode.com`](../) (raíz) | contiene este subdir, `backend/`, `supabase/`, `frontend/` legacy |
| [`opita-account-ui`](https://github.com/Opita-Code/opita-account-ui) | UI privada de cuenta del cliente (privado, AWS Amplify) |
| [`vibe-ai-backend`](https://github.com/Opita-Code/opita-vibe-studio/tree/main/packages/vibe-ai-backend) | Lambda CoreAPI del magic-link (`service: 'opita-code'`) |

## Pendiente propio

- Reemplazar este README (era el Astro starter default).
- Coordinar despliegue de páginas legales en `../frontend/legal/` con `aws s3 sync` de la raíz (que sobrescribe con `--delete`).

---

<sub>Última revisión del README: **2026-07-28** — auditoría org-wide. Realizado después del root README del repo (mismo commit, atomic story).</sub>
