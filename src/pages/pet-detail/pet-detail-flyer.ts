import type { Pet } from '@/entities/pet/model/types';
import type { Locale } from '@/shared/i18n/translations';
import { buildPetFlyerCss } from '@/shared/lib/pet-flyer-styles';
import { petScenarioFlyerColors } from '@/shared/lib/pet-helpers';
import { escapeHtml, getSafeImageUrl } from './pet-detail-helpers';
import type { PetDetailT } from './pet-detail-archive-badge';

const flyerPrintScript =
  '<script>(function(){function p(){setTimeout(function(){window.focus();window.print();},300);}' +
  'var imgs=document.getElementsByTagName("img"),i,img,n=0;' +
  'for(i=0;i<imgs.length;i++){if(!imgs[i].complete)n++;}' +
  'if(!n){p();return;}' +
  'var l=n;' +
  'for(i=0;i<imgs.length;i++){img=imgs[i];if(img.complete)continue;' +
  'img.onload=img.onerror=function(){if(!--l)p();};}' +
  '})();<\/script>';

function openFlyer(html: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  w.document.write(html);
  w.document.close();
}

function buildFlyerDocument(
  bodyInner: string,
  flyerLang: string,
  flyerDocTitle: string,
  flyerCommonStyles: string,
) {
  return `<!DOCTYPE html><html lang="${flyerLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${flyerDocTitle}</title><style>${flyerCommonStyles}</style></head><body><main class="sheet">${bodyInner}</main>${flyerPrintScript}</body></html>`;
}

export function createPetFlyerHandlers(
  pet: Pet,
  t: PetDetailT,
  locale: Locale,
  onCloseModal: () => void,
) {
  const petUrl = `${window.location.origin}/pet/${pet.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(petUrl)}`;
  const safePhotoUrl = getSafeImageUrl(pet.photos[0]);
  const flyerIsLost = pet.status === 'searching';
  const flyerAuthorName = escapeHtml(pet.authorName);
  const flyerScenario = flyerIsLost ? 'lost' : 'found';
  const flyerPalette = petScenarioFlyerColors[flyerScenario];
  const flyerTitle = escapeHtml(flyerIsLost ? t.petDetail.lostPet : t.petDetail.foundPet);
  const flyerSubtitle = escapeHtml(`${pet.city} ? ${t.pet.animalType[pet.animalType]}`);
  const flyerBreed = escapeHtml(pet.breed || t.pet.notSpecified);
  const flyerColors = escapeHtml(pet.colors.map((c) => t.pet.color[c]).join(', '));
  const flyerGender = escapeHtml(t.pet.gender[pet.gender]);
  const flyerAge = pet.approximateAge ? escapeHtml(pet.approximateAge) : null;
  const flyerDescription = escapeHtml(pet.description);
  const flyerContactPhone = escapeHtml(pet.contacts.phone || t.petDetail.seeContacts);
  const qrLabel = escapeHtml(t.petDetail.moreOnSite);
  const callAnytimeLabel = escapeHtml(t.petDetail.callAnytime);
  const flyerDocTitle = escapeHtml(`DorogaDomoy.by ? ${pet.city}`);
  const flyerLang = escapeHtml(locale);
  const flyerCommonStyles = buildPetFlyerCss({
    accent: flyerPalette.accent,
    soft: flyerPalette.soft,
    border: flyerPalette.border,
  });

  const flyerHeaderHtml = `
    <header class="flyer-header">
      <div class="brand-strip">DorogaDomoy.by</div>
      <h1 class="title">${flyerTitle}</h1>
      <div class="subtitle">${flyerSubtitle}</div>
    </header>`;

  const flyerPhotoHtml = `
    <div class="photo-area">
      <img src="${safePhotoUrl}" class="photo" alt="" decoding="async" loading="eager" />
    </div>`;

  const flyerDetailsStart = `
    <div class="flyer-details">
    <div class="info-grid">
      <div><div class="label">${escapeHtml(t.pet.breedLabel)}</div><div class="value">${flyerBreed}</div></div>
      <div><div class="label">${escapeHtml(t.pet.colorLabel)}</div><div class="value">${flyerColors}</div></div>
      <div><div class="label">${escapeHtml(t.pet.genderLabel)}</div><div class="value">${flyerGender}</div></div>
      ${flyerAge ? `<div><div class="label">${escapeHtml(t.pet.ageLabel)}</div><div class="value">${flyerAge}</div></div>` : ''}
    </div>
    <div class="description">${flyerDescription}</div>`;

  const flyerDetailsEnd = `
    </div>`;

  const handleFlyerClassic = () => {
    onCloseModal();
    openFlyer(
      buildFlyerDocument(
        `
      ${flyerHeaderHtml}
      ${flyerPhotoHtml}
      ${flyerDetailsStart}
      <div class="contact-box">
        <div class="contact-label">${callAnytimeLabel}</div>
        <div class="phone">${flyerContactPhone}</div>
        <div class="author-line">${flyerAuthorName}</div>
      </div>
      ${flyerDetailsEnd}
    `.trim(),
        flyerLang,
        flyerDocTitle,
        flyerCommonStyles,
      ),
    );
  };

  const handleFlyerQR = () => {
    onCloseModal();
    openFlyer(
      buildFlyerDocument(
        `
      ${flyerHeaderHtml}
      ${flyerPhotoHtml}
      ${flyerDetailsStart}
      <div class="contact-qr">
        <div class="left">
          <div class="contact-label">${callAnytimeLabel}</div>
          <div class="phone">${flyerContactPhone}</div>
          <div class="author-line">${flyerAuthorName}</div>
        </div>
        <div class="qr">
          <div class="qr-medallion">
            <span class="qr-medallion-ear"></span>
            <img src="${qrUrl}" alt="" width="112" height="112" decoding="async" loading="eager" />
          </div>
          <div class="qr-label">${qrLabel}</div>
        </div>
      </div>
      ${flyerDetailsEnd}
    `.trim(),
        flyerLang,
        flyerDocTitle,
        flyerCommonStyles,
      ),
    );
  };

  return { handleFlyerClassic, handleFlyerQR };
}
