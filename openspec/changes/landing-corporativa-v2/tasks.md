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

### T4: CTA components — FIX 13 CTAs rotos
- **Archivos**: `frontend-v2/src/components/ConversionChannels.astro` (nuevo), `frontend-v2/src/components/Hero.astro` (refactor), `frontend-v2/src/components/ContactForm.tsx` (reparado), `frontend-v2/src/components/Footer.astro` (refactor)
- **Cambios**:
  - `ConversionChannels.astro` con WhatsApp primario (botón con icono SVG, `https://wa.me/573126126085?text=Hola%20Nicol%C3%A1s%2C%20me%20interesa%20Opita%20Code`), email, GitHub, LinkedIn, YouTube
  - Hero CTA WhatsApp pre-rellenado
  - `ContactForm.tsx`: agregar `onSubmit` handler que llame a `fetch('/api/contact', ...)` con CSRF
  - Footer con links a GitHub, LinkedIn, YouTube, email, WhatsApp
  - **Productos en desarrollo** (Market, OS, Studio, Barber): badge "EN DESARROLLO" + CTA WhatsApp con mensaje pre-rellenado por producto
- **Success criteria**: 13 CTAs verificados con curl, ContactForm envía al endpoint
- **LOC**: ~200
- **Dependencias**: T2, T3

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

### T9: Habeas Data (Ley 1581/2012)
- **Archivos**: `frontend-v2/src/pages/es/legal/habeas-data.astro` (nuevo), `frontend-v2/src/pages/en/legal/habeas-data.astro` (nuevo), `frontend-v2/src/pages/es/legal/privacidad.astro` (nuevo), `frontend-v2/src/pages/en/legal/privacidad.astro` (nuevo)
- **Cambios**: PTD + Aviso de Privacidad + DPO + SLA 15 días, basado en skill `colombia-habeas-data`
- **Success criteria**: 4 páginas legales con copy válido, links desde footer
- **LOC**: ~200

### T10: Footer + páginas ES/EN completas
- **Archivos**: `frontend-v2/src/components/Footer.astro` (refactor), todas las pages refactorizadas para usar `t(lang)`
- **Cambios**: footer con 6 columnas (Producto, Compañía, Legal, Recursos, Comunidad, Contacto); páginas completas con todas las secciones
- **Success criteria**: footer completo, todas las pages usan i18n helper
- **LOC**: ~250

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

## Total: 12 tasks, ~1,730 LOC, 12 PRs incrementales
