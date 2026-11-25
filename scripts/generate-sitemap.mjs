/**
 * Пишет public/sitemap.xml.
 * Только канонические индексируемые URL (без filter/query-дублей).
 * Объявления, блог и приюты — если API отвечает.
 * Сбой сети не останавливает сборку: в карту попадают только статические адреса.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = (process.env.VITE_SITE_URL || 'https://doragadomoy.by').replace(/\/+$/, '');
const API = (process.env.SITEMAP_API_ORIGIN || SITE).replace(/\/+$/, '');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/sitemap.xml');

const CITIES = [
  { name: 'Минск', slug: 'minsk' },
  { name: 'Брест', slug: 'brest' },
  { name: 'Витебск', slug: 'vitebsk' },
  { name: 'Гомель', slug: 'gomel' },
  { name: 'Гродно', slug: 'grodno' },
  { name: 'Могилёв', slug: 'mogilev' },
];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function abs(pathname) {
  return esc(`${SITE}${pathname}`);
}

/** @param {string} pathname @param {string} [lastmod] ISO date */
function urlEntry(pathname, lastmod) {
  const mod = lastmod ? `<lastmod>${esc(lastmod)}</lastmod>` : '';
  return `  <url><loc>${abs(pathname)}</loc>${mod}</url>`;
}

function toLastmod(value) {
  if (!value || typeof value !== 'string') return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function staticEntries() {
  const entries = [
    urlEntry('/'),
    urlEntry('/poisk-propavshih-zhivotnyh/'),
    urlEntry('/poisk-propavshej-sobaki/'),
    urlEntry('/poisk-propavshego-kota/'),
    urlEntry('/najdennye-zhivotnye/'),
    urlEntry('/search'),
    urlEntry('/shelters'),
    urlEntry('/blog'),
    urlEntry('/terms'),
    urlEntry('/privacy'),
  ];
  for (const city of CITIES) {
    entries.push(urlEntry(`/city/${city.slug}`));
  }
  return entries;
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function fetchPaged(pathname, extraParams, limit = 500) {
  const items = [];
  for (let page = 0; page < 40; page += 1) {
    const url = new URL(pathname, `${API}/`);
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(page * limit));
    const data = await fetchJson(url);
    const batch = Array.isArray(data) ? data : (data.items ?? []);
    items.push(...batch);
    const total = Array.isArray(data) ? null : data.total;
    if (batch.length < limit) break;
    if (total != null && items.length >= total) break;
  }
  return items;
}

function petPath(pet) {
  const id = encodeURIComponent(pet.id);
  return pet.pet_scope === 'shelter_pet' ? `/shelter-pet/${id}` : `/pet/${id}`;
}

function petLastmod(pet) {
  return toLastmod(pet.updated_at || pet.published_at || pet.created_at);
}

async function collect(label, load) {
  try {
    const entries = await load();
    console.log(`sitemap: ${label} — ${entries.length}`);
    return entries;
  } catch (error) {
    console.warn(`sitemap: ${label} пропущен (${error instanceof Error ? error.message : error})`);
    return [];
  }
}

async function dynamicEntries() {
  const pets = await collect('объявления', async () => {
    const rows = await fetchPaged('/api/v1/pets', {
      moderation_status: 'approved',
      is_archived: 'false',
    });
    return rows
      .filter((pet) => pet?.id && pet.pet_scope !== 'shelter_pet')
      .map((pet) => urlEntry(petPath(pet), petLastmod(pet)));
  });

  const shelterPets = await collect('питомцы приютов', async () => {
    const rows = await fetchPaged('/api/v1/pets', { pet_scope: 'shelter_pet' });
    return rows
      .filter((pet) => pet?.id)
      .map((pet) => urlEntry(`/shelter-pet/${encodeURIComponent(pet.id)}`, petLastmod(pet)));
  });

  const shelters = await collect('приюты', async () => {
    const rows = await fetchPaged('/api/v1/shelters', {});
    return rows
      .filter((shelter) => shelter?.id)
      .map((shelter) =>
        urlEntry(
          `/shelters/${encodeURIComponent(shelter.id)}`,
          toLastmod(shelter.updated_at || shelter.created_at),
        ),
      );
  });

  const posts = await collect('блог', async () => {
    const rows = await fetchPaged('/api/v1/blog/posts', {}, 200);
    return rows
      .filter((post) => post?.slug)
      .map((post) =>
        urlEntry(
          `/blog/${encodeURIComponent(post.slug)}`,
          toLastmod(post.updated_at || post.published_at || post.created_at),
        ),
      );
  });

  return [...pets, ...shelterPets, ...shelters, ...posts];
}

const staticUrls = staticEntries();
let dynamicUrls = [];
try {
  dynamicUrls = await dynamicEntries();
  console.log(`sitemap: статических ${staticUrls.length}, из API ${dynamicUrls.length}`);
} catch (error) {
  console.warn(`sitemap: API недоступен (${error instanceof Error ? error.message : error}), только статические адреса`);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...dynamicUrls].join('\n')}
</urlset>
`;

await writeFile(OUT, xml, 'utf8');
console.log(`sitemap: ${OUT}`);
