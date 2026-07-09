import { forwardRef, useImperativeHandle, useRef } from 'react';
import { cn } from '../../ui/utils';
import { MatchSwipeCardDesktop } from './match-swipe-card-desktop';
import { MatchSwipeCardMobile } from './match-swipe-card-mobile';
import type { MatchSwipeCardHandle, MatchSwipeCardProps } from './match-swipe-card-types';

export type { MatchSwipeCardHandle, MatchSwipeCardProps } from './match-swipe-card-types';

export const MatchSwipeCard = forwardRef<MatchSwipeCardHandle, MatchSwipeCardProps>(function MatchSwipeCard(
  props,
  ref,
) {
  const mobileRef = useRef<MatchSwipeCardHandle>(null);
  const desktopRef = useRef<MatchSwipeCardHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      pass: () => {
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
          desktopRef.current?.pass();
        } else {
          mobileRef.current?.pass();
        }
      },
      like: () => {
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
          desktopRef.current?.like();
        } else {
          mobileRef.current?.like();
        }
      },
    }),
    [],
  );

  return (
    <>
      <MatchSwipeCardMobile {...props} ref={mobileRef} className={cn(props.className, 'lg:hidden')} />
      <MatchSwipeCardDesktop {...props} ref={desktopRef} className={cn(props.className, 'hidden lg:block')} />
    </>
  );
});
