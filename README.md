# www.opitacode.com

Superficie pública de **Opita Code** — página web corporativa en `opitacode.com`.

> **Software práctico para negocios reales.** Construido desde Colombia con identidad local y ambición global.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | HTML + CSS plano (sin build, sin frameworks) |
| **Hosting** | S3 + CloudFront + Route53 + ACM |
| **Formulario** | API Gateway REST + Lambda (Node.js 20.x ESM) + SES |
| **Infraestructura** | SAM (AWS Serverless Application Model) |
| **Tests** | `node:test` + `node:assert/strict` |

## Estructura

```
www.opitacode.com/
├── frontend/                   # Sitio estático
│   ├── index.html              # Página principal
│   ├── 404.html                # Página de error
│   ├── assets/
│   │   ├── css/
│   │   │   ├── css-variables.css   # Tokens de diseño
│   │   │   └── opita-landing.css   # Estilos del landing
│   │   ├── img/                    # SVGs y PNGs de marca
│   │   └── fonts/                  # DM Sans WOFF2
│   ├── legal/
│   │   ├── terminos.html
│   │   ├── privacidad.html
│   │   └── cookies.html
│   ├── sitemap.xml
│   ├── robots.txt
│   └── googlec8c8c8c8c8c8c8c.html
├── backend/                    # Infraestructura serverless (SAM)
│   ├── template.yaml
│   ├── src/
│   │   └── contact-form.mjs    # Lambda: formulario de contacto vía SES
│   └── tests/
│       └── contact-form.test.mjs
├── package.json
└── README.md
```

## Tests

```bash
npm test
```

## Licencia

© 2026 Opita Code · Juan Nicolás Urrutia Salcedo  
Hecho en Colombia.
