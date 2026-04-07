/** Транслитерация заголовка в slug для URL блога (латиница, дефисы). */

const CYRILLIC: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  і: 'i',
  ї: 'yi',
  є: 'ye',
  ґ: 'g',
  ў: 'u',
};

export function titleToBlogSlug(title: string, maxLen = 120): string {
  let out = '';
  for (const ch of title) {
    const lower = ch.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(CYRILLIC, lower)) {
      out += CYRILLIC[lower];
      continue;
    }
    if (/[a-z0-9]/.test(ch)) {
      out += ch.toLowerCase();
      continue;
    }
    if (/[\s\-_./,:;—–'"«»()!?]+/.test(ch) || ch === '\n' || ch === '\t') {
      out += '-';
    }
  }
  out = out.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (out.length > maxLen) {
    out = out.slice(0, maxLen).replace(/-+$/, '');
  }
  return out;
}
