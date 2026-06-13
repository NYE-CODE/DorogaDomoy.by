import type { KeyboardEventHandler } from 'react';

/**
 * A11y / interaction class strings — синхронизированы с interaction.css.
 */

export const focusRingClass = 'focus-ring';

export const interactiveCardClass = 'interactive-card focus-ring';

export const transitionInteractiveClass = 'transition-interactive';

/** role="button" + tabIndex={0} — Enter / Space */
export function activateOnKeyboard(
  action?: () => void,
): KeyboardEventHandler<HTMLElement> {
  return (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action?.();
    }
  };
}
