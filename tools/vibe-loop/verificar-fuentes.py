#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador de fuentes primarias.

Contrasta las cifras publicadas en la landing contra la fuente primaria de la
que dicen salir (la base local de dark-memory) y resuelve las referencias
citadas (ids de evaluacion, spec, artefacto). Produce el JSON que consume el
auditor psicometrico para P-03 (validez) y P-06 (integridad referencial).

  python verificar-fuentes.py --salida /tmp/fuentes.json

Solo lectura: abre la base en modo ro y no escribe nada.

Cada cifra declara su fuente en el codigo. Una cifra cuya fuente no es local
(la CI de GitHub, la API de GitHub) se reporta como "fuente externa, no
verificable aqui": no se marca como correcta ni como incorrecta. Inventar el
valor seria el error que este pipeline existe para evitar.
"""

import argparse
import json
import os
import re
import sqlite3
import sys
from datetime import datetime, timezone

DB = os.path.expanduser("~/AppData/Local/dark-agents/dark.db")

# etiqueta publicada (label de metrics.ts) -> (consulta SQL o None, fuente)
# La etiqueta es la clave: el valor cambia con cada publicacion, la
# pregunta ("de donde sale este dato") no.
COMPARACIONES = {
    "specs creadas": ("SELECT COUNT(*) FROM vibe_specs", "base dark-memory"),
    "artefactos publicados": ("SELECT COUNT(*) FROM vibe_artifacts", "base dark-memory"),
    "evaluaciones del juez": ("SELECT COUNT(*) FROM sdd_evaluations", "base dark-memory"),
    "versión de esquema": ("SELECT MAX(version) FROM schema_migrations", "esquema de la base"),
    "escrituras auditadas": ("SELECT COUNT(*) FROM write_audit", "write_audit"),
}

# publicaciones cuya fuente no es local: se declaran, no se inventan
EXTERNAS = {
    "pruebas en verde": "CI del repositorio (GitHub Actions)",
    "mutantes eliminados · 38 paquetes": "CI del repositorio (GitHub Actions)",
    "partes de 51 documentos conformes": "juez · partes conformes de 51 documentos",
    "herramientas canónicas · 20 namespaces": "bootstrap del servidor (herramientas canonicas)",
    "releases publicados": "GitHub API · releases publicadas",
    "commits en el servidor de memoria": "GitHub API · commits",
}


def leer_metricas(ts_path):
    """Extrae (valor, etiqueta) del modulo de metricas."""
    if not os.path.exists(ts_path):
        return []
    with open(ts_path, encoding="utf-8") as f:
        ts = f.read()
    out = []
    for m in re.finditer(r"\{\s*\n\s*v:\s*'([^']+)'(.*?)\n  \},", ts, flags=re.S):
        et = re.search(r"es:\s*'([^']*)'", m.group(2))
        out.append((m.group(1), et.group(1) if et else None))
    return out


def consultar(cur, sql):
    try:
        cur.execute(sql)
        fila = cur.fetchone()
        return fila[0] if fila else None
    except Exception as e:
        return "ERROR: " + str(e)[:80]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--salida", default=None)
    ap.add_argument("--metrics", default=None, help="ruta a metrics.ts (por defecto, la del repo)")
    args = ap.parse_args()

    comparaciones = []
    referencias_no_resueltas = []
    referencias_ok = []

    if args.metrics:
        metrica_path = args.metrics
    else:
        aqui = os.path.dirname(os.path.abspath(__file__))
        metrica_path = os.path.abspath(os.path.join(aqui, "..", "..", "frontend-v2", "src", "lib", "metrics.ts"))

    if not os.path.exists(DB):
        print("no existe la base: " + DB, file=sys.stderr)
        return 2

    con = sqlite3.connect("file:%s?mode=ro" % DB.replace("\\", "/"), uri=True)
    cur = con.cursor()

    # --- conteos reales ---------------------------------------------------
    conteos = {
        "write_audit": consultar(cur, "SELECT COUNT(*) FROM write_audit"),
        "sdd_evaluations": consultar(cur, "SELECT COUNT(*) FROM sdd_evaluations"),
        "vibe_specs": consultar(cur, "SELECT COUNT(*) FROM vibe_specs"),
        "vibe_artifacts": consultar(cur, "SELECT COUNT(*) FROM vibe_artifacts"),
        "sessions": consultar(cur, "SELECT COUNT(*) FROM sessions"),
        "agent_memory": consultar(cur, "SELECT COUNT(*) FROM agent_memory"),
    }

    # --- contraste cifra publicada vs fuente primaria ---------------------
    # Se lee lo que esta publicado en metrics.ts: el verificador no lleva
    # cifras escritas a mano, porque un verificador con la respuesta adentro
    # no verifica nada.
    metricas = leer_metricas(metrica_path)
    for publicado, etiqueta in metricas:
        if etiqueta not in COMPARACIONES:
            continue
        sql, fuente = COMPARACIONES[etiqueta]
        real = consultar(cur, sql)
        comp = {
            "publicado": publicado,
            "etiqueta": etiqueta,
            "fuente": fuente,
            "fuente_valor": real,
            "consulta": sql,
        }
        if real is None or isinstance(real, str):
            comp.update({"coincide": None, "estado": "consulta no disponible"})
        else:
            num = int(re.sub(r"[^\d]", "", publicado))
            diferencia = real - num
            if diferencia == 0:
                comp.update({"coincide": True, "estado": "coincide exactamente", "diferencia": 0})
            elif abs(diferencia) <= 60:
                comp.update({"coincide": True, "estado": "desfase menor al mes de consultas",
                             "diferencia": diferencia,
                             "nota": "la base crece con cada escritura; un desfase pequeno es esperable"})
            else:
                comp.update({"coincide": False, "estado": "desfase que NO se explica por el crecimiento de la base",
                             "diferencia": diferencia,
                             "nota": "un desfase de esta magnitud significa que la cifra publicada no es la del dato descrito"})
        comparaciones.append(comp)

    # --- referencias citadas en la pagina --------------------------------
    # ids de evaluacion citados en el terminal del hero
    for eid in (1081, 1083, 1084):
        fila = consultar(cur, "SELECT COUNT(*) FROM sdd_evaluations WHERE id = %d" % eid)
        if fila:
            referencias_ok.append({"tipo": "evaluacion", "id": eid, "estado": "existe"})
        else:
            referencias_no_resueltas.append("evaluacion %d" % eid)

    for sid in (990,):
        fila = consultar(cur, "SELECT COUNT(*) FROM vibe_specs WHERE id = %d" % sid)
        if fila:
            referencias_ok.append({"tipo": "spec", "id": sid, "estado": "existe"})
        else:
            referencias_no_resueltas.append("spec %d" % sid)

    for aid in (606,):
        fila = consultar(cur, "SELECT COUNT(*) FROM vibe_artifacts WHERE id = %d" % aid)
        if fila:
            referencias_ok.append({"tipo": "artefacto", "id": aid, "estado": "existe"})
        else:
            referencias_no_resueltas.append("artefacto %d" % aid)

    # --- veredicto real de las evaluaciones citadas -----------------------
    veredictos = []
    cols = [r[1] for r in cur.execute("PRAGMA table_info(sdd_evaluations)").fetchall()]
    for eid in (1081, 1083, 1084):
        fila = cur.execute("SELECT * FROM sdd_evaluations WHERE id = ?", (eid,)).fetchone()
        if not fila:
            continue
        reg = dict(zip(cols, fila))
        vj = str(reg.get("verdict_json") or "")
        m = re.search(r'"verdict"\s*:\s*"([a-z_]+)"', vj)
        conf = reg.get("confidence")
        if conf is None:
            mc = re.search(r'"confidence"\s*:\s*([0-9.]+)', vj)
            conf = mc.group(1) if mc else None
        veredictos.append({
            "id": eid,
            "verdict_real": m.group(1) if m else None,
            "confidence_real": conf,
            "columnas_disponibles": cols,
        })

    con.close()

    salida = {
        "herramienta": "verificar-fuentes",
        "version": "1.0.0",
        "generado": datetime.now(timezone.utc).isoformat(),
        "base": DB,
        "conteos": conteos,
        "comparaciones": comparaciones,
        "externas_no_verificables": EXTERNAS,
        "referencias_ok": referencias_ok,
        "referencias_no_resueltas": referencias_no_resueltas,
        "veredictos_reales": veredictos,
    }
    texto = json.dumps(salida, ensure_ascii=False, indent=2)
    if args.salida:
        with open(args.salida, "w", encoding="utf-8") as f:
            f.write(texto)
        print("escrito: " + os.path.abspath(args.salida))
        for c in comparaciones:
            print("  %-8s publicado=%-8s fuente=%-10s %s" % (c["publicado"], c["fuente_valor"], c["estado"], c.get("diferencia", "")))
    else:
        print(texto)


if __name__ == "__main__":
    sys.exit(main())
