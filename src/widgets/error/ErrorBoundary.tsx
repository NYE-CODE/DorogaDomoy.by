import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { getHomePath } from '@/shared/lib/home-route';
import { useI18n } from '@/app/providers/I18nContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorBoundaryFallback() {
  const { t } = useI18n();
  const eb = t.common.errorBoundary;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="typo-h2">{eb.title}</h1>
        <p className="text-muted-foreground">{eb.description}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            className={appPrimaryCtaClass}
            onClick={() => window.location.reload()}
          >
            {eb.reload}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={getHomePath()}>{eb.home}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Перехват необработанных ошибок рендера — fallback вместо белого экрана. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <ErrorBoundaryFallback />;
  }
}
