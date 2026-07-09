import { describe, expect, it } from 'vitest';
import { AI_PHOTO_ANALYZE_LIMIT, pickBestPhotoForAi, pickPhotosForAi } from './ai-photo-analyze';

describe('pickPhotosForAi', () => {
  it('returns up to AI_PHOTO_ANALYZE_LIMIT photos', () => {
    const photos = ['a', 'bb', 'ccc', 'dddd'];
    expect(pickPhotosForAi(photos).length).toBe(AI_PHOTO_ANALYZE_LIMIT);
    expect(pickPhotosForAi(photos)).toEqual(['dddd', 'ccc', 'bb']);
  });

  it('prefers data URLs over remote paths', () => {
    const photos = ['https://x/small.jpg', 'data:image/jpeg;base64,AAAA'];
    expect(pickPhotosForAi(photos)[0]).toBe('data:image/jpeg;base64,AAAA');
  });

  it('pickBestPhotoForAi returns first ranked photo', () => {
    expect(pickBestPhotoForAi(['short', 'much-longer-photo'])).toBe('much-longer-photo');
  });
});
