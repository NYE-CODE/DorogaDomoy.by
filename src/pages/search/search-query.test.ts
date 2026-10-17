import { describe, expect, it } from 'vitest';
import { readSearchPageQuery } from './search-query';

describe('readSearchPageQuery', () => {
  it('возвращает пустой запрос без параметров', () => {
    expect(readSearchPageQuery('')).toEqual({
      cityName: '',
      city: undefined,
      statuses: [],
      animalType: 'all',
    });
  });

  it('находит областной центр и статус пропажи', () => {
    const query = readSearchPageQuery('?city=Минск&status=searching&animal=dog');
    expect(query.cityName).toBe('Минск');
    expect(query.city?.name).toBe('Минск');
    expect(query.statuses).toEqual(['searching']);
    expect(query.animalType).toBe('dog');
  });

  it('сопоставляет Могилев с Могилёвом и отбрасывает неизвестный статус', () => {
    const query = readSearchPageQuery('city=Могилев&status=archived&animal=bird');
    expect(query.city?.name).toBe('Могилёв');
    expect(query.statuses).toEqual([]);
    expect(query.animalType).toBe('all');
  });

  it('сохраняет неизвестный город без координат', () => {
    const query = readSearchPageQuery('?city=Несуществуюск');
    expect(query.cityName).toBe('Несуществуюск');
    expect(query.city).toBeUndefined();
  });
});
