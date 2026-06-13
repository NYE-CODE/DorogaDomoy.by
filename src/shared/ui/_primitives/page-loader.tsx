import { cn } from '@/shared/lib/classNames';
import { Spinner } from '@/shared/ui/atoms/Spinner';

interface PageLoaderProps {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  fullHeight?: boolean;
}

/** Полноэкранный или локальный loader страницы. */
export function PageLoader({
  label = 'Загрузка...',
  className,
  style,
  fullHeight = true,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        fullHeight ? 'min-h-screen' : 'min-h-[240px]',
        'bg-background flex items-center justify-center px-4',
        className,
      )}
      style={style}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner size="lg" label={label} />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
