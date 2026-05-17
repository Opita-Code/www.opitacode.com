# www.opitacode.com

> 🇨🇴 Superficie pública de **Opita Code** — página web corporativa en `opitacode.com`.

**Software práctico para negocios reales.** Construido desde Colombia con identidad local y ambición global.

---

## Arquitectura

El sitio tiene dos frontends y un backend serverless. La v2 (Astro) está reemplazando progresivamente al frontend legado (HTML plano).

```
opitacode-web/
├── frontend/                   # ⚠️ Legado — HTML + CSS plano (sin build)
│   ├── index.html              # Landing principal
│   ├── assets/css/             # CSS variables + estilos del landing
│   └── legal/                  # Términos, privacidad, cookies
│
├── frontend-v2/                # ✅ Activo — Astro + React
│   └── src/
│       ├── pages/
│       │   └── index.astro     # Página de proyectos (autenticada)
│       ├── components/
│       │   ├── AuthForm.tsx        # Magic Link login (→ CoreAPI con service: 'opita-code')
│       │   ├── ProjectsDashboard.tsx  # Dashboard de proyectos del cliente
│       │   ├── ProjectTracker.tsx     # Tracker de estado de proyectos
│       │   ├── ChatPanel.tsx          # Chat con IA para clientes
│       │   ├── DeliverablesPanel.tsx  # Panel de entregables
│       │   ├── ContactForm.tsx        # Formulario de contacto
│       │   └── ThemeToggle.astro      # Toggle dark/light mode
│       ├── layouts/
│       └── styles/
│
├── backend/                    # Serverless (AWS SAM)
│   ├── template.yaml           # SAM template: API Gateway + Lambda
│   └── src/
│       └── contact-form.mjs    # Lambda: formulario de contacto vía SES
│
└── supabase/                   # Base de datos (Supabase / Postgres)
    ├── migrations/             # Migraciones de base de datos
    └── config.toml             # Config del proyecto Supabase
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend v2 | Astro + React + TypeScript |
| Frontend legado | HTML + CSS plano (sin build, sin frameworks) |
| Auth | Magic Links propios (CoreAPI de vibe-ai-backend, `service: 'opita-code'`) |
| Backend contacto | AWS Lambda (Node.js ESM) + API Gateway + SES |
| Base de datos | Supabase (Postgres) |
| Hosting | S3 + CloudFront + Route53 + ACM |
| Infraestructura | AWS SAM |
| Tests | `node:test` + `node:assert/strict` |

## Auth

El login de clientes usa el mismo CoreAPI de Vibe Studio (Magic Link).  
`AuthForm.tsx` envía `{ service: 'opita-code', redirectTo: 'https://opitacode.com/projects' }` para obtener el email con branding de Opita Code (indigo `#6366f1`) y el redirect correcto al dashboard.

## Quick Start

```bash
# Frontend v2
cd frontend-v2
npm install
npm run dev       # localhost:4321

# Backend
cd backend
sam build
sam local start-api   # local testing

# Tests
npm test
```

## Deploy

```bash
# Backend
sam build && sam deploy --guided

# Frontend legado → S3 manual
aws s3 sync frontend/ s3://www.opitacode.com/ --delete

# Frontend v2 → integrar al pipeline cuando esté listo para producción
```

---

> © 2026 Opita Code · Juan Nicolás Urrutia Salcedo · Hecho en Colombia 🇨🇴
