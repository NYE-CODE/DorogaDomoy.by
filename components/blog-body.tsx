import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogBodyProps {
  markdown: string;
}

export function BlogBody({ markdown }: BlogBodyProps) {
  return (
    <div className="blog-body max-w-none text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-10 mb-4 first:mt-0 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-semibold mt-8 mb-3 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-muted-foreground leading-relaxed text-[15px] sm:text-base">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed text-[15px] sm:text-base">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 my-6 italic text-muted-foreground">{children}</blockquote>
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
          td: ({ children }) => <td className="px-3 py-2 border-b border-border text-muted-foreground">{children}</td>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
