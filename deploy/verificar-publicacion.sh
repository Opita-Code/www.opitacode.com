#!/usr/bin/env bash
# Verificacion de la publicacion: DNS, TLS, rutas y contenido.
# No cambia nada. Solo informa. Sale con codigo 1 si algo falla.
#
#   bash deploy/verificar-publicacion.sh [URL]
#
# Con argumento, verifica esa URL (por defecto, el alias estable de Vercel).
set -uo pipefail

URL="${1:-https://opitacode-web.vercel.app}"
DOMAIN="opitacode.com"
WWW="www.opitacode.com"
FALLOS=0

ok()   { printf "  \033[32mOK\033[0m   %s\n" "$1"; }
fail() { printf "  \033[31mFALLA\033[0m %s\n" "$1"; FALLOS=$((FALLOS+1)); }
aviso(){ printf "  \033[33mAVISO\033[0m %s\n" "$1"; }

echo "== 1. Resolucion DNS =="
for h in "$DOMAIN" "$WWW"; do
  ips=$(getent hosts "$h" 2>/dev/null | awk '{print $1}' | tr '\n' ' ')
  if [ -n "$ips" ]; then ok "$h -> $ips"; else aviso "$h no resuelve todavia"; fi
done

echo
echo "== 2. Certificado TLS =="
for h in "$DOMAIN" "$WWW"; do
  if command -v openssl >/dev/null 2>&1; then
    cert=$(echo | timeout 15 openssl s_client -connect "$h:443" -servername "$h" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
    if [ -n "$cert" ]; then ok "$h -> $(echo "$cert" | tr '\n' ' ')"; else aviso "$h sin certificado (puede ser que falte el DNS)"; fi
  fi
done

echo
echo "== 3. Rutas del sitio en $URL =="
for ruta in "/es/" "/en/" "/" "/legal/privacidad.html" "/legal/cookies.html" "/legal/terminos.html" "/sitemap.xml" "/robots.txt" "/feed.xml"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$URL$ruta")
  if [ "$code" = "200" ]; then ok "$ruta -> 200"; else fail "$ruta -> $code"; fi
done

echo
echo "== 4. Contenido =="
html=$(curl -s --max-time 30 "$URL/es/")
if echo "$html" | grep -q "Runtime de memoria y governance"; then ok "el titular es el esperado"; else fail "el titular no aparece"; fi
if echo "$html" | grep -q "15.000"; then ok "la cifra de escrituras auditadas es 15.000"; else fail "la cifra de escrituras auditadas no es 15.000"; fi
if echo "$html" | grep -q "1.494"; then fail "queda la cifra vieja (1.494)"; else ok "no queda la cifra vieja (1.494)"; fi
css=$(echo "$html" | grep -oE '/_astro/[^"]*\.css' | head -1)
if [ -n "$css" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$URL$css")
  if [ "$code" = "200" ]; then ok "el CSS se sirve ($css)"; else fail "el CSS no carga ($code)"; fi
else
  fail "no se encontro la referencia al CSS"
fi
if echo "$html" | grep -q 'rel="canonical" href="https://www.opitacode.com/es/"'; then ok "el canonical apunta al dominio final"; else aviso "el canonical no apunta a https://www.opitacode.com/es/"; fi

echo
echo "== 5. Dominio publico (si ya configuraste Cloudflare) =="
for h in "$DOMAIN" "$WWW"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "https://$h/es/" || echo 000)
  if [ "$code" = "200" ]; then ok "https://$h/es/ -> 200"; else aviso "https://$h/es/ -> $code (falta el DNS o el certificado)"; fi
done

echo
if [ "$FALLOS" -eq 0 ]; then
  echo "RESULTADO: sin fallos duros."
else
  echo "RESULTADO: $FALLOS fallo(s) duro(s)."
fi
exit "$FALLOS"
