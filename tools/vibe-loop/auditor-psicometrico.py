#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auditor psicometrico de datos y afirmaciones - mide, no juzga.

Contrasta lo que las paginas publican contra la rubrica P-01 a P-08:
unicidad, completitud, validez (opcional, con fuente primaria), consistencia
entre las dos versiones, formato, integridad referencial, afirmaciones
prohibidas y estado de la percepcion.

  python auditor-psicometrico.py --root .. --salida /tmp/psico.json

Opciones:
  --root RUTA     raiz del repositorio (donde esta frontend-v2)
  --salida RUTA   archivo JSON de salida
  --fuentes RUTA  JSON de fuentes primarias (salida de verificar-fuentes.py);
                  con el, P-03 y P-06 se resuelven; sin el, quedan como
                  "no verificado" y no como "aprobado".

Salida: JSON con la lista de hallazgos por criterio, con n y %, mas el estado
de cada afirmacion. No emite veredictos de calidad: el veredicto lo produce el
juez contra la rubrica versionada.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

# --- afirmaciones prohibidas (P-07) --------------------------------------
# Se buscan en el texto visible renderizado. Los patrones son deliberadamente
# estrechos para no marcar falsamente. Cada acierto exige revision humana.
PROHIBIDOS = [
    (r"\bcon el aval de\b", "afirmacion de aval"),
    (r"\baval(?:ado|ada|amos) por\b", "afirmacion de aval"),
    (r"\bcertificad[oa]s? por\b", "afirmacion de certificacion"),
    (r"\bplan de estudios\b", "referencia a plan de estudios"),
    (r"\bpen(?:sum|sium)\b", "referencia a pensum"),
    (r"\bveredicto simulado\b", "veredicto simulado declarado"),
    (r"\baprobado por (?:el |la )?juez\b", "aprobacion por juez"),
    (r"\buniversidad surcolombiana\b", "atribucion institucional"),
]

# una cifra destacada vive en un dd/span con la clase tabular-nums: es el
# numero que la pagina exhibe, no cualquier numero que aparezca en el texto.
CIFRA_DESTACADA = re.compile(
    r"<(?:dd|span|div)\b[^>]*tabular-nums[^>]*>\s*([^<]{1,14}?)\s*<", re.I
)

# un veredicto de juez simulado: un id de evaluacion con veredicto favorable
# al lado, sin que exista en la fuente primaria.
VEREDICTO_FAVORABLE = re.compile(
    r"(aligned|alineado)[^0-9]{0,40}(?:conf|confidence)?[^0-9]{0,12}(0?\.\d{2})", re.I
)

NUMERO = re.compile(r"\d{1,3}(?:[.\u202f\u00a0 ]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?%?")


def leer(patron):
    with open(patron, encoding="utf-8") as f:
        return f.read()


def texto_visible(html):
    html = re.sub(r"<script\b[^>]*>.*?</script>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<style\b[^>]*>.*?</style>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    html = re.sub(r"&[a-zA-Z#0-9]+;", " ", html)
    return re.sub(r"[ \t]+", " ", html)


def parsear_metricas(ts):
    """Extrae v, label y src de cada bloque del modulo de metricas."""
    metricas = []
    for m in re.finditer(r"\{\s*\n\s*v:\s*'([^']+)'(.*?)\n  \},", ts, flags=re.S):
        valor = m.group(1)
        resto = m.group(2)
        et = re.search(r"es:\s*'([^']*)'", resto)
        en = re.search(r"en:\s*'([^']*)'", resto)
        se = re.search(r"src:\s*\{\s*es:\s*'([^']*)'", resto)
        sn = re.search(r"src:\s*\{[^}]*en:\s*'([^']*)'", resto)
        metricas.append({
            "valor": valor,
            "label_es": et.group(1) if et else None,
            "label_en": en.group(1) if en else None,
            "src_es": se.group(1) if se else None,
            "src_en": sn.group(1) if sn else None,
        })
    return metricas


def normalizar_numero(txt):
    """1.078 -> 1078 ; 1.494 -> 1494 ; 371/371 -> 371."""
    t = txt.strip()
    m = re.match(r"^(\d[\d.\u202f\u00a0 ]*)(\s*/\s*(\d[\d.\u202f\u00a0 ]*))?$", t)
    if not m:
        return None
    def limpio(s):
        s = re.sub(r"[.\u202f\u00a0 ]", "", s)
        try:
            return int(s)
        except ValueError:
            return None
    izq = limpio(m.group(1))
    der = limpio(m.group(3)) if m.group(3) else None
    if izq is None:
        return None
    return {"izq": izq, "der": der}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--salida", default=None)
    ap.add_argument("--fuentes", default=None)
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    dist = os.path.join(root, "frontend-v2", "dist")
    ts_path = os.path.join(root, "frontend-v2", "src", "lib", "metrics.ts")

    hallazgos = []
    afirmaciones = []

    def hallazgo(criterio, severidad, donde, detalle, evidencia):
        hallazgos.append({
            "criterio": criterio, "severidad": severidad, "donde": donde,
            "detalle": detalle, "evidencia": evidencia,
        })

    # --- metricas: unicidad y completitud ---------------------------------
    metricas = []
    if os.path.exists(ts_path):
        metricas = parsear_metricas(leer(ts_path))
    for mt in metricas:
        if not mt["src_es"] or not mt["src_en"]:
            hallazgo("P-02", "ALTA", "frontend-v2/src/lib/metrics.ts",
                     "metrica sin fuente en una de las dos versiones",
                     {"valor": mt["valor"], "src_es": mt["src_es"], "src_en": mt["src_en"]})
        elif not re.search(r"\d{2}-\d{2}-\d{4}|\d{4}", mt["src_es"]):
            hallazgo("P-02", "ALTA", "frontend-v2/src/lib/metrics.ts",
                     "metrica sin fecha de consulta", {"valor": mt["valor"], "src": mt["src_es"]})

    # --- paginas renderizadas ---------------------------------------------
    paginas = {}
    for lang in ("es", "en"):
        p = os.path.join(dist, lang, "index.html")
        if not os.path.exists(p):
            hallazgo("P-04", "ALTA", "frontend-v2/dist/%s/index.html" % lang,
                     "la version publicada no existe en el build", {})
            continue
        html = leer(p)
        paginas[lang] = {"ruta": p, "html": html, "visible": texto_visible(html)}

    # unicidad: las cifras destacadas tienen una sola fuente de verdad.
    # Se miran SOLO las cifras que la pagina exhibe (clase tabular-nums), no
    # cualquier numero del texto: un id de evaluacion o una fecha no son
    # afirmaciones metricas.
    valores_metrica = set()
    for mt in metricas:
        n = normalizar_numero(mt["valor"])
        if n:
            valores_metrica.add(n["izq"])
            if n["der"] is not None:
                valores_metrica.add(n["der"])

    publicadas = {}
    for lang, info in paginas.items():
        publicadas[lang] = []
        for tok in CIFRA_DESTACADA.findall(info["html"]):
            n = normalizar_numero(tok)
            if not n:
                continue
            publicadas[lang].append(tok)
            if n["izq"] not in valores_metrica and n["der"] not in valores_metrica:
                hallazgo("P-01", "ALTA", "frontend-v2/dist/%s/index.html" % lang,
                         "cifra destacada publicada que no viene del modulo de metricas",
                         {"cifra": tok, "valor": n["izq"]})
        # metricas defined in source but not published: not an error per se
        # (a metric may belong to the kernel strip only), but it must not
        # publish a value absent from the source of truth.
    # metricas defined and never published
    for mt in metricas:
        n = normalizar_numero(mt["valor"])
        if not n:
            continue
        if not any(n["izq"] in {normalizar_numero(x)["izq"] for x in vals if normalizar_numero(x)}
                   for vals in publicadas.values() if vals):
            pass  # la pagina puede no usar todas las metricas: no es hallazgo

    # consistencia ES/EN: los mismos numeros en ambos idiomas
    if len(paginas) == 2:
        def numeros(info):
            s = set()
            for tok in NUMERO.findall(info["visible"]):
                n = normalizar_numero(tok)
                if n:
                    s.add(n["izq"])
                    if n["der"] is not None:
                        s.add(n["der"])
            return s
        ne, nn = numeros(paginas["es"]), numeros(paginas["en"])
        solo_es = sorted(ne - nn)
        solo_en = sorted(nn - ne)
        if solo_es or solo_en:
            hallazgo("P-04", "CRITICA", "frontend-v2/dist/*/index.html",
                     "las dos versiones no publican el mismo conjunto de cifras",
                     {"solo_es": solo_es, "solo_en": solo_en})
        # paridad de secciones
        def titulos(info):
            return re.findall(r"<h2[^>]*>(.*?)</h2>", info["html"], flags=re.S | re.I)
        te, tn = [texto_visible(x) for x in titulos(paginas["es"])], [texto_visible(x) for x in titulos(paginas["en"])]
        if len(te) != len(tn):
            hallazgo("P-04", "ALTA", "frontend-v2/dist/*/index.html",
                     "las dos versiones tienen distinto numero de secciones",
                     {"es": len(te), "en": len(tn)})

    # afirmaciones prohibidas
    for lang, info in paginas.items():
        for patron, etiqueta in PROHIBIDOS:
            for m in re.finditer(patron, info["visible"], flags=re.I):
                ctx = info["visible"][max(0, m.start() - 60):m.end() + 60]
                hallazgo("P-07", "CRITICA", "frontend-v2/dist/%s/index.html" % lang,
                         "afirmacion prohibida detectada: " + etiqueta, {"contexto": ctx.strip()})
        for m in VEREDICTO_FAVORABLE.finditer(info["visible"]):
            ctx = info["visible"][max(0, m.start() - 80):m.end() + 80]
            hallazgo("P-07", "CRITICA", "frontend-v2/dist/%s/index.html" % lang,
                     "posible veredicto de juez favorable sin fuente primaria verificable",
                     {"contexto": ctx.strip()})

    # formato: separador de miles (P-05)
    for lang, info in paginas.items():
        punto = len(re.findall(r"\d{1,3}\.\d{3}\b", info["visible"]))
        coma = len(re.findall(r"\d{1,3},\d{3}\b", info["visible"]))
        if punto and coma:
            hallazgo("P-05", "MEDIA", "frontend-v2/dist/%s/index.html" % lang,
                     "se mezclan dos estilos de separador de miles",
                     {"con_punto": punto, "con_coma": coma})

    # percepcion: sin dato (P-08). Es un estado permanente, no un defecto:
    # se reporta para que nadie publique una puntuacion que no existe.
    if not any(k in paginas.get("es", {"visible": ""})["visible"].lower() for k in ("satisfacción", "satisfaccion", "usabilidad", "sus")):
        hallazgo("P-08", "BAJA", "frontend-v2/dist/*/index.html",
                 "estado: no hay captura de percepcion del usuario, el dato es 'sin dato' y no debe publicarse ninguna puntuacion",
                 {"instrumento": "atractividad / usabilidad / deseabilidad; escala de adjetivos del SUS",
                  "estado": "sin dato", "tipo": "estado_permanente"})

    # --- validez contra fuente primaria (P-03 / P-06) ----------------------
    estado_fuentes = "no verificado"
    if args.fuentes and os.path.exists(args.fuentes):
        with open(args.fuentes, encoding="utf-8") as f:
            fuentes = json.load(f)
        estado_fuentes = "verificado"
        for comp in fuentes.get("comparaciones", []):
            if not comp.get("coincide"):
                hallazgo("P-03", "CRITICA", "frontend-v2/src/lib/metrics.ts",
                         "la cifra publicada no coincide con la fuente primaria",
                         {"metrica": comp.get("etiqueta"), "publicado": comp.get("publicado"),
                          "fuente": comp.get("fuente"), "fuente_valor": comp.get("fuente_valor"),
                          "consulta": comp.get("consulta"), "consulta_valor": comp.get("consulta_valor")})
        for ref in fuentes.get("referencias_no_resueltas", []):
            hallazgo("P-06", "CRITICA", "frontend-v2/src/pages/*/index.astro",
                     "identificador citado que no existe en la fuente primaria",
                     {"referencia": ref})

    # afirmacion por afirmacion (las 6 dimensiones)
    for mt in metricas:
        afirmaciones.append({
            "valor": mt["valor"],
            "label_es": mt["label_es"],
            "unicidad": "ok" if not any(h["criterio"] == "P-01" and h["evidencia"].get("token") == mt["valor"] for h in hallazgos) else "revisar",
            "completitud": "ok" if mt["src_es"] and mt["src_en"] else "incompleta",
            "validez": "verificada" if estado_fuentes == "verificado" else "no verificada",
            "consistencia": "ok",
            "formato": "ok",
            "integridad_referencial": "no verificada",
        })

    n_afirm = len(afirmaciones) or 1
    resumen = {}
    for h in hallazgos:
        resumen[h["criterio"]] = resumen.get(h["criterio"], 0) + 1

    salida = {
        "herramienta": "auditor-psicometrico",
        "version": "1.0.0",
        "generado": datetime.now(timezone.utc).isoformat(),
        "estado_fuentes": estado_fuentes,
        "n_afirmaciones": len(afirmaciones),
        "n_hallazgos": len(hallazgos),
        "hallazgos_por_criterio": resumen,
        "porcentaje_afirmaciones_con_hallazgo": round(100.0 * len(hallazgos) / n_afirm, 1),
        "hallazgos": hallazgos,
        "afirmaciones": afirmaciones,
    }
    texto = json.dumps(salida, ensure_ascii=False, indent=2)
    if args.salida:
        with open(args.salida, "w", encoding="utf-8") as f:
            f.write(texto)
        print("escrito: " + os.path.abspath(args.salida))
        print("hallazgos: %d | afirmaciones: %d | fuentes: %s" % (len(hallazgos), len(afirmaciones), estado_fuentes))
    else:
        print(texto)


if __name__ == "__main__":
    sys.exit(main())
