import { useCallback, useRef } from 'react';
import { useI18n } from '../context/I18nContext';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link2,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
} from 'lucide-react';

interface BlogMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  id?: string;
}

function insertAround(
  text: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string,
): { next: string; focusStart: number; focusEnd: number } {
  const sel = text.slice(start, end);
  const mid = sel || placeholder;
  const next = text.slice(0, start) + before + mid + after + text.slice(end);
  const focusStart = start + before.length;
  const focusEnd = focusStart + mid.length;
  return { next, focusStart, focusEnd };
}

function prefixLinesAtSelection(text: string, start: number, end: number, prefix: string): { next: string; focusStart: number; focusEnd: number } {
  const a = Math.min(start, end);
  const b = Math.max(start, end);
  const lineStart = text.lastIndexOf('\n', a - 1) + 1;
  let lineEnd = text.indexOf('\n', b);
  if (lineEnd === -1) lineEnd = text.length;
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split('\n');
  const prefixedLines = lines.map((line) => (line.trim() === '' ? line : prefix + line));
  const next = text.slice(0, lineStart) + prefixedLines.join('\n') + text.slice(lineEnd);
  const delta = prefixedLines.join('\n').length - block.length;
  return {
    next,
    focusStart: lineStart,
    focusEnd: lineEnd + delta,
  };
}

export function BlogMarkdownEditor({ value, onChange, rows = 14, id }: BlogMarkdownEditorProps) {
  const { t } = useI18n();
  const b = t.landing.blog;
  const taRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const rememberSelection = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    selectionRef.current = {
      start: ta.selectionStart ?? 0,
      end: ta.selectionEnd ?? 0,
    };
  }, []);

  const apply = useCallback(
    (fn: (text: string, s: number, e: number) => { next: string; focusStart: number; focusEnd: number }) => {
      const text = value;
      const ta = taRef.current;
      const fallbackStart = selectionRef.current.start ?? text.length;
      const fallbackEnd = selectionRef.current.end ?? text.length;
      const s = ta?.selectionStart ?? fallbackStart;
      const e = ta?.selectionEnd ?? fallbackEnd;
      const { next, focusStart, focusEnd } = fn(text, s, e);
      onChange(next);
      selectionRef.current = { start: focusStart, end: focusEnd };
      requestAnimationFrame(() => {
        const el = taRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(focusStart, focusEnd);
      });
    },
    [value, onChange],
  );

  const toolbarBtn =
    'inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-muted dark:hover:bg-gray-700 shrink-0 disabled:opacity-40';

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-600 bg-muted/50 dark:bg-gray-800/80">
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdBold}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            apply((tx, s, e) => insertAround(tx, s, e, '**', '**', b.mdPhBold))
          }
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdItalic}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply((tx, s, e) => insertAround(tx, s, e, '*', '*', b.mdPhItalic))}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdH2}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply((tx, s, e) => prefixLinesAtSelection(tx, s, e, '## '))}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdH3}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply((tx, s, e) => prefixLinesAtSelection(tx, s, e, '### '))}
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdLink}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            apply((tx, s, e) => {
              const url =
                typeof window !== 'undefined' ? window.prompt(b.mdPromptLinkUrl, b.mdPhUrl) : null;
              if (url === null) return { next: tx, focusStart: s, focusEnd: e };
              const sel = tx.slice(s, e);
              const label = sel || b.mdPhLinkText;
              const md = `[${label}](${url})`;
              const next = tx.slice(0, s) + md + tx.slice(e);
              return { next, focusStart: s, focusEnd: s + md.length };
            })
          }
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdList}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply((tx, s, e) => prefixLinesAtSelection(tx, s, e, '- '))}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdOrderedList}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply((tx, s, e) => prefixLinesAtSelection(tx, s, e, '1. '))}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdQuote}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply((tx, s, e) => prefixLinesAtSelection(tx, s, e, '> '))}
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdCode}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply((tx, s, e) => insertAround(tx, s, e, '`', '`', b.mdCodePh))}
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title={b.mdHr}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            apply((tx, s, e) => {
              const ins = '\n\n---\n\n';
              const next = tx.slice(0, s) + ins + tx.slice(e);
              const pos = s + ins.length;
              return { next, focusStart: pos, focusEnd: pos };
            })
          }
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
      <textarea
        ref={taRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onFocus={rememberSelection}
        rows={rows}
        className="w-full px-3 py-2.5 dark:bg-gray-700 dark:text-white font-mono text-sm resize-y min-h-[200px] border-0 focus:ring-0 focus:outline-none"
        spellCheck
      />
    </div>
  );
}
