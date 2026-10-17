import { describe, expect, it } from 'vitest';
import { displayPhotoUrl } from './display-photo-url';

describe('displayPhotoUrl', () => {
  it('добавляет ширину к файлу из uploads', () => {
    expect(displayPhotoUrl('/uploads/profile-pet-a.jpg', 640)).toBe('/uploads/profile-pet-a.jpg?w=640');
  });

  it('не трогает внешние картинки и уже заданную ширину', () => {
    expect(displayPhotoUrl('https://images.unsplash.com/photo?w=400', 640)).toBe(
      'https://images.unsplash.com/photo?w=400',
    );
    expect(displayPhotoUrl('/uploads/a.jpg?w=256', 640)).toBe('/uploads/a.jpg?w=256');
  });
});
