# Tasks: landing-corporativa-v2

Cada task es un PR mergeable individualmente. Sigue el patrón `apply.enabled: true` del `openspec/config.yaml`: commits de 80-150 LOC, return envelope early.

## Fase 1 — Quick wins técnicos

### T1: SEO técnico base
- **Archivos**: `frontend-v2/astro.config.mjs`, `frontend-v2/package.json`, `frontend-v2/src/layouts/Layout.astro`
- **Cambios**:
  - `astro.config.mjs`: `site: 'https://opitacode.com'`, `trailingSlash: 'never'`, `i18n: { defaultLocale: 'es', locales: ['es','en'], routing: { prefixDefaultLocale: true } }`, `sitemap()` integration
  - `package.json`: agregar `@astrojs/sitemap@^3.2.1`
  - `Layout.astro`:
    - `<link rel="canonical" href={canonicalUrl}>`
    - `<meta name="robots" content="index, follow, max-image-preview:large">`
    - `<meta name="twitter:card" content="summary_large_image">` + twitter:title/description/image
    - Default JSON-LD Organization cuando `schema` no se pasa (Organization + WebSite + ContactPoint)
    - Fix `og:url` con `new URL(Astro.url.pathname, Astro.site).href`
    - Fix `hreflang` con URLs absolutas (ya casi funciona, solo necesita `site:`)
- **Success criteria**: `npm run build` exit 0; `dist/sitemap-index.xml` generado; `curl https://opitacode.com/es/` muestra canonical, og:url absoluto, JSON-LD Organization, twitter:card
- **LOC**: ~80 (config + Layout)
- **Dependencias**: ninguna

### T2: Data files compartidos
- **Archivos**: `frontend-v2/src/data/products.json`, `frontend-v2/src/data/ecosystem-stats.json`, `frontend-v2/src/data/manifesto.json` (nuevos)
- **Cambios**:
  - `products.json`: 6 productos (Sociedad Opita ✅, Opita Market 🟡, Opita Trabajos ✅, Opita Developer ✅, Opita OS 🟡, Opita Studio 🟡, Opita Barber 🟡, DarkAgents ✅) — campos: id, name, slug, status, tagline_es, tagline_en, description_es, description_en, cta_url, cta_label, badge, color
  - `ecosystem-stats.json`: 8 stats (21 repos, 4 verticales, 200+ commits, 100% open source, etc.)
  - `manifesto.json`: copy del Manifiesto Opita (orgullo opita, Macondo, decisiones v1+v2) en ES/EN
- **Success criteria**: JSON válidos, sin inline hardcodeado en pages/index.astro
- **LOC**: ~200
- **Dependencias**: T1

## Fase 2 — Infraestructura i18n + CTAs rotos

### T3: i18n foundation
- **Archivos**: `frontend-v2/src/i18n/es.json`, `frontend-v2/src/i18n/en.json`, `frontend-v2/src/i18n/index.ts` (nuevo helper)
- **Cambios**:
  - `i18n/index.ts`: helper `t(lang, key, vars?)` que carga el JSON y hace string interpolation
  - `es.json` + `en.json`: claves para `nav.ecosystem`, `hero.title`, `hero.subtitle`, `cta.whatsapp.message`, `footer.copyright`, `products.{id}.tagline`, etc.
  - Refactor `Layout.astro` para usar `t(lang, ...)` en lugar de ternarios `lang === 'es' ? ... : ...`
- **Success criteria**: ternarios `lang === 'es' ? ... : ...` eliminados de `Layout.astro`; `t()` funciona en al menos 1 página
- **LOC**: ~150
- **Dependencias**: T2

### T4a: ConversionChannels component (canales de conversión)
- **Archivos**: `frontend-v2/src/components/ConversionChannels.astro` (nuevo)
- **Cambios**:
  - Componente que renderiza 5 canales: WhatsApp (primario con icono SVG), email, GitHub, LinkedIn, YouTube
  - WhatsApp URL: `https://wa.me/573126126085?text=Hola%20Nicol%C3%A1s%2C%20me%20interesa%20Opita%20Code`
  - Reusar en Hero (T4c) y en Conversemos section
  - Props: `{ lang, source_section }` para tracking de telemetría
- **Success criteria**: Componente renderiza 5 canales con aria-labels correctos; `wa.me` link verificado
- **LOC**: ~80
- **Dependencias**: T2

### T4b: ContactForm onSubmit handler
- **Archivos**: `frontend-v2/src/components/ContactForm.tsx` (modificado, +30 LOC)
- **Cambios**:
  - Agregar `onSubmit` handler que llame `fetch('/api/contact', { method: 'POST', body: ... })`
  - CSRF token (reusar patrón de `apps/market-web/src/pages/api/legal/dpo-contact.ts`)
  - Estados: idle → submitting → success / error
  - Mensaje de éxito: "Recibimos tu mensaje. Te contactamos en menos de 24h"
  - Reusar Lambda `opita-landing-contact-form` que ya existe en AWS (verificado commit `77378a2`)
- **Success criteria**: `curl -X POST https://opitacode.com/api/contact -d '...'` → 200; el form muestra success en UI
- **LOC**: ~50
- **Dependencias**: T2

### T4c: Hero CTA + Footer links + "EN DESARROLLO" badges
- **Archivos**: `frontend-v2/src/components/Hero.astro` (modificado), `frontend-v2/src/components/Footer.astro` (modificado), `frontend-v2/src/pages/es/index.astro` (modificado), `frontend-v2/src/pages/en/index.astro` (modificado)
- **Cambios**:
  - Hero CTA WhatsApp pre-rellenado (reusa ConversionChannels de T4a)
  - Footer links: GitHub, LinkedIn, YouTube, email, WhatsApp
  - **Productos en desarrollo** (Market, OS, Studio, Barber): badge "EN DESARROLLO" + CTA WhatsApp con mensaje pre-rellenado por producto
  - Wire up telemetry: `source_section` en cada CTA
- **Success criteria**: 13 CTAs verificados con curl; 4 productos en desarrollo con badge + WhatsApp
- **LOC**: ~70
- **Dependencias**: T4a, T4b

## Fase 3 — Contenido de marca

### T5: Refactorizar Hero (CONCEPTOS > CÓDIGO)
- **Archivos**: `frontend-v2/src/components/Hero.astro` (refactor mayor), `frontend-v2/src/pages/es/index.astro` (modificado), `frontend-v2/src/pages/en/index.astro` (modificado)
- **Cambios**: copy "CONCEPTOS > CÓDIGO", CTA WhatsApp, foto del founder, social proof (21 repos / 100% open source)
- **Success criteria**: Hero < 4KB inline, Lighthouse mobile ≥ 90
- **LOC**: ~150

### T6: Ecosystem + ProductCard
- **Archivos**: `frontend-v2/src/components/Ecosystem.astro` (nuevo), `frontend-v2/src/components/ProductCard.astro` (nuevo), pages modificados
- **Cambios**: 6 productos renderizados desde `products.json` con ProductCard (badge, tagline, CTA)
- **Success criteria**: 6 productos visibles, 4 con link directo, 4 con badge "EN DESARROLLO" + WhatsApp
- **LOC**: ~180

### T7: Manifiesto Opita
- **Archivos**: `frontend-v2/src/components/Manifiesto.astro` (nuevo), `frontend-v2/src/data/manifesto.json` (escrito en T2)
- **Cambios**: orgullo opita, Macondo, decisiones v1+v2 (WhatsApp, B/N lock, Open Source), copy en ES/EN
- **Success criteria**: Manifiesto visible en /es/ y /en/, copy validado
- **LOC**: ~120

### T8: Seriedad (pentest + compliance)
- **Archivos**: `frontend-v2/src/components/Seriedad.astro` (nuevo)
- **Cambios**: pentest 87 score, compliance Ley 1581/2012, código abierto, Colombia 🇨🇴
- **Success criteria**: 4 cards visibles con data real
- **LOC**: ~120

## Fase 4 — Compliance + cierre

### T9a: Habeas Data ES (Ley 1581/2012)
- **Archivos**: `frontend-v2/src/pages/es/legal/habeas-data.astro` (nuevo)
- **Cambios**: PTD (Política de Tratamiento de Datos) + DPO + SLA 15 días, basado en skill `colombia-habeas-data`
- **Success criteria**: Página legal con copy válido, links desde footer ES
- **LOC**: ~80

### T9b: Habeas Data EN
- **Archivos**: `frontend-v2/src/pages/en/legal/habeas-data.astro` (nuevo)
- **Cambios**: Traducción de T9a al inglés (declaración de compliance bilingüe)
- **Success criteria**: Página legal con copy válido, links desde footer EN
- **LOC**: ~80
- **Dependencias**: T9a

### T9c: Privacidad ES
- **Archivos**: `frontend-v2/src/pages/es/legal/privacidad.astro` (nuevo)
- **Cambios**: Aviso de Privacidad (Privacy Notice) según Ley 1581/2012 + Decreto 1377/2013
- **Success criteria**: Página legal con copy válido
- **LOC**: ~60
- **Dependencias**: T9a

### T9d: Privacidad EN
- **Archivos**: `frontend-v2/src/pages/en/legal/privacidad.astro` (nuevo)
- **Cambios**: Traducción de T9c
- **Success criteria**: Página legal con copy válido
- **LOC**: ~60
- **Dependencias**: T9c

### T10a: Footer refactor (6 columnas)
- **Archivos**: `frontend-v2/src/components/Footer.astro` (refactor mayor, +180 LOC)
- **Cambios**: 6 columnas (Producto, Compañía, Legal, Recursos, Comunidad, Contacto), cada una con 4-6 links. Links usan `t(lang)` para texto bilingüe
- **Success criteria**: footer con todas las columnas, links funcionales, `lang` switcher visible
- **LOC**: ~180
- **Dependencias**: T3

### T10b: ES pages refactor (t() helper)
- **Archivos**: `frontend-v2/src/pages/es/index.astro` (refactor, -200/+200 LOC netas), `frontend-v2/src/pages/es/projects/index.astro` (refactor)
- **Cambios**: Reemplazar ternarios `lang === 'es' ? ... : ...` con `t(lang, 'key')`; usar `data/products.json` y `data/manifesto.json` en lugar de hardcode
- **Success criteria**: Cero ternarios `lang === 'es' ? ... : ...` en pages ES; `t()` funciona para al menos 20 keys
- **LOC**: ~200
- **Dependencias**: T3, T10a

### T10c: EN pages refactor (t() helper)
- **Archivos**: `frontend-v2/src/pages/en/index.astro` (refactor), `frontend-v2/src/pages/en/projects/index.astro` (refactor)
- **Cambios**: Idem T10b pero para /en/
- **Success criteria**: Idem T10b
- **LOC**: ~200
- **Dependencias**: T3, T10b

### T11: OG image pre-generado
- **Archivos**: `frontend-v2/public/og-es.png`, `frontend-v2/public/og-en.png` (nuevos, 1200x630 PNG)
- **Cambios**: generar OG image con logo + tagline usando ImageMagick o `sharp`
- **Success criteria**: og:image URL absoluta, validators pasan
- **LOC**: ~30 (script + assets)

### T12: www redirect + Lighthouse audit
- **Archivos**: `openspec/CHANGELOG.md` (entrada), `frontend-v2/.lighthouse/` (config), `docs/infrastructure/www-redirect.md` (nuevo)
- **Cambios**:
  - Cloudflare Page Rule `www.opitacode.com/*` → 301 `opitacode.com/$1` (manual en dashboard)
  - Lighthouse CI config + audit baseline
  - Documentar en `docs/infrastructure/`
- **Success criteria**: `curl -I https://www.opitacode.com` → 301 → `https://opitacode.com/$1`; Lighthouse mobile ≥ 90
- **LOC**: ~50

## Total: 17 tasks, ~1,900 LOC, 17 PRs incrementales

### Changelog de splits (post-audit 2026-07-01)
- T4 (200 LOC) → T4a + T4b + T4c (80 + 50 + 70 = 200 LOC, 3 PRs)
- T9 (200 LOC, 4 archivos) → T9a + T9b + T9c + T9d (80 + 80 + 60 + 60 = 280 LOC, 4 PRs)
- T10 (250 LOC) → T10a + T10b + T10c (180 + 200 + 200 = 580 LOC, 3 PRs)
- Beneficio: PRs <200 LOC, review más rápido, rollback granular, dependencia lineal clara
- Costo: 5 PRs adicionales (12 → 17), pero más seguros
