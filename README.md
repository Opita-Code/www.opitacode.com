# www.opitacode.com

> 🇨🇴 Superficie pública de **Opita Code** — página web corporativa en `opitacode.com`.
>
> 🇺🇸 Public surface of **Opita Code** — corporate website at `opitacode.com`.

**Software práctico para negocios reales.** Construido desde Colombia con identidad local y ambición global.
*Practical software for real businesses. Built from Colombia with local identity and global ambition.*

---

## 🇨🇴 Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | HTML + CSS plano (sin build, sin frameworks) |
| **Hosting** | S3 + CloudFront + Route53 + ACM |
| **Formulario** | API Gateway REST + Lambda (Node.js 20.x ESM) + SES |
| **Infraestructura** | SAM (AWS Serverless Application Model) |
| **Tests** | `node:test` + `node:assert/strict` |

## 🇺🇸 Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Plain HTML + CSS (no build, no frameworks) |
| **Hosting** | S3 + CloudFront + Route53 + ACM |
| **Contact form** | API Gateway REST + Lambda (Node.js 20.x ESM) + SES |
| **Infrastructure** | SAM (AWS Serverless Application Model) |
| **Tests** | `node:test` + `node:assert/strict` |

---

## 🇨🇴 Estructura / 🇺🇸 Structure

```
www.opitacode.com/
├── frontend/                   # Sitio estático · Static site
│   ├── index.html              # Página principal · Home page
│   ├── 404.html                # Página de error · Error page
│   ├── assets/
│   │   ├── css/
│   │   │   ├── css-variables.css   # Tokens de diseño · Design tokens
│   │   │   └── opita-landing.css   # Estilos del landing · Landing styles
│   │   ├── img/                    # SVGs y PNGs de marca · Brand assets
│   │   └── fonts/                  # DM Sans WOFF2
│   ├── legal/
│   │   ├── terminos.html       # Términos y condiciones
│   │   ├── privacidad.html     # Política de privacidad
│   │   └── cookies.html        # Política de cookies
│   ├── sitemap.xml
│   └── robots.txt
├── backend/                    # Infraestructura serverless (SAM)
│   ├── template.yaml
│   ├── src/
│   │   └── contact-form.mjs    # Lambda: formulario de contacto vía SES
│   └── tests/
│       └── contact-form.test.mjs
├── package.json
└── README.md
```

---

## 🚀 Deploy

```bash
# Build
sam build

# Deploy
sam deploy --guided
```

## 🧪 Tests

```bash
npm test
```

---

## 📄 Licencia / License

© 2026 Opita Code · Juan Nicolás Urrutia Salcedo
Hecho en Colombia 🇨🇴 · Made in Colombia
