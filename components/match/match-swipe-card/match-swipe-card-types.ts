import type { Pet } from '../../../types/pet';
import type { MatchResult } from '../../../utils/pet-match';

export interface MatchSwipeCardProps {
  pet: Pet;
  match: MatchResult;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
}

export interface MatchSwipeCardHandle {
  pass: () => void;
  like: () => void;
}
