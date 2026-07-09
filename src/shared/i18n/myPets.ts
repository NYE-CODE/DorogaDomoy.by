/** My pets profile strings (ru / be / en) — композиция из модулей my-pets/*. */
import { myPetsFormLocales } from './my-pets/form';
import { myPetsListLocales } from './my-pets/list';
import { myPetsOwnerProfileLocales } from './my-pets/owner-profile';

export const myPetsLocales = {
  ru: {
    ...myPetsListLocales.ru,
    ownerProfile: myPetsOwnerProfileLocales.ru,
    form: myPetsFormLocales.ru,
  },
  be: {
    ...myPetsListLocales.be,
    ownerProfile: myPetsOwnerProfileLocales.be,
    form: myPetsFormLocales.be,
  },
  en: {
    ...myPetsListLocales.en,
    ownerProfile: myPetsOwnerProfileLocales.en,
    form: myPetsFormLocales.en,
  },
} as const;
