// RSS feed endpoint — GET /feed.xml
// Astro endpoint: must export a GET handler, no frontmatter.
import { getReleases, excerpt } from '../lib/releases';

export async function GET() {
  const releases = await getReleases(10);
  const site = 'https://www.opitacode.com';
  const items = releases
    .map(
      (r) => `  <item>
    <title>${r.tag_name}</title>
    <link>${r.html_url}</link>
    <guid isPermaLink="false">${r.tag_name}</guid>
    <pubDate>${new Date(r.published_at).toUTCString()}</pubDate>
    <description><![CDATA[${excerpt(r.body, 500)}]]></description>
  </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Opita Code — Releases</title>
    <link>${site}</link>
    <description>Releases de los productos open-source de Opita Code.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
