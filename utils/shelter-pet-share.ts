/** Тексты для «Поделиться» профилем питомца приюта (не объявление lost/found). */

export type ShelterPetShareBundle = {
  url: string;
  textForMessenger: string;
  textFull: string;
  vkTitle: string;
};

export function buildShelterPetShareBundle(params: {
  petId: string;
  title: string;
  animalLabel: string;
  breedParen: string;
  city: string;
  statusLabel: string;
  shelterName?: string | null;
  description: string;
  headline: string;
  lineTemplate: string;
  shelterPrefix: string;
  moreOn: string;
  cta: string;
  origin: string;
}): ShelterPetShareBundle {
  const base = params.origin.replace(/\/$/, '');
  const url = `${base}/shelter-pet/${params.petId}`;
  const shelterFrag = params.shelterName?.trim()
    ? `\n${params.shelterPrefix}: ${params.shelterName.trim()}`
    : '';
  const line = params.lineTemplate
    .replace('{title}', params.title)
    .replace('{animal}', params.animalLabel)
    .replace('{breed}', params.breedParen)
    .replace('{city}', params.city)
    .replace('{status}', params.statusLabel)
    .replace('{shelter}', shelterFrag);
  const desc = params.description.trim();
  const textForMessenger = [params.headline, '', line, desc ? `\n${desc}` : ''].join('\n').trim();
  const textFull = [params.headline, '', line, '', desc, '', `${params.moreOn} ${url}`, '', params.cta]
    .filter((chunk) => chunk !== '')
    .join('\n');
  return { url, textForMessenger, textFull, vkTitle: params.headline };
}
