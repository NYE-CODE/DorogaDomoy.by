import type { Pet } from '../types/pet';

/** Поля petDetail для сборки текста «поделиться» (без общих pet.*) */
export type PetShareDict = {
  shareHeadlineLost: string;
  shareHeadlineFound: string;
  shareLostLine: string;
  shareFoundLine: string;
  shareBreedParen: string;
  shareMoreOn: string;
  shareCta: string;
};

export type PetShareBundle = {
  url: string;
  /** Текст для Telegram (ссылка передаётся отдельным параметром url) */
  textForMessenger: string;
  /** Полный пост со ссылкой — буфер, WhatsApp, подпись в Instagram */
  textFull: string;
  /** Короткий текст + ссылка через intent отдельно (X и т.п.) */
  textShort: string;
  /** Заголовок для VK share */
  vkTitle: string;
  /** Комментарий для VK (описание + ссылка) */
  vkComment: string;
};

export function buildPetShareBundle(
  pet: Pet,
  animalLabel: string,
  dict: PetShareDict,
  origin: string,
): PetShareBundle {
  const base = origin.replace(/\/$/, '');
  const url = `${base}/pet/${pet.id}`;

  const breedPart = pet.breed
    ? dict.shareBreedParen.replace(/\{breed\}/g, pet.breed)
    : '';

  const line1 =
    pet.status === 'searching'
      ? dict.shareLostLine
          .replace(/\{animal\}/g, animalLabel)
          .replace(/\{breed\}/g, breedPart)
          .replace(/\{city\}/g, pet.city)
      : dict.shareFoundLine
          .replace(/\{animal\}/g, animalLabel)
          .replace(/\{breed\}/g, breedPart)
          .replace(/\{city\}/g, pet.city);

  const headline =
    pet.status === 'searching' ? dict.shareHeadlineLost : dict.shareHeadlineFound;

  const desc = (pet.description || '').trim();

  const textForMessenger = [headline, '', line1, desc ? `\n${desc}` : ''].join('\n').trim();

  const textFull = [headline, '', line1, '', desc, '', `${dict.shareMoreOn} ${url}`, '', dict.shareCta]
    .filter((chunk) => chunk !== '')
    .join('\n');

  const maxShort = 220;
  let shortBody = line1;
  if (desc) {
    const rest = maxShort - line1.length - 3;
    if (rest > 40) {
      shortBody =
        desc.length <= rest ? `${line1}\n\n${desc}` : `${line1}\n\n${desc.slice(0, rest - 1)}…`;
    }
  }

  const vkComment = [desc || line1, '', `${dict.shareMoreOn} ${url}`, '', dict.shareCta]
    .filter(Boolean)
    .join('\n');

  return {
    url,
    textForMessenger,
    textFull,
    textShort: shortBody,
    vkTitle: headline,
    vkComment,
  };
}
