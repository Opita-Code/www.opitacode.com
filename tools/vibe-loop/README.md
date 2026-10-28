# vibe-loop de pulido y mejora

Pipeline gobernado para pulir superficies de Opita Code (hoy: la home de
`opitacode.com`) con dos carriles de analisis y un gate de publicacion.

El loop no decide que es bonito. Mide hechos, los contrasta contra una rubrica
escrita y versionada, convierte los hallazgos en tareas, y deja que el gate
(determinista + juez) decida si la iteracion se publica.

## Por que dos carriles

El pulido de una landing tiene dos preguntas que no se contestan con la misma
herramienta:

| Carril | Pregunta | Metodo | Fallo tipico |
|---|---|---|---|
| **Psicometrico** | Lo que la pagina afirma es verdad, completo y coherente? | Rubrica de datos y afirmaciones + verificacion contra fuente primaria | Publicar una cifra vieja o mal formada |
| **Estetico** | Lo que la pagina muestra esta bien construido? | Rubrica estetica + medicion en navegador real | Jerarquia rota, contraste bajo, ritmo roto |

Un carril solo deja pasar el otro. La pagina del 28-10-2026 tenia estetica
correcta y una cifra de escrituras auditadas mal por un orden de magnitud.

## Las siete fases

```
F0 INTAKE      que artefacto se pule, que objetivo, que NO se toca
F1 EVIDENCIA   medir hechos objetivos (sin interpretar)
F2 CRITICA     dos carriles, cada hallazgo con evidencia y severidad
F3 INFORME     consolidar: severidad, n y %, co-ocurrencia, top 5, supuestos
F4 SPEC        vibe_spec: los hallazgos priorizados como tareas ejecutables
F5 PULIDO      aplicar los cambios y re-ejecutar F1
F6 GATE        checks deterministas + drift_judge + veredicto
F7 CIERRE      memoria, artefacto publicado, decision de seguir o parar
```

### F0 Intake

Se declara por escrito: artefacto, objetivo de la iteracion, y el **congelamiento
de alcance** (lo que no se toca). Sin alcance congelado, un loop de pulido
deriva a rediseño. El congelamiento va en la `spec_intent` que se le pasa al
juez: es la hipotesis contra la que se juzga el artefacto.

### F1 Evidencia

Dos auditores, ambos deterministas, ambos con salida JSON. Ninguno juzga.

- `auditor-estetico.mjs` (Playwright, navegador real): contraste WCAG, escala
  tipografica, jerarquia de encabezados, longitud de linea, objetos tactiles,
  desbordes, elementos invisibles, peso del acento, ritmo vertical.
- `auditor-psicometrico.py`: unicidad, completitud, validez, consistencia,
  formato e integridad referencial de las cifras y afirmaciones publicadas.
- `verificar-fuentes.py` (opcional): contrasta las cifras publicadas contra la
  fuente primaria (base local de dark-memory) y produce el veredicto de validez.

### F2 Critica

Cada carril evalua contra su rubrica versionada en este directorio. La rubrica
no la genera el modelo: RubricBench (2026) midio un 27 % de brecha entre
rubricas anotadas por humanos y las generadas por modelos de estado del arte.
Una rubrica escrita por el operador es el unico punto de anclaje estable.

Reglas de la capa LLM:

- el juez ve la rubrica, el artefacto y la evidencia medida, en ese orden;
- el veredicto es la conclusion logica de una lista de criterios, no una
  impresion (regla G-Eval, ya aplicada en dark-memory);
- si el juez se contradice entre veredicto y razonamiento, el veredicto pasa a
  `needs_human`;
- control de sesgo de posicion: si se comparan dos versiones, el orden se
  invierte en la mitad de las corridas.

### F3 Informe

Formato heredado de la rubrica de la materia (memoria 897):

- severidad con criterios explicitos (no severidad arbitraria);
- cuantificacion con n y % ;
- matriz de co-ocurrencia: que hallazgos se concentran en los mismos bloques;
- top 5 por accionabilidad por impacto, no solo por severidad;
- responsable por hallazgo;
- supuestos documentados de forma explicita.

### F4 Spec

`vibe_spec` con las tareas del hallazgo. El id de la spec queda en el informe y
en el commit: cada iteracion del loop es trazable.

### F5 Pulido

Se aplican los cambios. F1 se re-ejecuta completo. Un cambio que no se puede
medir no entra: la ausencia de regresiones se comprueba con la misma medicion,
no con la mirada.

### F6 Gate

Tres condiciones, todas necesarias:

1. **Checks deterministas en verde** (build, auditorias, guardas editoriales).
2. **Veredicto del juez**: `aligned` publica; `drift_detected` obliga a
   corregir y re-publicar; `needs_human` detiene y escala al operador.
3. **Criterio de mejora**: el hallazgo critico que abrio la iteracion quedo
   resuelto o reclasificado con justificacion.

Regla dura: si el juez falla por infraestructura (sin llave, limite de cuota,
red), el veredicto es `needs_human`. Un juez caido nunca se interpreta como
`drift_detected` ni como `aligned`.

### F7 Cierre

Memoria con el estado real, artefacto publicado bajo la spec, y la decision de
continuar o parar.

## Criterios de parada

El loop se detiene, siempre, cuando se cumple cualquiera de estos:

- **sin mejora medible**: el numero de hallazgos de severidad alta o critica no
  baja entre iteraciones;
- **presupuesto de iteraciones**: maximo 5 por lote, salvo que el operador autorice
  mas;
- **alcance congelado roto**: un cambio toca algo fuera del alcance declarado;
- **juicio no disponible**: `needs_human` sin resolucion del operador;
- **conflicto de criterio**: la rubrica y el criterio de exito dicen cosas
  distintas.

## Archivos

| Archivo | Que hace |
|---|---|
| `rubrica-estetica.md` | Rubrica estetica v1 (E-01 a E-10) y su evidencia |
| `rubrica-psicometrica.md` | Rubrica de datos y afirmaciones v1 (P-01 a P-08) |
| `auditor-estetico.mjs` | Medidor en navegador real, salida JSON |
| `auditor-psicometrico.py` | Validador de cifras y afirmaciones, salida JSON |
| `verificar-fuentes.py` | Contraste contra la fuente primaria |
| `informe-pulido.py` | Consolida las dos salidas en el informe con severidad |
| `spec-vibe-loop-pulido.md` | La spec del loop: objetivo, gates, invariantes |

## Uso

```bash
cd frontend-v2
npm run build                       # el auditor estetico mide el build, no el dev server
node ../tools/vibe-loop/auditor-estetico.mjs --url http://127.0.0.1:8732/es/index.html
python ../tools/vibe-loop/auditor-psicometrico.py --root .. --salida /tmp/psico.json
python ../tools/vibe-loop/informe-pulido.py --estetico /tmp/estetico.json --psicometrico /tmp/psico.json
```

El servidor estatico debe servir `dist/` como raiz. Servir `frontend-v2/` da 404
en `/_astro/*.css` y la pagina sale sin estilos: el auditor mediria una pagina
que no existe.

## Fuentes del marco

| Concepto | Fuente |
|---|---|
| Jerarquia y placer sensorial, unidad en variedad, maximo efecto con minimo medio, balance tipicidad y novedad | Hekkert (2006), *Design aesthetics: principles of pleasure in design* |
| Modelo de tres niveles (social, cognitivo, perceptual) y unidad en variedad como predictor del juicio estetico | Berghman y Hekkert (2017), UMA; Post, Blijlevens y Hekkert (2016), *Acta Psychologica* 163 |
| Atractividad, usabilidad y deseabilidad como escalas de percepcion de calidad de interfaz; PSSUQ con tres factores | Bangor, Kortum y Miller; Sauro y Lewis |
| Brecha entre rubricas humanas y generadas por modelos | RubricBench (2026) |
| LLM como critico de calidad de desarrollo web con rubricas ancladas en consulta | WebDevJudge, arXiv 2510.18560 |
| Sesgos del juez: posicion, verbosidad, auto-preferencia | Galtea, guia de evaluaciones LLM 2026 |
| Formato del informe: severidad con criterios, n y %, co-ocurrencia, top 5, supuestos | Rubrica de la materia (memoria 897) |
| Estructura del loop con spec por unidad, veredicto como gate de merge, commits estructurados | Decisiones v2 de opita-growth (memoria 901) |
