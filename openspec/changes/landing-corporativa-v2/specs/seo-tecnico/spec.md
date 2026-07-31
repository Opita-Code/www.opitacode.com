# Spec: SEO técnico base (T1)

## Purpose
Hacer que la landing de Opita Code sea **indexable, deduplicable entre locales y compartible en redes sociales** sin errores. Hoy Google no puede deduplicar `/es` vs `/en` (hreflang rotos por falta de `site:`), no hay JSON-LD Organization (Knowledge Graph vacío), y los OG/Twitter cards no validan.

## Requirements

### REQ-SEO-1: Configurar `site:` y `i18n:` en astro.config.mjs
**Given** un repo Astro 6.3.1 sin `site:` ni `i18n:` configurado
**When** se construye con `npm run build`
**Then** el output tiene URLs absolutas en `hreflang` y en `<link rel="canonical">`
**And** el sitemap generado contiene URLs absolutas con prefijo de locale (`/es/`, `/en/`)

### REQ-SEO-2: Generar `sitemap.xml` automáticamente
**Given** `@astrojs/sitemap` integrado en `astro.config.mjs`
**When** se construye
**Then** existe `dist/sitemap-index.xml` + `dist/sitemap-0.xml`
**And** el sitemap incluye las páginas `/es/`, `/en/`, y las páginas legales (cuando se agreguen en T9)
**And** `hreflang` cross-references están embebidos en cada `<url>` (vía `i18n` config)

### REQ-SEO-3: `<link rel="canonical">` dinámico en cada página
**Given** una página servida con `lang='es'` o `lang='en'`
**When** se renderiza el HTML
**Then** existe `<link rel="canonical" href="https://opitacode.com/{lang}/">` con URL absoluta
**And** el `og:url` meta es idéntico al canonical (no `Astro.url` runtime que puede tener query params)

### REQ-SEO-4: hreflang absolutos
**Given** `site: 'https://opitacode.com'` configurado
**When** se renderiza `<link rel="alternate" hreflang="...">`
**Then** las URLs son absolutas: `https://opitacode.com/es`, `https://opitacode.com/en`, `https://opitacode.com/es` (x-default)
**And** Google Search Console puede validar los pares `hreflang="es"` ↔ `hreflang="en"` ↔ `hreflang="x-default"`

### REQ-SEO-5: JSON-LD Organization + WebSite + ContactPoint por default
**Given** `Layout.astro` recibe la prop `schema` (opcional)
**When** `schema` no se pasa (default)
**Then** el HTML incluye un `<script type="application/ld+json">` con un JSON-LD Organization que contiene:
- `@type: "Organization"`
- `name: "Opita Code"`
- `url: "https://opitacode.com"`
- `logo: "https://opitacode.com/logo-dark.svg"`
- `sameAs`: array con URLs de GitHub, LinkedIn, YouTube
- `contactPoint`: { `@type: "ContactPoint", telephone: "+57-312-612-6085", contactType: "sales", availableLanguage: ["es", "en"] }`
- `address`: { `@type: "PostalAddress", addressCountry: "CO" }`
- `foundingDate: "2022-01-01"` (estimado basado en LinkedIn de "Maxim & Fishing s.a.s.")

**And** un segundo `<script type="application/ld+json">` con WebSite schema para sitelinks search box

### REQ-SEO-6: Meta robots + Twitter Card
**Given** cualquier página renderizada
**When** se inspecciona el `<head>`
**Then** existe `<meta name="robots" content="index, follow, max-image-preview:large">`
**And** existe `<meta name="twitter:card" content="summary_large_image">`
**And** existe `<meta name="twitter:title" content={title}>`, `twitter:description`, `twitter:image` (apuntando a `/og-image.jpg` por ahora, T11 lo reemplaza)
**And** el validator de Twitter (cards-dev.twitter.com) pasa sin errores

### REQ-SEO-7: og:url limpio (canonical)
**Given** una URL con query params (ej. `?utm_source=newsletter`)
**When** se renderiza el HTML
**Then** `og:url` y `canonical` son la URL SIN query params (solo path + locale)
**And** los UTM params no contaminan la URL canónica que Google indexa

## Verification

```bash
# 1. Build exit 0
cd frontend-v2 && npm run build

# 2. Sitemap existe
ls -la dist/sitemap-index.xml dist/sitemap-0.xml

# 3. curl a prod valida
curl -s https://opitacode.com/es/ | grep -E 'canonical|hreflang|og:url|application/ld\+json' | head -20

# 4. Schema.org validator
# https://validator.schema.org/#url=https://opitacode.com/es/

# 5. Google Rich Results Test
# https://search.google.com/test/rich-results?url=https://opitacode.com/es/
```

## Out of Scope (este spec)

- OG image real (T11)
- hreflang x-default regional (ej. `es-CO`) — el operador solo necesita `es`/`en`
- Schema.org `Product` por producto (T6 cuando se rendericen ProductCards)
- Schema.org `BreadcrumbList` (cuando haya navegación jerárquica en T10)
