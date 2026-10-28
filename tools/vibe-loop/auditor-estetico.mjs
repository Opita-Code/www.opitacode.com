#!/usr/bin/env node
/**
 * Auditor estetico - medi facts, no judge.
 *
 * Mide una pagina en un navegador real y escribe un JSON con los datos que
 * alimentan la rubrica E-01 a E-10. No emite veredictos: eso es trabajo del
 * juez contra la rubrica versionada.
 *
 *   node auditor-estetico.mjs --url http://127.0.0.1:8732/es/index.html --salida /tmp/est.json
 *
 * Opciones:
 *   --url URL        pagina a medir (repetible)
 *   --ancho N        ancho de ventana (por defecto 1362)
 *   --alto N         alto de ventana (por defecto 900)
 *   --salida RUTA    archivo JSON de salida
 *   --cwd RUTA       carpeta donde buscar playwright (por defecto, el cwd)
 *
 * Nota sobre el servidor: hay que servir el build (dist/) como raiz. Servir
 * frontend-v2/ da 404 en /_astro/*.css y la pagina sale sin estilos: se
 * mediria una pagina que no existe.
 */

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { urls: [], ancho: 1362, alto: 900, salida: null, cwd: process.cwd() };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') out.urls.push(argv[++i]);
    else if (a === '--ancho') out.ancho = Number(argv[++i]);
    else if (a === '--alto') out.alto = Number(argv[++i]);
    else if (a === '--salida') out.salida = argv[++i];
    else if (a === '--cwd') out.cwd = argv[++i];
  }
  return out;
}

function loadPlaywright(cwd) {
  const candidatos = [
    cwd,
    resolve(cwd, 'frontend-v2'),
    resolve(HERE, '..', '..', 'frontend-v2'),
    resolve(HERE, '..', '..'),
  ];
  for (const c of candidatos) {
    try {
      const req = createRequire(resolve(c, 'noop.js'));
      return req('playwright');
    } catch (_) { /* siguiente */ }
  }
  throw new Error('no se encontro playwright; instala con: npm i -D playwright');
}

/* --- utilidades de color ------------------------------------------------- */

function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }

function luminancia([r, g, b]) {
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function parseRGB(str) {
  const m = String(str).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
}

function contraste(a, b) {
  const la = luminancia(a), lb = luminancia(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mezcla el color del texto con su fondo: el fondo real no siempre es opaco. */
function componer(frente, fondo) {
  const a = frente[3];
  if (a >= 0.999) return fondo.slice(0, 3);
  return [0, 1, 2].map((i) => frente[i] * a + fondo[i] * (1 - a));
}

function saturacion([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/* --- la medicion dentro de la pagina ------------------------------------- */

const MEDIR = `(() => {
  const parse = (str) => {
    const m = String(str).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
  };
  const saturacion = (rgb) => {
    const max = Math.max(rgb[0], rgb[1], rgb[2]), min = Math.min(rgb[0], rgb[1], rgb[2]);
    return max === 0 ? 0 : (max - min) / max;
  };
  const vis = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const textoPropio = (el) => Array.from(el.childNodes)
    .filter(n => n.nodeType === 3 && n.textContent.trim().length)
    .map(n => n.textContent.trim()).join(' ');

  const fondoEfectivo = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      const bg = s.backgroundColor;
      const m = bg.match(/rgba?\\(([^)]+)\\)/);
      if (m) {
        const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(Number);
        const alfa = p[3] === undefined ? 1 : p[3];
        if (alfa > 0.95) return [p[0], p[1], p[2], 1];
      }
      n = n.parentElement;
    }
    return [255, 255, 255, 1];
  };

  const out = { contrastes: [], tipografia: {}, encabezados: [], parrafos: [], objetivos: [], invisibles: [], alt: [], espacio: [], color: {} };

  // texto con contraste
  const nodos = Array.from(document.querySelectorAll('p, span, a, li, h1, h2, h3, h4, h5, h6, button, td, th, dt, dd, code, label, figcaption, blockquote, strong, em'));
  for (const el of nodos) {
    if (!vis(el)) continue;
    const propio = textoPropio(el);
    if (!propio) continue;
    const s = getComputedStyle(el);
    const color = parse(s.color);
    if (!color) continue;
    const fondo = fondoEfectivo(el);
    const r = el.getBoundingClientRect();
    const tam = parseFloat(s.fontSize);
    const peso = parseInt(s.fontWeight, 10) || 400;
    const grande = tam >= 24 || (tam >= 18.66 && peso >= 700);
    out.contrastes.push({
      tag: el.tagName.toLowerCase(),
      clase: String(el.className || '').slice(0, 48),
      texto: propio.slice(0, 60),
      tam, peso, grande,
      color: s.color,
      fondo: 'rgb(' + fondo.slice(0,3).join(',') + ')',
      alpha: color[3],
      grande_umbral: grande ? 3.0 : 4.5,
      x: Math.round(r.x), y: Math.round(r.y)
    });
  }

  // tipografia
  const fam = new Set();
  const estilos = ['h1','h2','h3','h4','p'];
  for (const tag of estilos) {
    const el = document.querySelector(tag);
    if (!el) continue;
    const s = getComputedStyle(el);
    fam.add(s.fontFamily.split(',')[0].replace(/["']/g, '').trim());
    out.tipografia[tag] = { px: parseFloat(s.fontSize), familia: s.fontFamily.split(',')[0].replace(/["']/g,'').trim(), peso: s.fontWeight, espaciado: s.letterSpacing };
  }
  out.tipografia.familias = Array.from(fam);

  // jerarquia de encabezados
  for (const h of Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))) {
    out.encabezados.push({ nivel: Number(h.tagName[1]), texto: h.textContent.trim().slice(0, 60) });
  }

  // lineas por parrafo y longitud de linea.
  // Las lineas se cuentan por altura dividida entre el interlineado, no por
  // getClientRects: con hijos inline (un terminal lleno de spans) el Range
  // devuelve un rect por span, no por linea, y la longitud de linea sale
  // inventada.
  for (const p of Array.from(document.querySelectorAll('p, li'))) {
    if (!vis(p)) continue;
    const t = textoPropio(p);
    if (!t || t.length < 40) continue;
    const s = getComputedStyle(p);
    const r = p.getBoundingClientRect();
    const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.4;
    const lineas = Math.max(1, Math.round(r.height / lh));
    out.parrafos.push({
      texto: t.slice(0, 50),
      caracteres: t.length,
      lineas,
      caracteres_por_linea: Math.round(t.length / lineas),
      ancho_px: Math.round(r.width),
      fuente_px: parseFloat(s.fontSize),
      interlineado: Math.round(lh * 100) / 100
    });
  }

  // objetivos tactiles: 24 px por WCAG 2.2 SC 2.5.8 (nivel AA). 44 px es
  // recomendacion de plataforma movil, mas estricta: se mide aparte.
  // Excepcion de espaciado (la misma del estandar): un objetivo menor de
  // 24 px cumple si el espacio libre alrededor permite un circulo de 24 px
  // de diametro sin pisar otro objetivo.
  const interactivos = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role=button]'))
    .filter(vis)
    .map(function (el) {
      const r = el.getBoundingClientRect();
      return { el: el, r: r, tag: el.tagName.toLowerCase(), texto: (el.textContent || '').trim().slice(0, 40), enParrafo: !!el.closest('p, li, dd, dt, figcaption, blockquote') };
    });
  for (const it of interactivos) {
    const r = it.r;
    if (r.width < 2 || r.height < 2) continue;
    if (it.enParrafo && it.tag === 'a') continue;
    const centroX = r.left + r.width / 2, centroY = r.top + r.height / 2;
    const circulo = { left: centroX - 12, right: centroX + 12, top: centroY - 12, bottom: centroY + 12 };
    let chocan = 0;
    for (const otro of interactivos) {
      if (otro === it) continue;
      const o = otro.r;
      if (o.left < circulo.right && o.right > circulo.left && o.top < circulo.bottom && o.bottom > circulo.top) chocan++;
    }
    const nivel = (r.height < 24 || r.width < 24) ? (chocan === 0 ? 'espaciado-24' : 'incumple-24') : (r.height < 44 || r.width < 44 ? 'recomendado-44' : 'ok');
    if (nivel !== 'ok') {
      out.objetivos.push({ tag: it.tag, texto: it.texto, w: Math.round(r.width), h: Math.round(r.height), nivel: nivel, vecinos_en_24px: chocan });
    }
  }

  // invisibles (bloques con reveal que siguen ocultos)
  for (const el of Array.from(document.querySelectorAll('[data-reveal]'))) {
    const s = getComputedStyle(el);
    const op = parseFloat(s.opacity);
    if (op < 0.99) {
      const r = el.getBoundingClientRect();
      out.invisibles.push({ clase: String(el.className).slice(0, 40), opacidad: op, arriba: Math.round(r.top), visible_en_pantalla: r.top < innerHeight && r.bottom > 0 });
    }
  }

  // texto alternativo
  for (const img of Array.from(document.querySelectorAll('img'))) {
    if (!img.hasAttribute('alt')) out.alt.push({ src: (img.getAttribute('src') || '').slice(-50) });
  }

  // ritmo vertical entre secciones
  const secciones = Array.from(document.querySelectorAll('main > section, main > div > section, section'));
  let anterior = null;
  for (const s of secciones) {
    const r = s.getBoundingClientRect();
    if (r.height < 40) continue;
    const cs = getComputedStyle(s);
    out.espacio.push({
      margen_superior: Math.round(parseFloat(cs.marginTop) || 0),
      padding_superior: Math.round(parseFloat(cs.paddingTop) || 0),
      alto: Math.round(r.height),
      separacion_anterior: anterior === null ? null : Math.round(r.top - anterior),
      texto: (s.textContent || '').trim().slice(0, 34)
    });
    anterior = r.bottom;
  }

  // color: acentos de MARCA y peso aproximado del acento.
  // Los colores de estado (verde de ok, ambar de aviso) no son acentos de
  // marca: son tokens separados y aceptados por la decision de diseno. Se
  // excluyen para que la regla E-01 mida lo que dice medir.
  const tokens = getComputedStyle(document.documentElement);
  const hexARgb = (v) => {
    const m = String(v || '').match(/#([0-9a-fA-F]{6})/);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };
  // Los colores de estado (verde de ok, ambar de aviso) y los fondos del
  // tema no son acentos de marca: son tokens separados y aceptados por la
  // decision de diseno. Se comparan en RGB, no como cadena.
  const excluidos = [
    '--color-status-online', '--color-status-warn', '--color-status-error',
    '--bg-base', '--bg-surface', '--bg-muted'
  ].map(function (k) { return hexARgb(tokens.getPropertyValue(k)); }).filter(Boolean);
  const cuenta = new Map();
  let areaTotal = 0, areaAcento = 0;
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    if (!vis(el)) continue;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const area = r.width * r.height;
    areaTotal += area;
    const col = parse(s.color);
    if (!col) continue;
    const sat = saturacion(col.slice(0, 3));
    if (sat > 0.35) {
      // Los indicadores de estado son tokens de funcion, no acento de
      // marca. Se identifican por su clase: no por su valor, porque
      // Tailwind v4 normaliza los tokens de @theme a oklch y no se pueden
      // comparar como hexadecimal.
      if (/status-(online|warn|error|danger)/.test(String(el.className || ''))) continue;
      const clave = s.color;
      cuenta.set(clave, (cuenta.get(clave) || 0) + 1);
      areaAcento += area;
    }
  }
  // familias de tono: dos pasos del mismo tono (relleno e tinta) son una
  // familia, no dos acentos. Se agrupa por hue en cubos de 20 grados.
  const hue = (rgb) => {
    const [r, g, b] = rgb.map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d === 0) return 0;
    let h;
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
    return h;
  };
  const familia = new Map();
  for (const [color, n] of cuenta) {
    const c = parse(color);
    if (!c) continue;
    const rgb = c.slice(0, 3);
    if (excluidos.some(function (e) { return e[0] === rgb[0] && e[1] === rgb[1] && e[2] === rgb[2]; })) continue;
    const h = hue(rgb);
    const cubo = Math.round(h / 20) % 18;
    if (!familia.has(cubo)) familia.set(cubo, []);
    familia.get(cubo).push({ color, nodos: n });
  }
  out.color.acentes = Array.from(cuenta.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([color, n]) => ({ color, nodos: n }));
  out.color.excluidos = excluidos;
  out.color.familias_acento = Array.from(familia.entries()).map(([cubo, items]) => ({ cubo_hue: cubo * 20, pasos: items }));
  out.color.peso_acento_pct = areaTotal > 0 ? Math.round((areaAcento / areaTotal) * 1000) / 10 : 0;
  out.color.fondo_cuerpo = getComputedStyle(document.body).backgroundColor;

  // desbordes
  out.desborde = { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
  out.desborde.elementos = Array.from(document.querySelectorAll('body *')).filter(el => {
    const r = el.getBoundingClientRect();
    return r.right > window.innerWidth + 1 || r.left < -1;
  }).slice(0, 12).map(el => ({ tag: el.tagName.toLowerCase(), clase: String(el.className).slice(0, 36), right: Math.round(el.getBoundingClientRect().right) }));

  // reglas de animacion de entrada
  out.movimiento = { reglas: [], oculta_con_opacity: false };
  for (const ss of Array.from(document.styleSheets)) {
    let reglas = [];
    try { reglas = Array.from(ss.cssRules || []); } catch (_) { continue; }
    const caminar = (rs) => {
      for (const r of rs) {
        if (r.selectorText && r.selectorText.includes('data-reveal')) {
          const op = (r.style.opacity || '').trim();
          const tr = (r.style.transform || '').trim();
          const an = (r.style.animationName || '').trim();
          out.movimiento.reglas.push({ selector: r.selectorText, opacity: op, transform: tr, animation: an });
          if (op && parseFloat(op) < 0.99 && !r.selectorText.includes('is-revealed')) out.movimiento.oculta_con_opacity = true;
          if (op && parseFloat(op) < 0.99 && r.selectorText.includes('is-revealed')) out.movimiento.oculta_con_opacity = true;
        }
        if (r.cssRules) caminar(r.cssRules);
      }
    };
    caminar(reglas);
  }

  // foco visible
  out.foco = { focus_visible: false, outline: null };
  for (const ss of Array.from(document.styleSheets)) {
    let reglas = [];
    try { reglas = Array.from(ss.cssRules || []); } catch (_) { continue; }
    const caminar = (rs) => {
      for (const r of rs) {
        if (r.selectorText && r.selectorText.includes('focus-visible')) {
          out.foco.focus_visible = true;
          out.foco.outline = (r.style.outline || '').trim() || null;
        }
        if (r.cssRules) caminar(r.cssRules);
      }
    };
    caminar(reglas);
  }

  // cifras destacadas: los numeros que la pagina exhibe (clase tabular-nums).
  // Su tamano es parte de la escala visual: si dos tiras usan tamanos
  // distintos, la escala de cifras esta rota.
  out.cifras = Array.from(document.querySelectorAll('dd, span, div')).filter(function (el) {
    const t = (el.textContent || '').trim();
    return /tabular-nums/.test(String(el.className || '')) && t.length <= 14 && /\\d/.test(t);
  }).map(function (el) {
    const s = getComputedStyle(el);
    return { valor: el.textContent.trim(), px: parseFloat(s.fontSize), clase: String(el.className).slice(0, 56) };
  });

  // clase del elemento, util para agrupar los fallos de contraste
  return JSON.stringify(out);
})()`;

/* --- el bucle de medicion ------------------------------------------------- */

const args = parseArgs(process.argv);
if (!args.urls.length) {
  console.error('falta --url');
  process.exit(2);
}
const { chromium } = loadPlaywright(args.cwd);

const navegador = await chromium.launch({ headless: true });
const resultados = [];
const TEMAS = (process.env.PULIDO_TEMAS || 'dark,light').split(',').map((t) => t.trim()).filter(Boolean);
// dos anchos: escritorio y movil. El objetivo tactil de 44 px se exige en
// movil; en escritorio un enlace de navegacion de 20 px de alto no es un
// defecto, asi que la severidad depende del ancho medido.
const ANCHOS = (process.env.PULIDO_ANCHOS || String(args.ancho) + ',390').split(',').map((n) => Number(n.trim()));

for (const url of args.urls) {
 for (const tema of TEMAS) {
  for (const ancho of ANCHOS) {
  const alto = ancho < 500 ? 844 : args.alto;
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, colorScheme: tema, deviceScaleFactor: ancho < 500 ? 3 : 1 });
  const pagina = await ctx.newPage();
  const erroresConsola = [];
  pagina.on('console', (m) => { if (m.type() === 'error') erroresConsola.push(m.text().slice(0, 160)); });
  pagina.on('pageerror', (e) => erroresConsola.push('pageerror: ' + String(e).slice(0, 140)));

  let bruto = null;
  try {
    await pagina.goto(url, { waitUntil: 'load', timeout: 45000 });
    await pagina.waitForTimeout(900);
    bruto = JSON.parse(await pagina.evaluate(MEDIR));
  } catch (e) {
    resultados.push({ url, tema, ancho, error: String(e.message || e).slice(0, 220) });
    await ctx.close();
    continue;
  }

  // resumen determinista
  const fallosContraste = bruto.contrastes.filter((c) => {
    const f = parseRGB(c.fondo);
    if (!f) return false;
    const eff = c.alpha < 0.999 ? componer(parseRGB(c.color), f) : parseRGB(c.color);
    const ratio = contraste(eff, f.slice(0, 3));
    return ratio < c.grande_umbral;
  }).map((c) => {
    const f = parseRGB(c.fondo);
    const eff = c.alpha < 0.999 ? componer(parseRGB(c.color), f) : parseRGB(c.color);
    return { tag: c.tag, clase: c.clase, texto: c.texto, tam: c.tam, ratio: Math.round(contraste(eff, f.slice(0, 3)) * 100) / 100, umbral: c.grande_umbral, color: c.color, fondo: c.fondo };
  });

  const longLineas = bruto.parrafos.filter((p) => p.caracteres_por_linea < 25 || p.caracteres_por_linea > 95);

  resultados.push({
    url,
    tema,
    ancho,
    movil: ancho < 500,
    medido_en: new Date().toISOString(),
    viewport: { ancho, alto },
    titulo: await pagina.title(),
    contraste: { total: bruto.contrastes.length, fallos: fallosContraste.length, detalle: fallosContraste.slice(0, 40) },
    tipografia: bruto.tipografia,
    cifras_destacadas: bruto.cifras,
    encabezados: bruto.encabezados,
    saltos_encabezado: bruto.encabezados.filter((h, i) => i > 0 && h.nivel - bruto.encabezados[i - 1].nivel > 1).map((h) => h.texto),
    parrafos: { total: bruto.parrafos.length, fuera_de_rango: longLineas.length, detalle: bruto.parrafos.slice(0, 80) },
    objetivos_tactiles: { total: bruto.objetivos.length, detalle: bruto.objetivos.slice(0, 20) },
    invisibles: { total: bruto.invisibles.length, detalle: bruto.invisibles.slice(0, 20) },
    imagenes_sin_alt: bruto.alt.length,
    espacio: bruto.espacio,
    color: bruto.color,
    desborde: bruto.desborde,
    movimiento: bruto.movimiento,
    foco: bruto.foco,
    errores_consola: erroresConsola.slice(0, 10),
  });

  await ctx.close();
  }
 }
}

await navegador.close();

const salida = { herramienta: 'auditor-estetico', version: '1.0.0', generado: new Date().toISOString(), resultados };
const texto = JSON.stringify(salida, null, 2);
if (args.salida) {
  writeFileSync(resolve(args.salida), texto, 'utf8');
  console.log('escrito: ' + resolve(args.salida));
} else {
  console.log(texto);
}
