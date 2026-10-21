import type { ReactNode } from 'react';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { pageContainerNarrow } from '@/shared/styles/layout-classes';
import {
  surfacePage,
  surfacePanel,
  surfaceStepBar,
} from '@/shared/styles/surface-classes';
import { cn } from '@/shared/lib/classNames';

type AdFormPageShellProps = {
  stepHeader?: ReactNode;
  children: ReactNode;
  /** Модалки / порталы — вне карточки контента. */
  overlay?: ReactNode;
  /** Без карточки — только фон и контейнер (редко). */
  bare?: boolean;
  className?: string;
};

/**
 * Общий каркас страниц создания / редактирования объявления
 * в визуальном языке лендинга и поиска.
 */
export function AdFormPageShell({
  stepHeader,
  children,
  overlay,
  bare = false,
  className,
}: AdFormPageShellProps) {
  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage, className)}>
      <Header />
      {stepHeader ? <div className={surfaceStepBar}>{stepHeader}</div> : null}
      <main className="flex-1 px-4 py-6 sm:py-8">
        <div className={cn(pageContainerNarrow, 'mx-auto')}>
          {bare ? (
            children
          ) : (
            <div className={cn(surfacePanel, 'p-5 sm:p-8')}>{children}</div>
          )}
        </div>
      </main>
      {overlay}
      <Footer />
    </div>
  );
}
