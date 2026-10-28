# Spec — vibe-loop de pulido y mejora

Version 1.0 · 28 de octubre de 2026 · vibe_case C1 (codigo y metodo)

## Objetivo

Un loop gobernado que pulle superficies de Opita Code —hoy la home de
`opitacode.com`— con dos carriles de analisis: uno psicometrico (lo que la
pagina afirma: unicidad, completitud, validez, consistencia, formato e
integridad referencial, mas el estado de la percepcion) y otro estetico (lo que
la pagina muestra: jerarquia, escala, color, contraste, ritmo, movimiento,
responsive y accesibilidad). El loop convierte lo medido en tareas, aplica el
pulido, vuelve a medir y deja que un gate decida si la iteracion se publica.

## Alcance

**Dentro:** la home en espanol e ingles de `www.opitacode.com` (`frontend-v2`),
sus tokens de color, sus componentes y las cifras que publica.

**Fuera:** el contenido editorial (el texto se juzga por su verdad, no por su
estilo), el diseno de las otras paginas del sitio, el codigo del producto, y
cualquier decision de producto o de mercado.

**Congelamiento:** durante una iteracion no se anaden secciones, no se cambia
el orden de la pagina y no se toca el copy. Un cambio de ese tipo es una
iteracion nueva, con su propia spec.

## Invariantes

1. Ninguna cifra publicada sin fuente primaria y fecha de consulta.
2. Ningun veredicto de juez simulado en la pagina. Lo que se muestra son ids
   reales de evaluacion, consultables en la base.
3. Ningun contenido invisible por defecto: una entrada animada mueve transform,
   nunca opacity.
4. Una sola familia de tono de acento de marca. Los indicadores de estado son
   tokens de funcion y no cuentan como acento.
5. Las dos versiones publican el mismo conjunto de cifras y el mismo numero de
   secciones.
6. Las dos rubricas estan escritas y versionadas. No se generan con un modelo:
   RubricBench (2026) midio un 27 % de brecha entre rubricas humanas y las
   generadas por modelos de estado del arte.
7. Un juez que falla por infraestructura produce `needs_human`. Nunca
   `drift_detected` ni `aligned` por defecto.

## Fases y criterios

| Fase | Entrada | Salida | Criterio de paso |
|---|---|---|---|
| F0 Intake | artefacto y objetivo | alcance congelado | el alcance esta escrito |
| F1 Evidencia | build servido | dos JSON de auditoria | la medicion corrio en los dos temas, los dos anchos y los dos idiomas |
| F2 Critica | JSON + rubricas | hallazgos con criterio, severidad y evidencia | cada hallazgo tiene evidencia, no impresion |
| F3 Informe | hallazgos | informe con n y %, co-ocurrencia, top 5 y supuestos | el formato es el de la rubrica de la materia |
| F4 Spec | informe | `vibe_spec` con las tareas | la spec queda con id |
| F5 Pulido | tareas | cambios aplicados | F1 re-ejecutado completo |
| F6 Gate | medicion nueva | veredicto | checks en verde y veredicto del juez |
| F7 Cierre | veredicto | memoria y artefacto | el estado real queda escrito |

## Gates de publicacion

Las tres condiciones son necesarias:

1. **Checks deterministas en verde**: build limpio, cero fallos de contraste
   AA, cero elementos invisibles, cero desbordes horizontales, una sola familia
   de acento, cero saltos en la jerarquia de encabezados, cifras validas contra
   la fuente primaria, paridad ES/EN.
2. **Veredicto del juez**: `aligned` publica. `drift_detected` obliga a
   corregir y re-publicar. `needs_human` detiene y escala al operador.
3. **Mejoria medible**: el hallazgo que abrio la iteracion quedo resuelto o
   reclasificado con justificacion escrita.

## Criterios de parada

- sin mejora medible entre iteraciones;
- maximo 5 iteraciones por lote sin autorizacion del operador;
- el alcance congelado fue roto;
- el juez no esta disponible y el operador no resuelve;
- la rubrica y el criterio de exito se contradicen.

## Supuestos

- La base local de dark-memory es la fuente primaria de las cifras de
  plataforma. Las cifras de la CI y de la API de GitHub no son verificables
  desde el pipeline: se declaran, no se inventan.
- Un desfase pequeño entre la cifra publicada y el conteo actual se explica por
  el crecimiento de la base, no por un error de publicacion. El umbral es 60.
- El dato de percepcion del usuario es "sin dato" hasta que exista una
  captura. Mientras tanto no se publica ninguna puntuacion. El instrumento
  previsto es la escala de atractividad, usabilidad y deseabilidad, con la
  escala de adjetivos del SUS como referencia comparativa.
- La escala de impacto y la de esfuerzo del informe son convenciones
  declaradas del pipeline, no medidas.
- El objetivo tactil exigible es 24 por 24 (WCAG 2.2 SC 2.5.8, nivel AA), con
  la excepcion de espaciado. Los 44 px son recomendacion de plataforma movil y
  se reportan aparte.

## Entregables

- `tools/vibe-loop/README.md` — el protocolo completo.
- `tools/vibe-loop/rubrica-estetica.md` — rubrica E-01 a E-10.
- `tools/vibe-loop/rubrica-psicometrica.md` — rubrica P-01 a P-08.
- `tools/vibe-loop/auditor-estetico.mjs` — medicion en navegador real.
- `tools/vibe-loop/auditor-psicometrico.py` — validacion de cifras y afirmaciones.
- `tools/vibe-loop/verificar-fuentes.py` — contraste contra la fuente primaria.
- `tools/vibe-loop/informe-pulido.py` — consolidacion con severidad.
- `tools/vibe-loop/informes/` — informes de cada iteracion.

## Riesgos

| Riesgo | Mitigacion |
|---|---|
| El pipeline se vuelve un formalism sin efecto | cada iteracion produce un commit con el hallazgo resuelto |
| La rubrica se reescribe para dar la razon a un resultado | la rubrica cambia solo por commit explicito, con su diff a la vista |
| El juez no esta disponible | checks deterministas como puerta minima; `needs_human` escala, no approves |
| El pipeline se aplica al contenido y reescribe el copy | el copy se juzga por su verdad; el estilo del copy no es criterio |
| Falsos positivos erosionan la confianza | cada hallazgo lleva evidencia; los umbrales se calibran con medicion, no con criterio |

## Primera ejecucion

28 de octubre de 2026. La primera medicion dio 58 textos bajo el umbral AA en
tema claro y una cifra de escrituras auditadas mal por un orden de magnitud
(1.494 publicado contra 15.000 en la fuente primaria). El pipeline quedo en
cero hallazgos criticos y altos, con cuatro hallazgos de severidad media o
baja, tres de ellos decisiones de diseno que el operador puede vetar.
