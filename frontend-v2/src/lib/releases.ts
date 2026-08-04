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

// Static fallback — last known-good releases (2026-08-04).
// Updated manually only when the API fetch fails at build time.
const FALLBACK_RELEASES: Release[] = [
  {
    tag_name: "v2.11.0",
    published_at: "2026-08-04T17:25:32Z",
    name: "v2.11.0",
    body: "Release estable: Error Observatory durable, de-hardcoding de herramientas, LLM-as-judge flexible (timeouts + retries + consensus paralelo). 49 herramientas canónicas, schema v25.",
    html_url: "https://github.com/Opita-Code/dark-memory-mcp/releases/tag/v2.11.0",
  },
  {
    tag_name: "v2.9.3-alpha",
    published_at: "2026-08-03T14:47:58Z",
    name: "v2.9.3-alpha",
    body: "Wave 5C DelegationRouter MVP + fix de sweeper (sesiones ya no mueren a los 5 min).",
    html_url: "https://github.com/Opita-Code/dark-memory-mcp/releases/tag/v2.9.3-alpha",
  },
  {
    tag_name: "v2.9.2-alpha",
    published_at: "2026-08-03T13:16:41Z",
    name: "v2.9.2-alpha",
    body: "Hardening de sesiones: closing_soon warning antes del cierre por inactividad.",
    html_url: "https://github.com/Opita-Code/dark-memory-mcp/releases/tag/v2.9.2-alpha",
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
export function excerpt(body: string, maxLen = 220): string {
  const clean = body
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
  return clean.length > maxLen ? clean.slice(0, maxLen - 1) + "…" : clean;
}
