/**
 * Пишет public/sitemap.xml.
 * Статические публичные адреса всегда. Объявления, блог и приюты — если API отвечает.
 * Сбой сети не останавливает сборку: в карту попадают только статические адреса.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = (process.env.VITE_SITE_URL || 'https://dorogadomoy.by').replace(/\/+$/, '');
const API = (process.env.SITEMAP_API_ORIGIN || SITE).replace(/\/+$/, '');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/sitemap.xml');

const CITIES = ['Минск', 'Брест', 'Витебск', 'Гомель', 'Гродно', 'Могилёв'];

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

function urlEntry(pathname, priority) {
  return `  <url><loc>${abs(pathname)}</loc><priority>${priority}</priority></url>`;
}

function staticEntries() {
  const entries = [
    urlEntry('/', '1.0'),
    urlEntry('/poisk-propavshih-zhivotnyh/', '0.9'),
    urlEntry('/search', '0.9'),
    urlEntry('/search?status=searching', '0.8'),
    urlEntry('/search?status=found', '0.8'),
    urlEntry('/search?animal=dog&status=searching', '0.7'),
    urlEntry('/search?animal=cat&status=searching', '0.7'),
    urlEntry('/shelters', '0.8'),
    urlEntry('/blog', '0.6'),
    urlEntry('/terms', '0.3'),
    urlEntry('/privacy', '0.3'),
  ];
  for (const city of CITIES) {
    const q = encodeURIComponent(city);
    entries.push(urlEntry(`/search?city=${q}`, '0.7'));
    entries.push(urlEntry(`/search?city=${q}&status=searching`, '0.6'));
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
    return rows.filter((pet) => pet?.id).map((pet) => urlEntry(petPath(pet), '0.5'));
  });

  const shelterPets = await collect('питомцы приютов', async () => {
    const rows = await fetchPaged('/api/v1/pets', { pet_scope: 'shelter_pet' });
    return rows
      .filter((pet) => pet?.id)
      .map((pet) => urlEntry(`/shelter-pet/${encodeURIComponent(pet.id)}`, '0.4'));
  });

  const shelters = await collect('приюты', async () => {
    const rows = await fetchPaged('/api/v1/shelters', {});
    return rows
      .filter((shelter) => shelter?.id)
      .map((shelter) => urlEntry(`/shelters/${encodeURIComponent(shelter.id)}`, '0.5'));
  });

  const posts = await collect('блог', async () => {
    const rows = await fetchPaged('/api/v1/blog/posts', {}, 200);
    return rows
      .filter((post) => post?.slug)
      .map((post) => urlEntry(`/blog/${encodeURIComponent(post.slug)}`, '0.5'));
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
