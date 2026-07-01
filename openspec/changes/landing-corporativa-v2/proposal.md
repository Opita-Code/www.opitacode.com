# Change: landing-corporativa-v2

## Why

La landing de Opita Code (`https://opitacode.com/es/`) es el activo público #1 de la marca y la única superficie que un visitante nuevo ve. Hoy tiene **3 problemas bloqueantes para conversión y SEO**:

1. **13 CTAs rotos o ausentes** — no hay WhatsApp, no hay email clickable, no hay link a GitHub/LinkedIn/YouTube; el ContactForm React no tiene endpoint visible (no `action=`, no `fetch`, no `onsubmit=`).
2. **SEO técnico roto** — `Layout.astro` no tiene `<link rel="canonical">`, no tiene meta robots, no tiene Twitter Card, no tiene JSON-LD Organization; `astro.config.mjs` no define `site:`, así que `Astro.site` es `undefined` y los `hreflang` salen como `/es` y `/en` (sin dominio) — **Google no puede deduplicar contenido entre locales**.
3. **`www.opitacode.com` no responde** (sin DNS record) y `market.opitacode.com` no existe en DNS — los productos en desarrollo (Market, OS, Studio, Barber) no tienen subdominio público.

Adicional: la estrategia de marca está subexplotada. El operador (Juan Nicolás Urrutia Salcedo, "el Opita") tiene 21 repos en GitHub, 4 verticales de producto, decisiones v1+v2 fundacionales (WhatsApp canal #1, B/N lock, orgullo opita, Macondo reference) que **no se honran en la landing actual**.

## What Changes

12 PRs incrementales (~1,180 LOC total) que rediseñan la landing como **arquitecto + piscólogo de ventas + estratega de marca**, sin migrar stack (sigue Astro 6.3.1 + React 19 + Tailwind 4 + S3/CloudFront), sin reintroducir Supabase/Magic Link, sin auth, sin DB en landing.

**Productos en desarrollo** (Market, OS, Studio, Barber) → badge "EN DESARROLLO" + CTA WhatsApp con mensaje pre-rellenado por producto (captura leads calificados).

**WhatsApp es el CTA #1** (`https://wa.me/573126126085`) — canal principal de conversión LATAM, decisión v1 #9.

**ContactForm reparado como secundario** — el backend Lambda `opita-landing-contact-form` ya existe (verificado en `backend/src/contact-form.mjs`, commit `77378a2`); solo falta wire el frontend.

**`www.opitacode.com` redirect** → Cloudflare Page Rule 301 → `opitacode.com/*` (trivial, 0 LOC en repo).

**6 specs Given/When/Then** que documentan el comportamiento esperado y sirven como contrato de aceptación.

## Impact

- **Brand**: alineación con decisiones v1+v2 (orgullo opita, Macondo, B/N lock, WhatsApp #1)
- **SEO**: hreflang correctos, canonical, JSON-LD Organization, sitemap.xml, og:image real
- **Conversion**: 13 CTAs útiles en lugar de 13 CTAs rotos → captura de leads
- **Compliance**: Habeas Data Ley 1581/2012 (PTD + Aviso + DPO + SLA 15 días)
- **Performance**: Lighthouse ≥90 mobile + ≥95 desktop (objetivo, no contractual)
- **i18n**: soporte ES/EN con un solo i18n helper + data files compartidos

## Out of Scope

- ❌ Crear `market.opitacode.com` en DNS (el operador NO lo hace en este change)
- ❌ Migrar S3+CloudFront → Cloudflare Pages
- ❌ Reintroducir Supabase, Magic Link, auth en landing
- ❌ Reemplazar maria-trabajos o migrar assets de Sociedad Opita a cloud
- ❌ Traducir a otros idiomas (solo ES/EN)
- ❌ Crear `Opita OS / Studio / Barber` como productos públicos (siguen internos)

## Success Criteria

- [ ] Lighthouse mobile ≥ 90 (performance + SEO + a11y)
- [ ] Schema.org Validator: 0 errores en JSON-LD Organization
- [ ] Google Search Console: hreflang correctos en sitemap
- [ ] WhatsApp CTA: pre-rellenado con producto + contexto
- [ ] ContactForm: envía a Lambda `opita-landing-contact-form` (200 OK en success)
- [ ] Habeas Data page: PTD + Aviso + DPO visibles (Ley 1581/2012)
- [ ] `www.opitacode.com/*` → 301 `opitacode.com/*` (Cloudflare)
- [ ] Cero referencias a Supabase, Magic Link, dashboards auth en landing
- [ ] OG image real 1200x630 PNG pre-generado
