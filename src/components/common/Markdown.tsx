'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = Readonly<{
  children: string;
  className?: string;
}>;

/**
 * Renders backend-supplied markdown (an agent's answer text, a knowledge
 * citation excerpt) as real elements instead of raw `**bold**`/`[text](url)`
 * syntax. `react-markdown` never uses `dangerouslySetInnerHTML` — it maps the
 * parsed AST to React elements itself, so this is safe against the content
 * being attacker-influenced (e.g. crawled page text) without needing a
 * separate sanitizer.
 *
 * Links always open in a new tab with `rel="noopener noreferrer"`: this
 * content points to citation sources or knowledge-base pages, never this
 * app's own routes.
 */
const COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:no-underline"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
};

export function Markdown({ children, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
