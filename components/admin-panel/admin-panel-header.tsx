import { ArrowLeft } from 'lucide-react';

type AdminPanelHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
};

export function AdminPanelHeader({ title, subtitle, onBack }: AdminPanelHeaderProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="page-container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg sm:typo-h3">{title}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
