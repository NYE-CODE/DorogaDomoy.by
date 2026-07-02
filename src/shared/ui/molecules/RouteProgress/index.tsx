import { Home } from 'lucide-react';
import { cn } from '@/shared/lib/classNames';
import type { RouteProgressProps } from './RouteProgress.types';

/**
 * «Дорога домой» — прогресс многошаговых форм: пунктирный маршрут с
 * точками-остановками, финальная точка — дом. Пройденный участок — сплошной
 * брендовый (оранжевый = движение к дому), впереди — пунктир.
 */
function RouteProgress({ totalSteps, currentStep, label, className, style }: RouteProgressProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep}
      aria-label={label}
      className={cn('flex w-full items-center', className)}
      style={style}
    >
      {steps.map((step) => {
        const isHome = step === totalSteps;
        const isDone = step < currentStep;
        const isCurrent = step === currentStep;
        const reached = isDone || isCurrent;

        return (
          <div key={step} className={cn('flex items-center', step > 1 ? 'flex-1' : 'flex-none')}>
            {step > 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-1 h-0 flex-1 border-t-2 transition-colors duration-200',
                  reached ? 'border-solid border-primary' : 'border-dashed border-switch-background',
                )}
              />
            )}
            {isHome ? (
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-7 flex-none items-center justify-center rounded-full border-2 transition-colors duration-200',
                  reached
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-switch-background bg-background text-muted-foreground',
                  isCurrent && 'ring-[3px] ring-primary/25',
                )}
              >
                <Home className="size-3.5" />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  'flex-none rounded-full transition-all duration-200',
                  isCurrent
                    ? 'size-3.5 bg-primary ring-[3px] ring-primary/25'
                    : isDone
                      ? 'size-2.5 bg-primary'
                      : 'size-2.5 border-2 border-switch-background bg-background',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { RouteProgress };
export type { RouteProgressProps } from './RouteProgress.types';
