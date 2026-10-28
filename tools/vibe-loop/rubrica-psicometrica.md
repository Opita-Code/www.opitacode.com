# Rubrica psicometrica de datos y afirmaciones v1

Version 1.0 - 28 de octubre de 2026.

Criterios heredados de la rúbrica de la materia (memoria 897): seis dimensiones de
calidad de datos, cuantificación con n y %, severidad con criterios explícitos,
acciones ejecutables y supuestos documentados. Lo que cambia aquí es el objeto:
las seis dimensiones se aplican a lo que la pagina afirma y a lo que el usuario
percibe.

Dos sub-capacidades, con estados distintos:

- **Verificable hoy**: unicidad, completitud, validez, consistencia, formato e
  integridad referencial de las cifras y afirmaciones publicadas.
- **Sin dato de usuario**: percepcion de calidad de la interfaz. El instrumento
  existe (atractividad, usabilidad y deseabilidad; escala de adjetivos del SUS
  con referencias comparativas), pero sin captura con usuarios no hay dato. Se
  reporta `sin dato` y no se publica ninguna puntuacion. Inventar un indice de
  satisfaccion seria el error mas grave posible en este carril.

## Criterios

| Id | Dimension | Exige | Se verifica con | Si no se cumple |
|---|---|---|---|---|
| P-01 | Unicidad | Cada cifra publica tiene una unica fuente de verdad, y ninguna se reescribe a mano en las paginas | Las cifras del HTML coinciden con el modulo de metricas | ALTA |
| P-02 | Completitud | Toda cifra lleva fuente y fecha; ninguna dice "aproximadamente" sin acotar | Cada metrica tiene origen y fecha | ALTA |
| P-03 | Validez | La cifra coincide con la fuente primaria en el momento de la consulta | Contraste contra la fuente primaria | CRITICA |
| P-04 | Consistencia | Las dos versiones publishes muestran el mismo numero para el mismo hecho, y el mismo numero de secciones | Comparacion de cifras entre las dos paginas | CRITICA |
| P-05 | Formato | Separador de miles coherente en toda la pagina y coherente con el resto del sitio | Analisis de formatos numericos | MEDIA |
| P-06 | Integridad referencial | Los identificadores citados (evaluaciones, specs, artefactos) existen y se pueden verificar | Consulta a la fuente primaria | CRITICA |
| P-07 | Afirmaciones prohibidas | Sin aval institucional, sin referencia a un plan de estudios, sin veredicto de juez simulado, sin cifras sin fuente | Deteccion de patrones | CRITICA |
| P-08 | Percepcion | Existe el protocolo de captura de percepcion y el lugar donde se guarda; mientras no haya captura, se dice `sin dato` | Protocolo documentado y ausencia de puntuaciones publicadas | ALTA |

## Prohibiciones

Estas afirmaciones son `CRITICA` cuando aparecen, sin exception:

1. Que un tercero avale, certifique o respalde el trabajo.
2. Que el proyecto sea parte de un plan de estudios o de una asignatura.
3. Mostrar un veredicto de un juez que no se emitio, o uno simulado con
   puntuacion.
4. Publicar una cifra sin fuente primaria verificable ni fecha.

## Dimensiones de calidad de dato

Cada afirmacion publicada se clasifica en seis dimensiones, con n y %:

- **Unicidad**: no duplicada en varias fuentes del repositorio.
- **Completitud**: con origen, fecha y unidad.
- **Validez**: el valor representa lo que la etiqueta dice.
- **Consistencia**: no contradice otra cifra publicada.
- **Formato**: separadores, unidades y precision homogeneas.
- **Integridad referencial**: la referencia apunta a algo que existe.

Un hallazgo se cuenta una vez por afirmacion, no una vez por dimension: se
reporta la dimension que falla, no el numero de dimensiones afectadas.

## Supuestos que se declaran de forma explicita

- La base local de dark-memory es la fuente primaria de las cifras de plataforma.
  Si el operador decide otra fuente, cambia el supuesto y se documenta.
- "Sin dato de percepcion" significa que no hay captura con usuarios. No
  significa que la perceccion sea mala, ni que sea buena.
- Una fecha de consulta caduca. Las cifras con mas de 30 dias se marcan
  `desactualizada` en el informe, aunque sigan siendo correctas.
