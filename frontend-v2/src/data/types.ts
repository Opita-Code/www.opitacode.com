/**
 * TypeScript types for data/*.json files.
 * Provides autocomplete + type safety when importing in Astro/React components.
 *
 * Usage:
 *   import products from '../data/products.json';
 *   import type { Product } from '../data/types';
 *
 *   const sociedad: Product = products.products[0];
 */

export type ProductStatus = 'live' | 'in_development' | 'internal';
export type ProductColor = 'warm' | 'cool' | 'neutral' | 'corporate';

export interface Product {
  /** Stable identifier, used as React key and slug */
  id: string;
  /** Display name */
  name: string;
  /** URL slug, e.g. for /es/products/{slug} routes */
  slug: string;
  /** Lifecycle status */
  status: ProductStatus;
  /** Short tagline (Spanish) */
  tagline_es: string;
  /** Short tagline (English) */
  tagline_en: string;
  /** Long description (Spanish) */
  description_es: string;
  /** Long description (English) */
  description_en: string;
  /** Public URL (null if in_development) */
  url: string | null;
  /** CTA button label (Spanish) */
  cta_label_es: string;
  /** CTA button label (English) */
  cta_label_en: string;
  /** Optional badge (e.g. "EN DESARROLLO") */
  badge: string | null;
  /** Theme color for card */
  color: ProductColor;
  /** Icon name (Lucide-style) */
  icon: string;
}

export interface ProductsFile {
  products: Product[];
}

export interface EcosystemStat {
  id: string;
  value: string;
  label_es: string;
  label_en: string;
  url: string | null;
  icon: string;
}

export interface EcosystemStatsFile {
  stats: EcosystemStat[];
}

export interface ManifestoPrinciple {
  id: string;
  number: string;
  title_es: string;
  title_en: string;
  body_es: string;
  body_en: string;
}

export interface ManifestoFile {
  title_es: string;
  title_en: string;
  subtitle_es: string;
  subtitle_en: string;
  principles: ManifestoPrinciple[];
}

/** Helper: get the WhatsApp pre-filled message for a given product */
export function whatsappUrlForProduct(product: Product, lang: 'es' | 'en'): string {
  const baseUrl = 'https://wa.me/573126126085';
  const name = product.name;
  const message = lang === 'es'
    ? `Hola Nicolás, me interesa ${name}. ¿Me cuentas más?`
    : `Hi Nicolás, I'm interested in ${name}. Can you tell me more?`;
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

/** Helper: get the CTA URL for a product (URL if live, WhatsApp if in_development) */
export function ctaUrlForProduct(product: Product, lang: 'es' | 'en'): string {
  if (product.url) return product.url;
  return whatsappUrlForProduct(product, lang);
}
