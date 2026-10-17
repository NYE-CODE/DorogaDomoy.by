import { describe, expect, it } from 'vitest';
import { externalMapWebUrl } from './external-map-links';

describe('externalMapWebUrl', () => {
  const lat = 53.9;
  const lng = 27.56;

  it('puts longitude first in the Yandex pin', () => {
    const url = new URL(externalMapWebUrl('yandex', lat, lng));
    expect(url.host).toBe('yandex.ru');
    expect(url.searchParams.get('pt')).toBe('27.560000,53.900000');
    expect(url.searchParams.get('z')).toBe('16');
  });

  it('puts latitude first in the Google query', () => {
    const url = new URL(externalMapWebUrl('google', lat, lng));
    expect(url.host).toBe('www.google.com');
    expect(url.searchParams.get('query')).toBe('53.900000,27.560000');
    expect(url.searchParams.get('api')).toBe('1');
  });
});
