import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { typoBody, typoCaption, typoH2, typoH3, typoH4, typoLink } from '@/shared/styles/typography-classes';
import { cn } from '@/shared/ui/utils';

interface BlogBodyProps {
  markdown: string;
}

export function BlogBody({ markdown }: BlogBodyProps) {
  return (
    <div className="blog-body max-w-none text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          /* Страница уже имеет h1 — markdown # → h2 */
          h1: ({ children }) => (
            <h2 className={cn(typoH2, 'mt-10 mb-4 first:mt-0')}>{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className={cn(typoH3, 'mt-8 mb-3')}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn(typoH4, 'mt-6 mb-2')}>{children}</h3>
          ),
          p: ({ children }) => (
            <p className={cn(typoBody, 'mb-4')}>{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className={cn(typoLink, 'font-medium')}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className={cn(typoBody, 'list-disc pl-6 mb-4 space-y-2')}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={cn(typoBody, 'list-decimal pl-6 mb-4 space-y-2')}>{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 my-6 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className?.includes('language-'));
            if (isBlock) {
              return (
                <code className="block bg-muted text-foreground rounded-lg p-4 text-sm overflow-x-auto my-4 font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            );
          },
          pre: ({ children }) => <pre className="my-4 overflow-x-auto">{children}</pre>,
          hr: () => <hr className="my-8 border-border" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border">{children}</th>
          ),
          td: ({ children }) => (
            <td className={cn(typoCaption, 'px-3 py-2 border-b border-border')}>{children}</td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
