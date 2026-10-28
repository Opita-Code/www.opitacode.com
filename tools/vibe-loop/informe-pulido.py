#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Consolida las dos auditorias en el informe del ciclo de pulido.

  python informe-pulido.py --estetico /tmp/est.json --psicometrico /tmp/psico.json \
      --salida /tmp/informe.md --json /tmp/informe.json

El informe sigue el formato de la rubrica de la materia (memoria 897):

- criterios de severidad explicitos, no severidad arbitraria;
- cuantificacion con n y %;
- matriz de co-ocurrencia (que hallazgos se concentran en los mismos bloques);
- top 5 por accionabilidad por impacto, no solo por severidad;
- responsable por hallazgo;
- supuestos documentados de forma explicita.

Las reglas que convierten una medicion en un hallazgo viven aqui y son
VERSIONADAS con el pipeline: cambiar una regla cambia el metro y hay que
decirlo en el commit.
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

# --- reglas: medicion -> hallazgo ----------------------------------------
# clave: (criterio, severidad, titulo, responsable, accion, esfuerzo_min)
REGLAS_ESTETICAS = [
    ("E-05", "CRITICA", "contraste por debajo del umbral AA", "Diseno",
     "subir el color del texto o el del fondo hasta pasar el umbral", 30),
    ("E-07", "CRITICA", "la entrada animada deja contenido invisible", "Diseno",
     "mover solo transform y anadir red de seguridad", 20),
    ("E-08", "CRITICA", "desborde horizontal de la pagina", "Diseno",
     "corregir el elemento que desborda", 45),
    ("E-09", "CRITICA", "referencia sin resolver o cifra invalida", "Ingenieria",
     "corregir la cifra o retirar la referencia", 15),
    ("E-01", "ALTA", "mas de un acento cromatico activo", "Diseno",
     "dejar un solo acento y neutralizar el resto", 60),
    ("E-04", "ALTA", "la escala tipografica no es coherente", "Diseno",
     "fijar una escala modular y aplicarla a los niveles", 90),
    ("E-04", "MEDIA", "longitud de linea fuera del rango comodo", "Diseno",
     "limitar el ancho de medida o ajustar el tamano del cuerpo", 20),
    ("E-08", "ALTA", "objetivo tactil menor de 44 px", "Diseno",
     "agrandar el area clicable sin cambiar el aspecto", 25),
    ("E-10", "ALTA", "salto en la jerarquia de encabezados", "Diseno",
     "encadenar los niveles de encabezado", 15),
    ("E-10", "ALTA", "foco visible no definido", "Diseno",
     "definir el anillo de foco con el color de acento", 10),
    ("E-10", "MEDIA", "imagen sin texto alternativo", "Diseno",
     "describir la imagen o marcarla como decorativa", 10),
    ("E-02", "MEDIA", "peso del acento por encima del umbral", "Diseno",
     "devolver area al fondo: el acento marca, no rellena", 45),
    ("E-06", "MEDIA", "ritmo vertical irregular", "Diseno",
     "unificar la escala de separaciones", 40),
    ("E-03", "MEDIA", "la firma de marca no es distinguible", "Diseno",
     "reforzar el motivo propio de la pagina", 60),
]

IMPACTO = {"CRITICA": 3.0, "ALTA": 2.0, "MEDIA": 1.0, "BAJA": 0.5}
PESO_ORDEN = {"CRITICA": 0, "ALTA": 1, "MEDIA": 2, "BAJA": 3}


def hallazgos_esteticos(datos):
    h = []
    for r in datos.get("resultados", []):
        if r.get("error"):
            h.append({"criterio": "E-01", "severidad": "CRITICA", "donde": r["url"],
                      "detalle": "la pagina no se pudo medir: " + r["error"], "evidencia": {},
                      "responsable": "Ingenieria", "accion": "levantar el servidor y volver a medir", "esfuerzo_min": 15})
            continue
        url = r["url"] + " [%s / %s px]" % (r.get("tema", "sin tema"), r.get("ancho", "?"))
        c = r.get("contraste", {})
        if c.get("fallos"):
            h.append({"criterio": "E-05", "severidad": "CRITICA", "donde": url,
                      "detalle": "%d textos bajo el umbral AA" % c["fallos"],
                      "evidencia": {"casos": c.get("detalle", [])[:6]}, "responsable": "Diseno",
                      "accion": "subir el color del texto o el del fondo hasta pasar el umbral", "esfuerzo_min": 30})
        mv = r.get("movimiento", {})
        if mv.get("oculta_con_opacity"):
            h.append({"criterio": "E-07", "severidad": "CRITICA", "donde": url,
                      "detalle": "la animacion de entrada arranca en opacidad cero",
                      "evidencia": {"reglas": mv.get("reglas", [])[:6]}, "responsable": "Diseno",
                      "accion": "mover solo transform y anadir red de seguridad", "esfuerzo_min": 20})
        d = r.get("desborde", {})
        if d.get("scrollWidth", 0) > d.get("innerWidth", 0) + 1:
            h.append({"criterio": "E-08", "severidad": "CRITICA", "donde": url,
                      "detalle": "desborde horizontal: %d px sobre %d" % (d["scrollWidth"], d["innerWidth"]),
                      "evidencia": {"elementos": d.get("elementos", [])[:6]}, "responsable": "Diseno",
                      "accion": "corregir el elemento que desborda", "esfuerzo_min": 45})
        inv = r.get("invisibles", {})
        if inv.get("total"):
            h.append({"criterio": "E-07", "severidad": "CRITICA", "donde": url,
                      "detalle": "%d bloques con opacidad menor a 1" % inv["total"],
                      "evidencia": {"detalle": inv.get("detalle", [])[:6]}, "responsable": "Diseno",
                      "accion": "mover solo transform y anadir red de seguridad", "esfuerzo_min": 20})
        ob = r.get("objetivos_tactiles", {})
        # WCAG 2.2 SC 2.5.8 exige 24x24 (AA). 44x44 es recomendacion: se
        # reporta aparte y con severidad menor. En escritorio un enlace de
        # navegacion de 20 px de alto es texto, no un defecto.
        aa = [o for o in ob.get("detalle", []) if o.get("nivel") == "incumple-24"]
        rec = [o for o in ob.get("detalle", []) if o.get("nivel") == "recomendado-44"]
        esp = [o for o in ob.get("detalle", []) if o.get("nivel") == "espaciado-24"]
        if aa and r.get("movil"):
            h.append({"criterio": "E-08", "severidad": "ALTA", "donde": url,
                      "detalle": "%d objetivos tactiles por debajo de 24 px en movil sin espaciado que los salve (WCAG 2.2 AA)" % len(aa),
                      "evidencia": {"casos": aa[:8]}, "responsable": "Diseno",
                      "accion": "agrandar el area clicable hasta 24 px", "esfuerzo_min": 25})
        elif rec and r.get("movil"):
            h.append({"criterio": "E-08", "severidad": "MEDIA", "donde": url,
                      "detalle": "%d objetivos tactiles por debajo de 44 px en movil (recomendacion, no norma)" % len(rec),
                      "evidencia": {"casos": rec[:8]}, "responsable": "Diseno",
                      "accion": "agrandar el area clicable hasta 44 px", "esfuerzo_min": 25})
        if r.get("saltos_encabezado"):
            h.append({"criterio": "E-10", "severidad": "ALTA", "donde": url,
                      "detalle": "salto en la jerarquia de encabezados",
                      "evidencia": {"encabezados": r["saltos_encabezado"]}, "responsable": "Diseno",
                      "accion": "encadenar los niveles de encabezado", "esfuerzo_min": 15})
        if not r.get("foco", {}).get("focus_visible"):
            h.append({"criterio": "E-10", "severidad": "ALTA", "donde": url,
                      "detalle": "no hay estilo de foco visible", "evidencia": {}, "responsable": "Diseno",
                      "accion": "definir el anillo de foco con el color de acento", "esfuerzo_min": 10})
        if r.get("imagenes_sin_alt"):
            h.append({"criterio": "E-10", "severidad": "MEDIA", "donde": url,
                      "detalle": "%d imagenes sin texto alternativo" % r["imagenes_sin_alt"],
                      "evidencia": {}, "responsable": "Diseno",
                      "accion": "describir la imagen o marcarla como decorativa", "esfuerzo_min": 10})
        p = r.get("parrafos", {})
        # el rango de longitud de linea depende del viewport: en movil una
        # linea de 40 caracteres es lo normal, no un defecto. Solo se evalua
        # el texto de lectura (60 caracteres o mas): una etiqueta de 38
        # caracteres no es una linea mal medida.
        rango = (30, 60) if r.get("movil") else (45, 90)
        todos = [x for x in p.get("detalle", []) if x.get("caracteres", 0) >= 60]
        fuera = [x for x in todos if x.get("caracteres_por_linea", 0) < rango[0] or x.get("caracteres_por_linea", 0) > rango[1]]
        if fuera:
            h.append({"criterio": "E-04", "severidad": "MEDIA", "donde": url,
                      "detalle": "%d parrafos de lectura con longitud de linea fuera de %d a %d caracteres" % (len(fuera), rango[0], rango[1]),
                      "evidencia": {"casos": fuera[:6]}, "responsable": "Diseno",
                      "accion": "limitar el ancho de medida o ajustar el tamano del cuerpo", "esfuerzo_min": 20})
        figs = r.get("cifras_destacadas", [])
        if figs:
            tamanos = sorted({f["px"] for f in figs})
            if len(tamanos) > 1 and (max(tamanos) - min(tamanos)) / max(tamanos) > 0.05:
                h.append({"criterio": "E-04", "severidad": "MEDIA", "donde": url,
                          "detalle": "las cifras destacadas se muestran en %d tamanos distintos: %s" % (len(tamanos), ", ".join(str(t) for t in tamanos)),
                          "evidencia": {"cifras": figs[:14]}, "responsable": "Diseno",
                          "accion": "unificar el tamano de las cifras en una sola escala", "esfuerzo_min": 25})
        col = r.get("color", {})
        fam = col.get("familias_acento", [])
        if len(fam) > 1:
            h.append({"criterio": "E-01", "severidad": "ALTA", "donde": url,
                      "detalle": "%d familias de tono de acento de marca (se espera una)" % len(fam),
                      "evidencia": {"familias": fam}, "responsable": "Diseno",
                      "accion": "dejar un solo acento y neutralizar el resto", "esfuerzo_min": 60})
        if col.get("peso_acento_pct", 0) > 12:
            h.append({"criterio": "E-02", "severidad": "MEDIA", "donde": url,
                      "detalle": "el acento ocupa %.1f %% del area" % col["peso_acento_pct"],
                      "evidencia": {"peso_acento_pct": col["peso_acento_pct"]}, "responsable": "Diseno",
                      "accion": "devolver area al fondo: el acento marca, no rellena", "esfuerzo_min": 45})
    return h


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--estetico", required=True)
    ap.add_argument("--psicometrico", required=True)
    ap.add_argument("--salida", default=None)
    ap.add_argument("--json", dest="json_salida", default=None)
    args = ap.parse_args()

    with open(args.estetico, encoding="utf-8") as f:
        est = json.load(f)
    with open(args.psicometrico, encoding="utf-8") as f:
        psi = json.load(f)

    hall = []
    for x in hallazgos_esteticos(est):
        hall.append(x)
    for x in psi.get("hallazgos", []):
        y = dict(x)
        y.setdefault("responsable", "Contenido" if x["criterio"].startswith("P-0") else "Ingenieria")
        y.setdefault("accion", "corregir segun la rubrica " + x["criterio"])
        y.setdefault("esfuerzo_min", 30)
        hall.append(y)

    # deduplicacion: el mismo hallazgo se repite en cada combinacion de
    # tema, viewport e idioma. Un hallazgo es uno; lo que se registra es DONDE
    # aparece. Sin esto, el top 5 se llena de filas repetidas.
    unicos = {}
    for h in hall:
        clave = (h["criterio"], h["detalle"])
        if clave in unicos:
            unicos[clave]["ocurrencias"].append(h["donde"])
            if len(h.get("evidencia", {}).get("casos", [])) > len(unicos[clave].get("evidencia", {}).get("casos", [])):
                unicos[clave]["evidencia"] = h["evidencia"]
        else:
            h2 = dict(h)
            h2["ocurrencias"] = [h["donde"]]
            unicos[clave] = h2
    hall = list(unicos.values())

    n = len(hall) or 1
    por_crit = Counter(h["criterio"] for h in hall)
    por_sev = Counter(h["severidad"] for h in hall)

    # co-ocurrencia: por bloque (archivo)
    por_bloque = defaultdict(list)
    for h in hall:
        for o in h.get("ocurrencias", []):
            por_bloque[o].append(h["criterio"])
    cooc = []
    for bloque, crits in por_bloque.items():
        c = Counter(crits)
        cooc.append({"bloque": bloque, "n_hallazgos": len(crits), "criterios": dict(c)})
    cooc.sort(key=lambda x: -x["n_hallazgos"])

    # top 5 por accionabilidad por impacto
    def puntaje(h):
        return IMPACTO.get(h["severidad"], 1.0) * max(1, min(8, 60 / max(5, h.get("esfuerzo_min", 30))))
    top = sorted(hall, key=lambda h: -puntaje(h))[:5]

    ahora = datetime.now(timezone.utc).strftime("%d-%m-%Y %H:%M UTC")
    lineas = []
    A = lineas.append
    A("# Informe de pulido - %s" % ahora)
    A("")
    A("Generado por el pipeline vibe-loop. Hechos medidos, no veredictos: el veredicto lo emite el juez contra la rubrica versionada.")
    A("")
    A("## Resumen")
    A("")
    A("- Hallazgos totales: **%d**" % n)
    A("- Severidad: " + ", ".join("%s %d" % (k, v) for k, v in sorted(por_sev.items(), key=lambda x: PESO_ORDEN.get(x[0], 9))) or "- Severidad: ninguno")
    A("- Criterios afectados: " + ", ".join("%s %d" % (k, v) for k, v in sorted(por_crit.items())))
    A("- Afirmaciones evaluadas: %d" % psi.get("n_afirmaciones", 0))
    A("- Estado de la fuente primaria: %s" % psi.get("estado_fuentes", "no verificado"))
    A("")
    A("## Hallazgos por criterio")
    A("")
    A("Un hallazgo es uno. La columna de apariciones dice en cuantas mediciones se reproduce.")
    A("")
    A("| Criterio | Severidad | Detalle | Aparece en | Responsable | Esfuerzo |")
    A("|---|---|---|---|---|---|")
    for h in sorted(hall, key=lambda x: (PESO_ORDEN.get(x["severidad"], 9), x["criterio"])):
        A("| %s | %s | %s | %d mediciones | %s | %d min |" % (
            h["criterio"], h["severidad"], str(h["detalle"]).replace("|", "/"),
            len(h.get("ocurrencias", [])),
            h.get("responsable", "-"), h.get("esfuerzo_min", 0)))
    A("")
    A("## Donde aparece cada hallazgo")
    A("")
    for h in sorted(hall, key=lambda x: (PESO_ORDEN.get(x["severidad"], 9), x["criterio"])):
        A("- **%s** %s" % (h["criterio"], h["detalle"]))
        for o in h.get("ocurrencias", []):
            A("  - " + o)
    A("")
    A("## Co-ocurrencia")
    A("")
    A("| Bloque | Hallazgos | Criterios |")
    A("|---|---|---|")
    for c in cooc:
        A("| %s | %d | %s |" % (c["bloque"], c["n_hallazgos"],
                                ", ".join("%s x%d" % (k, v) for k, v in c["criterios"].items())))
    A("")
    A("## Top 5 por accionabilidad por impacto")
    A("")
    A("| Criterio | Severidad | Esfuerzo | Puntaje | Accion |")
    A("|---|---|---|---|---|")
    for h in top:
        A("| %s | %s | %d min | %.2f | %s |" % (
            h["criterio"], h["severidad"], h.get("esfuerzo_min", 0), puntaje(h),
            str(h.get("accion", "")).replace("|", "/")))
    A("")
    A("## Supuestos")
    A("")
    A("- La escala de impacto y la de esfuerzo son convenciones declaradas de este pipeline, no medidas.")
    A("- La base local de dark-memory es la fuente primaria de las cifras de plataforma.")
    A("- Las cifras cuya fuente es la CI o la API de GitHub no son verificables desde aqui: no se marcan como correctas ni incorrectas.")
    A("- El dato de percepcion del usuario es 'sin dato' hasta que exista una captura; no se publica ninguna puntuacion.")
    A("- Un desfase pequeno entre la cifra publicada y el conteo actual se explica por el crecimiento de la base, no por un error.")
    A("")

    texto = "\n".join(lineas)
    if args.salida:
        with open(args.salida, "w", encoding="utf-8") as f:
            f.write(texto)
        print("escrito: " + os.path.abspath(args.salida))
    else:
        print(texto)

    if args.json_salida:
        with open(args.json_salida, "w", encoding="utf-8") as f:
            json.dump({"generado": ahora, "n_hallazgos": n, "hallazgos": hall,
                       "por_criterio": dict(por_crit), "por_severidad": dict(por_sev),
                       "coocurrencia": cooc, "top5": [{"criterio": h["criterio"], "severidad": h["severidad"],
                                                      "accion": h.get("accion"), "puntaje": round(puntaje(h), 2)}
                                                     for h in top]},
                      f, ensure_ascii=False, indent=2)
        print("json: " + os.path.abspath(args.json_salida))

    return 0


if __name__ == "__main__":
    sys.exit(main())
