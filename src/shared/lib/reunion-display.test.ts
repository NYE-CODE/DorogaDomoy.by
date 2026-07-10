import { describe, expect, it } from 'vitest';
import {
  buildReunionAttributeRows,
  reunionConfidence,
} from '@/shared/lib/reunion-display';

const labels = {
  breed: 'Порода',
  colors: 'Окрас',
  gender: 'Пол',
  age: 'Возраст',
  city: 'Город',
  colorMap: { black: 'Чёрный', white: 'Белый' } as Record<string, string>,
  genderMap: { male: 'Самец', female: 'Самка', unknown: 'Неизвестно' } as Record<string, string>,
  notSpecified: 'Не указано',
};

describe('reunionConfidence', () => {
  it('maps percent to confidence tiers', () => {
    expect(reunionConfidence(85)).toBe('high');
    expect(reunionConfidence(70)).toBe('medium');
    expect(reunionConfidence(52)).toBe('review');
  });
});

describe('buildReunionAttributeRows', () => {
  it('marks aligned breed and overlapping colors', () => {
    const rows = buildReunionAttributeRows(
      {
        breed: 'Лабрадор',
        colors: ['black'],
        gender: 'male',
        approximateAge: 'менее 2 года',
        city: 'Минск',
      },
      {
        breed: 'лабрадор',
        colors: ['black', 'white'],
        gender: 'male',
        approximateAge: 'менее 2 года',
        city: 'Минск',
      },
      labels,
    );
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.aligned]));
    expect(byKey.breed).toBe(true);
    expect(byKey.colors).toBe(true);
    expect(byKey.gender).toBe(true);
    expect(byKey.age).toBe(true);
    expect(byKey.city).toBe(true);
  });
});
