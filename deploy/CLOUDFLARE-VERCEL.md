# Publicacion en Vercel y configuracion de Cloudflare

Estado: 28 de octubre de 2026 · rama `publish/vercel` · proyecto Vercel
`opitacode-web` (equipo `Opita Drops`).

## Que ya quedo hecho

- Rama `publish/vercel` creada en `Opita-Code/www.opitacode.com` y pusheada con
  los dos commits de la landing (`dc462c4`) y del pipeline de pulido (`5a25da0`).
  `main` NO se toco: el pipeline viejo de S3 sigue intacto ahi.
- Proyecto de Vercel `opitacode-web` creado y desplegado en produccion.
- Dominios `opitacode.com` y `www.opitacode.com` agregados al proyecto y ya
  verificados por Vercel (`verified: true`).
- Vercel Authentication desactivada en el proyecto: el sitio es publico.
- `frontend-v2/vercel.json` con el build (`npm run build`), el output (`dist`) y
  las cabeceras de cache y seguridad.

## Lo unico que falta: el DNS en Cloudflare

El DNS del dominio sigue en Cloudflare (NS `mckinley.ns.cloudflare.com` y
`bjorn.ns.cloudflare.com`). **No hay que cambiar los nameservers.** Vercel los
recomienda asi y ya los tenes.

En Cloudflare (dash.cloudflare.com -> opitacode.com -> DNS -> Records):

### 1. Crear el registro de `www`

| Campo | Valor |
|---|---|
| Type | CNAME |
| Name | www |
| Target | `90f17105bfb2b922.vercel-dns-017.com` |
| Proxy status | DNS only (nube gris) |
| TTL | Auto |

El target especifico (`90f17105bfb2b922.vercel-dns-017.com`) es el que Vercel
recomienda con prioridad 1 para este proyecto. El generico
`cname.vercel-dns.com` tambien sirve, pero el especifico enruta mejor.

### 2. Crear el registro del dominio raiz

| Campo | Valor |
|---|---|
| Type | A |
| Name | @ |
| Address | `76.76.21.21` |
| Proxy status | DNS only (nube gris) |
| TTL | Auto |

Alternativas que Vercel tambien acepta para el apex: `216.198.79.1` o
`64.29.17.1` (prioridad 1 en la recomendacion de Vercel). Con proxy naranja
tambien funciona, pero entonces el TLS lo emite Cloudflare y hay que dejar
SSL/TLS en modo Full (strict). Con DNS only, el certificado lo emite y lo
sirve Vercel, que es lo mas simple de verificar.

### 3. Opcional, solo si Vercel vuelve a pedir la verificacion

| Type | Name | Value |
|---|---|---|
| TXT | `_vercel` | `G8D4xzbGtc` |

A la fecha de este documento el dominio ya figura como verificado en Vercel, asi
que este registro no deberia hacer falta. Si Vercel lo pide, se agrega.

### Que hay que borrar antes

Hoy `opitacode.com` no tiene registro A ni CNAME y `www.opitacode.com` no
existe (NXDOMAIN). Si al momento de hacer el cambio hay registros viejos de
CloudFront (A `104.21.9.207` y `172.67.131.7` en `www`), borralos: si coexisten
dos registros con el mismo nombre, Cloudflare usa el de la zona publica y el
sitio sigue sin responder bien.

## Verificar

```bash
bash deploy/verificar-publicacion.sh
```

El script comprueba los registros DNS, el certificado TLS, las rutas del sitio
en los dos idiomas, los archivos legales, el sitemap y que el HTML contenga la
tirada de cifras esperadas.

## Estado del sitio ya publicado

URL de despliegue: `https://opitacode-web.vercel.app`

Medido con el pipeline de pulido sobre el sitio publicado: 8 mediciones
(es/en x dark/light x 1362/390 px), 0 fallos de contraste AA, 0 elementos
invisibles, 0 desbordes horizontales, 1 familia de acento de tono, 0 saltos en
la jerarquia de encabezados.

## Si despues hay que volver a desplegar

```bash
cd frontend-v2
npx vercel deploy --prod --yes
```

La integracion con GitHub (deploy automatico en cada push) se activa con
`npx vercel git connect`, dejando el Root Directory del proyecto en
`frontend-v2`.
