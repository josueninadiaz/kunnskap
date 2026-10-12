import ReactMarkdown, { type Components } from 'react-markdown'

/*
 * Renderizado seguro de Markdown: el HTML incrustado se descarta (skipHtml) y react-markdown
 * neutraliza URLs peligrosas (javascript:, data:). Nunca se usa dangerouslySetInnerHTML.
 */
const components: Components = {
  a: ({ href, children }) => {
    const external = href?.startsWith('http')
    return (
      <a
        href={href}
        className="font-medium text-accent underline"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  },
  code: ({ children }) => (
    <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-(--radius-control) border border-border bg-surface-muted p-4 text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-accent bg-accent-soft px-4 py-3 text-fg [&_p]:m-0">{children}</blockquote>
  ),
  h3: ({ children }) => <h3 className="pt-2 text-lg font-semibold">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 marker:text-accent">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  img: ({ src, alt }) => <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" className="max-w-full" />,
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 [&_strong]:font-semibold">
      <ReactMarkdown skipHtml components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
