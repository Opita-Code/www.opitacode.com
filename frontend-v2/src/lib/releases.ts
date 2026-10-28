// Releases data loader — build-time fetch from GitHub API with
// static fallback. Used by the blog page and the landing preview.
// T7 of spec 793.

export interface Release {
  tag_name: string;
  published_at: string;
  name: string;
  body: string;
  html_url: string;
}

/**
 * Resumen propio de las releases principales.
 *
 * Las alphas v4 publican su cuerpo como un único enlace de changelog, así que
 * sin este resumen la home mostraría "Full Changelog: https://…" como si fuera
 * la descripción. Cada línea resume commits verificados de la release.
 */
const RELEASE_SUMMARY: Record<string, string> = {
  "v4.0.0-alpha.32":
    "Fundación del compilador vibe-loop, autenticación OAuth (Gemini, Hugging Face Hub) con el juez conectado a los proveedores, bitácora de auditoría v4 y binarios para seis plataformas.",
  "v4.0.0-alpha.31":
    "Reescritura v4: arquitectura canónica, pipeline de veredicto anclado al artefacto, consenso, emisión de auditoría con persistencia de evaluaciones y runtime mínimo de vibe-loop.",
  "v2.20.0":
    "El drift_judge deja de aceptar contenido controlado por el llamador: exige un ArtifactRef, resuelve el artefacto, calcula su SHA-256 y puntúa el veredicto con un proveedor NLI.",
};

/**
 * Static fallback — last known-good releases (2026-10-15).
 * Updated manually only when the API fetch fails at build time.
 */
const FALLBACK_RELEASES: Release[] = [
  {
    tag_name: "v4.0.0-alpha.32",
    published_at: "2026-10-15T02:36:17Z",
    name: "v4.0.0-alpha.32",
    body: RELEASE_SUMMARY["v4.0.0-alpha.32"],
    html_url: "https://github.com/Opita-Code/dark-memory-mcp/releases/tag/v4.0.0-alpha.32",
  },
  {
    tag_name: "v4.0.0-alpha.31",
    published_at: "2026-10-08T20:53:47Z",
    name: "v4.0.0-alpha.31",
    body: RELEASE_SUMMARY["v4.0.0-alpha.31"],
    html_url: "https://github.com/Opita-Code/dark-memory-mcp/releases/tag/v4.0.0-alpha.31",
  },
  {
    tag_name: "v2.20.0",
    published_at: "2026-08-21T15:59:54Z",
    name: "v2.20.0 — artifact-anchored drift_judge",
    body: RELEASE_SUMMARY["v2.20.0"],
    html_url: "https://github.com/Opita-Code/dark-memory-mcp/releases/tag/v2.20.0",
  },
];

const REPO_RELEASES_URL =
  "https://api.github.com/repos/Opita-Code/dark-memory-mcp/releases?per_page=10";

async function fetchReleases(): Promise<Release[]> {
  try {
    const res = await fetch(REPO_RELEASES_URL, {
      headers: { "User-Agent": "opitacode-web", Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return FALLBACK_RELEASES;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return FALLBACK_RELEASES;
    return data.map((r: any) => ({
      tag_name: String(r.tag_name ?? ""),
      published_at: String(r.published_at ?? ""),
      name: String(r.name ?? r.tag_name ?? ""),
      body: String(r.body ?? ""),
      html_url: String(r.html_url ?? ""),
    }));
  } catch {
    return FALLBACK_RELEASES;
  }
}

// Module-level cache so the fetch runs once per build regardless of
// how many pages import this module.
let cache: Release[] | null = null;

export async function getReleases(limit = 6): Promise<Release[]> {
  if (!cache) cache = await fetchReleases();
  return cache.slice(0, limit);
}

// ————— helpers —————

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function formatDate(iso: string, lang: "es" | "en" = "es"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (lang === "en") return d.toISOString().slice(0, 10);
  return `${d.getUTCDate()} ${MONTHS_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function relativeDate(iso: string, lang: "es" | "en" = "es"): string {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays <= 0) return lang === "es" ? "hoy" : "today";
  if (diffDays === 1) return lang === "es" ? "ayer" : "yesterday";
  if (diffDays < 30) return lang === "es" ? `hace ${diffDays} días` : `${diffDays} days ago`;
  return formatDate(iso, lang);
}

// First paragraph of a release body, cleaned of markdown markers.
// When the body is nothing but a changelog link, fall back to the curated
// summary for that tag — otherwise the card would read "Full Changelog: …".
export function excerpt(body: string, maxLen = 220, tag?: string): string {
  const clean = body
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");

  const changelogOnly = /^full changelog/i.test(clean) && clean.length < 160;
  const summary = tag ? RELEASE_SUMMARY[tag] : undefined;
  const text = changelogOnly && summary ? summary : clean;

  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}
