# Rubrica estetica v1

Version 1.0 - 28 de octubre de 2026. Escribida por el operador, no generada por
un modelo. Cambiar la rubrica es un commit explicito: el comparador de versiones
no puede cambiar de metro a mitad de un lote.

Cada criterio tiene: que exige, como se verifica, que evidencia lo prueba y que
pasa cuando no se cumple. La columna de evidencia dice que artefacto produce el
auditor; cuando no hay evidencia automatica, el criterio exige revision humana
y se marca como tal. Un criterio que no se puede verificar no puede fallar de
forma silenciosa: si no se puede verificar, es `no evaluado`, no `aprobado`.

## Marco

El marco es el de Hekkert: el placer estetico nace de cuatro principios
(principio 1, maximo efecto con minimo medio; principio 2, unidad en variedad;
principio 3, balance entre tipicidad y novedad; principio 4, ajuste optimo), y el
modelo UMA separa los niveles social, cognitivo y perceptual. La rubrica los
traduce a comprobables.

## Criterios

| Id | Exige | Se verifica con | Evidencia | Si no se cumple |
|---|---|---|---|---|
| E-01 | Unidad en la variedad: una sola familia de acento, una familia tipografica de titular, un cuerpo | Conteo de familias tipograficas y de acentos cromaticos activos | `auditor-estetico.mjs`, campo `tipografia.familias` y `color.acentes` | ALTA |
| E-02 | Maximo efecto con minimo medio: la jerarquia se construye con escala, peso y espacio, no anadiendo color | Porcentaje de area con saturacion alta; numero de colores activos | `auditor-estetico.mjs`, campo `color.peso_acento_pct` | MEDIA |
| E-03 | Balance tipicidad y novedad: la pagina se reconoce del genero y conserva una voz propia | Firma de marca presente (acento, motivo visual) y comprensibilidad del titular | `auditor-estetico.mjs`, campo `color.acento_presente` mas revision humana | MEDIA |
| E-04 | Escala tipografica coherente: los niveles de encabezado forman una escala reconocible y el salto de nivel no existe | Serie de tamanos de h1 a h3 y de parrafo; razones entre niveles | `auditor-estetico.mjs`, campo `tipografia.escala` | ALTA |
| E-05 | Contraste AA en todo texto: 4,5:1 para texto normal, 3:1 para texto grande, sin excepciones | Contraste calculado por par texto y fondo efectivo | `auditor-estetico.mjs`, campo `contraste` | CRITICA |
| E-06 | Ritmo y espacio: una sola escala vertical, densidad sana, alineacion consistente | Serie de separaciones verticales; proportion de espacio en blanco | `auditor-estetico.mjs`, campo `espacio` | MEDIA |
| E-07 | Movimiento que nunca oculta: la entrada mueve transform, no opacity; hay red de seguridad | Reglas CSS de la animacion de entrada | `auditor-estetico.mjs`, campo `movimiento` | CRITICA |
| E-08 | Responsive sin desbordes en 360, 390, 768, 1362 y objetivos tactiles de 44 px o mas | Ancho de documento contra ancho de ventana; medidas de los objetivos | `auditor-estetico.mjs`, campo `responsive` y `objetivos_tactiles` | CRITICA |
| E-09 | Evidencia real: lo que se muestra proviene del producto, no de una muestra escrita a mano | Verificacion de los identificadores citados contra la fuente primaria | `verificar-fuentes.py`, campo `integridad_referencial` | CRITICA |
| E-10 | Accesibilidad: foco visible, seleccion con el acento, jerarquia de encabezados sin saltos, texto alternativo en imagenes | Reglas de foco y alt; estructura de encabezados | `auditor-estetico.mjs`, campos `foco` y `encabezados` | ALTA |

## Criterios de severidad

- CRITICA: el lector no puede usar o no puede creer lo que ve. Invisible, ilegible,
  desbordado, o una afirmacion que no resiste una verificacion.
- ALTA: se rompe la lectura o la confianza, pero el uso sigue siendo posible.
- MEDIA: afecta la percepcion y la retencion, no la comprension.
- BAJA: desalineacion o incoherencia menor.

Los criterios criticos son E-05, E-07, E-08 y E-09. Un incumplimiento de
cualquiera de ellos detiene la publicacion hasta que se resuelva o se documente
la excepcion con justificacion.

## Lo que esta rubrica NO evalua

- Belleza subjetiva sin anclaje: no hay veredicto estetico sin evidencia.
- Conveniencia de mercado, conversiones, diseño de producto.
- Coherencia de marca con el manual: el manual no es una rubrica.
