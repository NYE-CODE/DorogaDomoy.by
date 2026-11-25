/**
 * Пост-деплой проверка SEO (запускать с машины, где доступен прод).
 *
 *   node scripts/seo-smoke.mjs
 *   SITE_URL=https://doragadomoy.by node scripts/seo-smoke.mjs
 */
const SITE = (process.env.SITE_URL || 'https://doragadomoy.by').replace(/\/+$/, '');

const checks = [];

function ok(name, detail = '') {
  checks.push({ name, pass: true, detail });
  console.log(`OK  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  checks.push({ name, pass: false, detail });
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fetchText(path, { method = 'GET', headers = {} } = {}) {
  const res = await fetch(`${SITE}${path}`, {
    method,
    redirect: 'manual',
    headers: { 'User-Agent': 'DorogaDomoySeoSmoke/1.0', ...headers },
    signal: AbortSignal.timeout(20000),
  });
  const text = method === 'HEAD' ? '' : await res.text();
  return { res, text };
}

function assertIncludes(html, needles, label) {
  for (const n of needles) {
    if (!html.includes(n)) {
      fail(label, `нет «${n}»`);
      return false;
    }
  }
  ok(label);
  return true;
}

async function main() {
  console.log(`SEO smoke → ${SITE}\n`);

  // robots + sitemap
  {
    const { res, text } = await fetchText('/robots.txt');
    if (res.status !== 200 || text.trimStart().startsWith('<!')) fail('robots.txt', `status ${res.status}`);
    else if (!text.includes('Sitemap:')) fail('robots.txt', 'нет Sitemap:');
    else ok('robots.txt');
  }
  {
    const { res, text } = await fetchText('/sitemap.xml');
    if (res.status !== 200 || !text.includes('<urlset')) fail('sitemap.xml', `status ${res.status}`);
    else if (text.includes('?city=') || text.includes('status=searching')) fail('sitemap.xml', 'есть filter-дубли');
    else ok('sitemap.xml', `${(text.match(/<url>/g) || []).length} url`);
  }

  // главная
  {
    const { res, text } = await fetchText('/');
    if (res.status !== 200) fail('home status', String(res.status));
    else {
      assertIncludes(text, ['<title>', 'rel="canonical"', 'crawl-fallback', 'application/ld+json'], 'home html');
    }
  }

  // статические гайды
  for (const path of [
    '/poisk-propavshih-zhivotnyh/',
    '/poisk-propavshej-sobaki/',
    '/poisk-propavshego-kota/',
    '/najdennye-zhivotnye/',
  ]) {
    const { res, text } = await fetchText(path);
    if (res.status !== 200) fail(path, `status ${res.status}`);
    else if (!text.includes('<h1')) fail(path, 'нет h1');
    else if (!text.includes('rel="canonical"')) fail(path, 'нет canonical');
    else ok(path);
  }

  // soft 404
  {
    const { res } = await fetchText('/qwerty-ne-suschestvuet-seo-smoke-xyz');
    if (res.status === 404 || res.status === 410) ok('unknown url status', String(res.status));
    else fail('unknown url status', `ожидали 404/410, получили ${res.status} (soft 404?)`);
  }

  // private noindex header (если nginx уже с X-Robots-Tag)
  {
    const { res } = await fetchText('/profile', { method: 'HEAD' });
    const robots = res.headers.get('x-robots-tag') || '';
    if (/noindex/i.test(robots)) ok('X-Robots-Tag /profile', robots);
    else fail('X-Robots-Tag /profile', `заголовок: «${robots || 'нет'}» — проверьте nginx snippet`);
  }

  // bot HTML для города (нужен backend proxy)
  {
    const { res, text } = await fetchText('/city/minsk', {
      headers: { 'User-Agent': 'Googlebot/2.1' },
    });
    if (res.status !== 200) fail('/city/minsk bot', `status ${res.status}`);
    else if (!text.includes('Минск')) fail('/city/minsk bot', 'нет «Минск» в HTML');
    else if (!text.includes('canonical')) fail('/city/minsk bot', 'нет canonical');
    else ok('/city/minsk bot');
  }

  const failed = checks.filter((c) => !c.pass).length;
  console.log(`\nИтого: ${checks.length - failed}/${checks.length} OK`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
