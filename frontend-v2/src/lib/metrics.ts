/**
 * Cifras del proyecto. Fuente única de verdad para las dos versiones de la home.
 *
 * Cada valor viene de una consulta verificable. La fecha importa tanto como el
 * número: un dato sin fecha es una hipótesis.
 *
 * Consulta: 28 de octubre de 2026.
 *   · CI del repositorio `Opita-Code/opita-code` (pruebas, mutantes, juez)
 *   · GitHub API (repos, commits, releases)
 *   · Base local de dark-memory (specs, artefactos, evaluaciones, escrituras)
 */

export interface Metric {
  /** Valor mostrado. */
  v: string;
  /** Qué mide, en una línea. */
  label: Record<'es' | 'en', string>;
  /** De dónde sale y cuándo se consultó. */
  src: Record<'es' | 'en', string>;
}

/** Tira de evidencia bajo el hero. */
export const EVIDENCE: Metric[] = [
  {
    v: '371/371',
    label: { es: 'pruebas en verde', en: 'tests green' },
    src: { es: 'CI · 28-10-2026', en: 'CI · 28-10-2026' },
  },
  {
    v: '207/207',
    label: { es: 'mutantes eliminados · 38 paquetes', en: 'mutants killed · 38 packages' },
    src: { es: 'CI · 28-10-2026', en: 'CI · 28-10-2026' },
  },
  {
    v: '64/64',
    label: { es: 'partes de 51 documentos conformes', en: 'parts of 51 documents compliant' },
    src: { es: 'juez · 28-10-2026', en: 'judge · 28-10-2026' },
  },
  {
    v: '990',
    label: { es: 'specs creadas', en: 'specs created' },
    src: { es: 'base dark-memory · 28-10-2026', en: 'dark-memory store · 28-10-2026' },
  },
  {
    v: '605',
    label: { es: 'artefactos publicados', en: 'artifacts published' },
    src: { es: 'base dark-memory · 28-10-2026', en: 'dark-memory store · 28-10-2026' },
  },
  {
    v: '1.078',
    label: { es: 'evaluaciones del juez', en: 'judge evaluations' },
    src: { es: 'base dark-memory · 28-10-2026', en: 'dark-memory store · 28-10-2026' },
  },
];

/** Tira interna de la sección del kernel. */
export const KERNEL: Metric[] = [
  {
    v: '73',
    label: { es: 'herramientas canónicas · 20 namespaces', en: 'canonical tools · 20 namespaces' },
    src: { es: 'dark-memory v4.0.0-alpha.32', en: 'dark-memory v4.0.0-alpha.32' },
  },
  {
    v: '32',
    label: { es: 'versión de esquema', en: 'schema version' },
    src: { es: 'migración aplicada', en: 'migration applied' },
  },
  {
    v: '38',
    label: { es: 'releases publicados', en: 'releases published' },
    src: { es: 'GitHub · 28-10-2026', en: 'GitHub · 28-10-2026' },
  },
  {
    v: '419',
    label: { es: 'commits en el servidor de memoria', en: 'commits in the memory server' },
    src: { es: 'GitHub · 28-10-2026', en: 'GitHub · 28-10-2026' },
  },
  {
    v: '1.494',
    label: { es: 'escrituras auditadas', en: 'audited writes' },
    src: { es: 'write_audit · 28-10-2026', en: 'write_audit · 28-10-2026' },
  },
];

/** Estado real de los subdominios, verificado el 28-10-2026. */
export type SurfaceState = 'live' | 'building';

export const SURFACE_LABELS: Record<SurfaceState, Record<'es' | 'en', string>> = {
  live: { es: 'en vivo', en: 'live' },
  building: { es: 'en construcción', en: 'in development' },
};
